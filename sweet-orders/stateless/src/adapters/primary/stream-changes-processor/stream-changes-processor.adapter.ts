import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import middy from '@middy/core';

import type {
  DynamoDBRecord,
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
} from 'aws-lambda';

import { logger } from '@shared';
import { createSequelizeInstance } from '@shared/dsql-common';
import {
  processStreamUseCase,
  type Item,
} from '@use-cases/stream-changes-processor';

const tracer = new Tracer();
const metrics = new Metrics();
const processor = new BatchProcessor(EventType.DynamoDBStreams);

let connectionInitialized = false;
type StreamRecord = Record<string, AttributeValue>;

const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
  try {
    const { dynamodb, eventName } = record;

    if (
      !dynamodb ||
      !dynamodb.Keys ||
      (!dynamodb.NewImage && eventName !== 'REMOVE') ||
      !eventName
    ) {
      logger.warn('Skipping incomplete record');
      return;
    }

    const streamImage =
      eventName === 'REMOVE' ? dynamodb.OldImage : dynamodb.NewImage;

    if (!streamImage) {
      logger.warn('Missing stream image');
      return;
    }

    const item = unmarshall(streamImage as StreamRecord) as Item;

    logger.info(`Processing ${eventName} for item:`, { item });

    await processStreamUseCase(item, eventName);
    metrics.addMetric('StreamChangesProcessorSuccess', MetricUnit.Count, 1);
  } catch (error) {
    metrics.addMetric('StreamChangesProcessorError', MetricUnit.Count, 1);
    logger.error('Failed to process record', {
      messageId: record.eventID,
      error,
    });
    throw error;
  }
};

const baseHandler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent,
  context,
) => {
  if (!connectionInitialized) {
    logger.info('Initialising Sequelize connection');
    await createSequelizeInstance();
    connectionInitialized = true;
  }

  return processPartialResponse(event, recordHandler, processor, {
    context,
  });
};

export const handler = middy(baseHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
