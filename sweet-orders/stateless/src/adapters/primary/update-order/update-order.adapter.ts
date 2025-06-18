import { UpdateOrderRequest, schema } from './update-order.schema';

import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { ValidationError } from '@errors/validation-error';
import { logger } from '@shared';
import { withHttpHandler } from '@shared/http-handler';
import { updateOrderUseCase } from '@use-cases/update-order';

export const handler = withHttpHandler(async ({ event, metrics }) => {
  try {
    const orderId = event.pathParameters?.orderId;

    if (!orderId) throw new ValidationError('Order ID is required');

    if (!event.body) throw new ValidationError('no payload body');

    const updateOrder: UpdateOrderRequest = schema.parse(
      JSON.parse(event.body),
    );

    const updated = await updateOrderUseCase(orderId, updateOrder);

    metrics.addMetric('SuccessfulUpdateOrder', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: updated,
    };
  } catch (error) {
    logger.error(`Error:, ${error}`);
    metrics.addMetric('UpdateOrderError', MetricUnit.Count, 1);
    throw error;
  }
});
