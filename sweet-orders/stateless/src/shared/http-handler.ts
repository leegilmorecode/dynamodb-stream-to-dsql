import { errorHandler, getHeaders, logger } from '@shared';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { config } from '@config';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';

const tracer = new Tracer();

const stage = config.get('stage');
const metrics = new Metrics();

type HandlerFnArgs = {
  event: APIGatewayProxyEvent;
  metrics: Metrics;
  stage: string;
};

type HandlerFn = (args: HandlerFnArgs) => Promise<{
  statusCode?: number;
  body: unknown;
}>;

export function withHttpHandler(handlerFn: HandlerFn) {
  const baseHandler = async (
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const result = await handlerFn({ event, metrics, stage });

      return {
        statusCode: result.statusCode ?? 200,
        headers: getHeaders(stage),
        body: JSON.stringify(result.body),
      };
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      return errorHandler(error);
    }
  };

  return middy(baseHandler)
    .use(injectLambdaContext(logger))
    .use(captureLambdaHandler(tracer))
    .use(logMetrics(metrics))
    .use(httpErrorHandler({ fallbackMessage: 'An error has occurred' }));
}
