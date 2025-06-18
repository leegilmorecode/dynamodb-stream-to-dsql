import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { createSequelizeInstance } from '@shared/dsql-common';

import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { logger } from '@shared/logger';
import { createTablesUseCase } from '@use-cases/create-tables';

const metrics = new Metrics();
const tracer = new Tracer();

let connectionInitialized = false;

const createTablesHandler = async (): Promise<void> => {
  try {
    if (!connectionInitialized) {
      logger.info('Initialising Sequelize connection');
      await createSequelizeInstance();
      connectionInitialized = true;
    }

    await createTablesUseCase();
  } catch (error) {
    logger.error(`Error: ${error}`);
    metrics.addMetric('CreateTablesError', MetricUnit.Count, 1);
    throw error;
  }
};

export const handler = middy(createTablesHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
