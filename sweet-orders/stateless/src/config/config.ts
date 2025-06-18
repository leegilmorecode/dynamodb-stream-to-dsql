const convict = require('convict');

export const config = convict({
  // shared config
  stage: {
    doc: 'The stage being deployed',
    format: String,
    default: '',
    env: 'STAGE',
  },
  region: {
    doc: 'The AWS region',
    format: String,
    default: '',
    env: 'REGION',
  },
  // stateful config
  clusterId: {
    doc: 'The cluster identifier',
    format: String,
    default: '',
    env: 'CLUSTER_ID',
  },
  databaseUser: {
    doc: 'The database user to connect with',
    format: String,
    default: 'admin',
    env: 'DATABASE_USER',
  },
  databasePort: {
    doc: 'The database port to connect to',
    format: 'port',
    default: 5432,
    env: 'DATABASE_PORT',
  },
  databaseLogging: {
    doc: 'Whether to log database SQL queries',
    format: Boolean,
    default: true,
    env: 'DATABASE_LOGGING',
  },
  tableName: {
    doc: 'The database table where we store items',
    format: String,
    default: '',
    env: 'TABLE_NAME',
  },
}).validate({ allowed: 'strict' });
