import { createSequelizeInstance } from '@shared/dsql-common';
import { GetOrdersRequest, schema } from './get-orders.schema';

import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { logger } from '@shared';
import { withHttpHandler } from '@shared/http-handler';
import { getOrdersUseCase } from '@use-cases/get-orders';

let connectionInitialized = false;

export const handler = withHttpHandler(async ({ event, metrics }) => {
  try {
    if (!connectionInitialized) {
      logger.info('Initialising Sequelize connection');
      await createSequelizeInstance();
      connectionInitialized = true;
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};

    const params: GetOrdersRequest = schema.parse({
      page: queryParams.page ? Number(queryParams.page) : undefined,
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
      status: queryParams.status?.toUpperCase(),
      customerId: queryParams.customerId,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      customerName: queryParams.customerName,
      contactEmail: queryParams.contactEmail,
      paymentMethod: queryParams.paymentMethod,
    });

    const { orders, totalCount } = await getOrdersUseCase(params);

    metrics.addMetric('SuccessfulGetOrders', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: {
        orders,
        totalCount,
        currentPage: params.page,
        totalPages: Math.ceil(totalCount / params.limit),
      },
    };
  } catch (error) {
    logger.error(`Error:, ${error}`);
    metrics.addMetric('GetOrdersError', MetricUnit.Count, 1);
    throw error;
  }
});
