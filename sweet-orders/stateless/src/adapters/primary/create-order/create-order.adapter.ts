import { CreateOrderRequest, schema } from './create-order.schema';

import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { ValidationError } from '@errors/validation-error';
import { withHttpHandler } from '@shared/http-handler';
import { createOrderUseCase } from '@use-cases/create-order';

export const handler = withHttpHandler(async ({ event, metrics }) => {
  try {
    if (!event.body) throw new ValidationError('no payload body');

    const order: CreateOrderRequest = schema.parse(JSON.parse(event.body));

    const created = await createOrderUseCase(order);

    metrics.addMetric('SuccessfulCreateOrder', MetricUnit.Count, 1);

    return {
      statusCode: 201,
      body: created,
    };
  } catch (error) {
    metrics.addMetric('CreateOrderError', MetricUnit.Count, 1);
    throw error;
  }
});
