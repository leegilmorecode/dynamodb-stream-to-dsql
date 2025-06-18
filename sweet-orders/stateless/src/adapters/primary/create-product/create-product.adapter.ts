import { CreateProductRequest, schema } from './create-product.schema';

import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { ValidationError } from '@errors/validation-error';
import { withHttpHandler } from '@shared/http-handler';
import { createProductUseCase } from '@use-cases/create-product';

export const handler = withHttpHandler(async ({ event, metrics }) => {
  try {
    if (!event.body) throw new ValidationError('no payload body');

    const product: CreateProductRequest = schema.parse(JSON.parse(event.body));

    const created = await createProductUseCase(product);

    metrics.addMetric('SuccessfulCreateProduct', MetricUnit.Count, 1);

    return {
      statusCode: 201,
      body: created,
    };
  } catch (error) {
    metrics.addMetric('CreateProductError', MetricUnit.Count, 1);
    throw error;
  }
});
