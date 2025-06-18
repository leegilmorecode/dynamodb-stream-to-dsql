import { Order, OrderEvent, Product } from '@models';

import { entityTypes } from '@dto/entity-types';
import { Order as ddbOrder } from '@schemas/order';
import { OrderEvent as ddbOrderEvent } from '@schemas/order-event';
import { Product as ddbProduct } from '@schemas/product';
import { logger } from '@shared';

export type Item = ddbOrder | ddbProduct | ddbOrderEvent;

export async function processStreamUseCase(
  item: Item,
  eventName: string,
): Promise<void> {
  logger.info(
    `Processing stream event: ${eventName}, item: ${JSON.stringify(item)}`,
  );

  const { id, pk, type } = item;

  if (!id) {
    logger.warn('Missing ID from item');
    return;
  }

  if (type === entityTypes.ORDER) {
    const orderItem = item as ddbOrder;

    if (eventName === 'REMOVE') {
      logger.info(`Removing order item: ${JSON.stringify(orderItem)}`);
      await Order.destroy({ where: { id } });
    } else {
      logger.info(`Processing order item: ${JSON.stringify(orderItem)}`);
      await Order.upsert({
        id: orderItem.id,
        customerName: orderItem.customerName,
        contactEmail: orderItem.contactEmail,
        contactPhone: orderItem.contactPhone ?? undefined,
        deliveryAddress: orderItem.deliveryAddress
          ? JSON.stringify(orderItem.deliveryAddress)
          : undefined,
        orderItems: JSON.stringify(orderItem.orderItems),
        deliveryInstructions: orderItem.deliveryInstructions ?? undefined,
        paymentMethod: orderItem.paymentMethod ?? undefined,
        type: orderItem.type,
        created: orderItem.created,
        updated: orderItem.updated,
        status: orderItem.status,
      });
    }
  } else if (type === entityTypes.PRODUCT) {
    const productItem = item as ddbProduct;

    if (eventName === 'REMOVE') {
      logger.info(`Removing product item: ${JSON.stringify(productItem)}`);
      await Product.destroy({ where: { id } });
    } else {
      logger.info(`Processing product item: ${JSON.stringify(productItem)}`);
      await Product.upsert({
        id: productItem.id,
        name: productItem.name,
        type: productItem.type,
        description: productItem.description,
        price: productItem.price,
        category: productItem.category,
        stockQuantity: productItem.stockQuantity,
        sku: productItem.sku,
        tags: productItem.tags ? JSON.stringify(productItem.tags) : undefined,
        imageUrl: productItem.imageUrl ?? undefined,
        created: productItem.created,
        updated: productItem.updated,
      });
    }
  } else if (type === entityTypes.ORDER_EVENT) {
    const orderEvent = item as ddbOrderEvent;

    if (eventName === 'REMOVE') {
      logger.info(`Removing order event item: ${JSON.stringify(orderEvent)}`);
      await OrderEvent.destroy({ where: { id } });
    } else {
      logger.info(`Processing order event item: ${JSON.stringify(orderEvent)}`);
      await OrderEvent.upsert({
        id: orderEvent.id,
        orderId: orderEvent.orderId,
        created: orderEvent.created,
        type: orderEvent.type,
        eventType: orderEvent.eventType,
        message: orderEvent.message ?? undefined,
      });
    }
  } else {
    logger.warn(`Unhandled pk type: ${pk}`);
  }
}
