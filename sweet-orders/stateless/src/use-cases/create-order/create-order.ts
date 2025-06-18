import {
  OrderEvent,
  schema as orderEventSchema,
} from '@schemas/order-event/order-event';
import { Order, schema as orderSchema } from '@schemas/order/order';
import { getISOString, logger, stripInternalKeys } from '@shared';

import { CreateOrderRequest } from '@adapters/primary/create-order/create-order.schema';
import { upsert } from '@adapters/secondary/dynamodb-adapter';
import { config } from '@config';
import { entityTypes } from '@dto/entity-types';
import { v4 as uuid } from 'uuid';

const tableName = config.get('tableName');

export async function createOrderUseCase(
  order: CreateOrderRequest,
): Promise<Order> {
  const createdDate = getISOString();
  const orderId = uuid();
  const orderEventId = uuid();

  // no mapper here - lets keep it simple for the example only
  const createdOrder: Order = orderSchema.parse({
    ...order,
    id: orderId,
    pk: `ORDER#${orderId}`,
    sk: `ORDER#${orderId}`,
    created: createdDate,
    updated: createdDate,
    type: entityTypes.ORDER,
    status: 'PENDING',
  });

  const orderEvent: OrderEvent = orderEventSchema.parse({
    pk: `ORDER#${orderId}`,
    sk: `ORDER_EVENT#${createdDate}#${orderEventId}`,
    orderId: orderId,
    id: orderEventId,
    created: createdDate,
    type: entityTypes.ORDER_EVENT,
    eventType: 'ORDER_PLACED',
    message: `Order ${orderId} has been placed.`,
  });

  // write the order to the database
  await upsert<Order>(createdOrder, tableName, createdOrder.id);

  // write the order event to the database
  await upsert<OrderEvent>(orderEvent, tableName, orderEvent.id);

  logger.info(`order created with id: ${createdOrder.id}`);

  // strip off internal keys before returning
  return stripInternalKeys(createdOrder) as Order;
}
