import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { config } from '@config';
import { initModels } from '@models';
import { logger } from '@shared';
import pg from 'pg';
import { Sequelize } from 'sequelize';

const clusterId = config.get('clusterId');
const region = config.get('region');
const databaseUser = config.get('databaseUser');
const databasePort = config.get('databasePort');
const databaseLogging = config.get('databaseLogging');

let sequelize: Sequelize | null = null;
let connectionPoolCreatedTime: number | null = null;
let cachedToken: { token: string; expiresAt: number } | null = null;

function generateDsqlEndpoint(clusterId: string, region: string): string {
  if (!clusterId || typeof clusterId !== 'string') {
    throw new Error('ClusterId must be a non-empty string');
  }
  if (!region || typeof region !== 'string') {
    throw new Error('Region must be a non-empty string');
  }
  return `${clusterId}.dsql.${region}.on.aws`;
}

async function getPasswordToken(
  host: string,
  user: string,
  region: string,
): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now) {
    logger.debug(`Using cached token for user ${user}`);
    // Return cached token if it is still valid
    return cachedToken.token;
  }
  logger.debug(`Generating new cached token for user ${user}`);

  const signer = new DsqlSigner({ hostname: host, region });

  let token: string;

  if (user === 'admin') {
    token = await signer.getDbConnectAdminAuthToken();
  } else {
    (signer as any).user = user;
    token = await signer.getDbConnectAuthToken();
  }

  // token valid for 15 mins
  cachedToken = {
    token,
    expiresAt: now + 15 * 60 * 1000,
  };

  return token;
}

export async function createSequelizeInstance(): Promise<Sequelize> {
  // Check if connection pool exists and is within 15-minute window
  if (
    sequelize &&
    connectionPoolCreatedTime &&
    Date.now() - connectionPoolCreatedTime < 15 * 60 * 1000
  ) {
    sequelize.connectionManager.initPools();
    return sequelize;
  }

  // Close existing connection if it exists
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }

  const host = generateDsqlEndpoint(clusterId, region);

  sequelize = new Sequelize('postgres', databaseUser, '', {
    host,
    port: databasePort,
    dialect: 'postgres',
    dialectModule: pg,
    logging: databaseLogging ? console.log : false,
    define: { timestamps: false },
    dialectOptions: {
      user: databaseUser,
      clientMinMessages: 'ignore',
      skipIndexes: true,
      ssl: {
        rejectUnauthorized: true,
      },
    },
    pool: {
      max: 1,
      min: 0,
      idle: 0,
      acquire: 3000,
      evict: 900000, // 15 minutes in milliseconds
    },
    hooks: {
      beforeConnect: async (config) => {
        const token = await getPasswordToken(host, databaseUser, region);
        config.password = token;
      },
      afterConnect: async (connection) => {
        logger.info('Successfully opened DSQL connection');
        await (connection as any).query('SET search_path TO public');
      },
    },
  });

  logger.info('Initialising Sequelize models');
  await initModels(sequelize);

  // Update connection creation time
  connectionPoolCreatedTime = Date.now();

  return sequelize;
}

export async function closeSequelizeConnection(): Promise<void> {
  if (sequelize) {
    logger.info('closing Sequelize connection');
    try {
      await sequelize.close();
    } catch (err) {
      logger.error(`error closing Sequelize connection: ${err}`);
    }
    sequelize = null;
  }

  connectionPoolCreatedTime = null;

  logger.debug('Sequelize connection and cached values have been reset');
}
