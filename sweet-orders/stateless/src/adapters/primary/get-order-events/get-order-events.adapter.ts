import { GetOrderEventsRequest, schema } from './get-order-events.schema';

import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { logger } from '@shared';
import { createSequelizeInstance } from '@shared/dsql-common';
import { withHttpHandler } from '@shared/http-handler';
import { getOrderEventsUseCase } from '@use-cases/get-order-events';

let connectionInitialized = false;

export const handler = withHttpHandler(async ({ event, metrics }) => {
  try {
    if (!connectionInitialized) {
      logger.info('Initialising Sequelize connection');
      await createSequelizeInstance();
      connectionInitialized = true;
    }

    logger.info('Connection to Sequelize already initialized');

    // Parse path and query parameters
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    const params: GetOrderEventsRequest = schema.parse({
      orderId: pathParams.orderId,
      eventType: queryParams.eventType ? queryParams.eventType : undefined,
      page: queryParams.page ? Number(queryParams.page) : undefined,
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
    });

    const { orderEvents, totalCount } = await getOrderEventsUseCase(params);

    metrics.addMetric('GetOrderEventsSuccess', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: {
        orderEvents,
        totalCount,
        currentPage: params.page,
        totalPages: Math.ceil(totalCount / params.limit),
      },
    };
  } catch (error) {
    logger.error(`Error:, ${error}`);
    metrics.addMetric('GetOrderEventsError', MetricUnit.Count, 1);
    throw error;
  }
});
