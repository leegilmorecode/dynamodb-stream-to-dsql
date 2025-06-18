import { GetOrderEventsRequest } from '@adapters/primary/get-order-events/get-order-events.schema';
import { OrderEvent } from '@models/order-event';
import { logger } from '@shared';
import { WhereOptions } from 'sequelize';

export const getOrderEventsUseCase = async (params: GetOrderEventsRequest) => {
  logger.info('Fetching order events with params', { params });

  const { page, limit, orderId, eventType } = params;

  const whereClause: WhereOptions<OrderEvent> = {};

  // these are the events for a specific order
  whereClause.orderId = orderId;

  if (eventType) {
    whereClause.eventType = eventType;
  }

  // Get total count for pagination
  const totalCount = await OrderEvent.count({
    where: whereClause,
  });

  // Get all records
  const orderEvents = await OrderEvent.findAll({
    where: whereClause,
    offset: (page - 1) * limit,
    limit: limit,
    order: [['created', 'DESC']],
  });

  return { orderEvents, totalCount };
};
