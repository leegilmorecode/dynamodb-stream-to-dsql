import { updateById, upsert } from '@adapters/secondary/dynamodb-adapter';
import {
  OrderEvent,
  schema as orderEventSchema,
} from '@schemas/order-event/order-event';
import { getISOString, logger, stripInternalKeys } from '@shared';

import { UpdateOrderRequest } from '@adapters/primary/update-order/update-order.schema';
import { config } from '@config';
import { entityTypes } from '@dto/entity-types';
import { Order } from '@schemas/order';
import { v4 as uuid } from 'uuid';

const tableName = config.get('tableName');

export async function updateOrderUseCase(
  orderId: string,
  updateOrder: UpdateOrderRequest,
): Promise<Order> {
  try {
    logger.info('Updating order status', {
      orderId,
      status: updateOrder.status,
    });

    const orderEventId = uuid();
    const createdDate = getISOString();

    // update the order status in the database
    const updatedOrder: Order = await updateById<Order>(
      tableName,
      { status: updateOrder.status },
      'pk',
      `ORDER#${orderId}`,
      'sk',
      `ORDER#${orderId}`,
    );

    // create the order event record
    const orderEvent: OrderEvent = orderEventSchema.parse({
      pk: `ORDER#${orderId}`,
      sk: `ORDER_EVENT#${createdDate}#${orderEventId}`,
      orderId: orderId,
      id: orderEventId,
      created: createdDate,
      type: entityTypes.ORDER_EVENT,
      eventType: 'ORDER_UPDATED',
      message: `Order ${orderId} has been updated with status ${updateOrder.status}.`,
    });

    // write the order event to the database
    await upsert<OrderEvent>(orderEvent, tableName, orderEvent.id);

    logger.info(`order updated with id: ${orderId}`);

    // strip off internal keys before returning
    return stripInternalKeys(updatedOrder) as Order;
  } catch (error) {
    logger.error('Error updating order status', { error });
    throw error;
  }
}
