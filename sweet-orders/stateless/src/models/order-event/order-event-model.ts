import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

import { logger } from '@shared/logger';

export interface OrderEventAttributes {
  id: string;
  type: 'ORDER_EVENT';
  eventType:
    | 'ORDER_PLACED'
    | 'ORDER_CONFIRMED'
    | 'ORDER_SHIPPED'
    | 'ORDER_DELIVERED'
    | 'ORDER_CANCELLED'
    | 'ORDER_RETURNED'
    | 'ORDER_UPDATED';
  created: string;
  message?: string;
  orderId: string;
}

type OrderEventCreationAttributes = Optional<OrderEventAttributes, 'message'>;

export class OrderEvent
  extends Model<OrderEventAttributes, OrderEventCreationAttributes>
  implements OrderEventAttributes
{
  public id!: string;
  public type!: 'ORDER_EVENT';
  public eventType!: OrderEventAttributes['eventType'];
  public created!: string;
  public message?: string;
  public orderId!: string;
}

export function initOrderEventModel(sequelize: Sequelize): typeof OrderEvent {
  logger.info('Initialising OrderEvent model');

  OrderEvent.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, field: 'id' },
      type: { type: DataTypes.STRING, allowNull: false, field: 'type' },
      eventType: {
        type: DataTypes.ENUM(
          'ORDER_PLACED',
          'ORDER_CONFIRMED',
          'ORDER_SHIPPED',
          'ORDER_DELIVERED',
          'ORDER_CANCELLED',
          'ORDER_RETURNED',
        ),
        allowNull: false,
        field: 'event_type',
      },
      created: { type: DataTypes.STRING, allowNull: false, field: 'created' },
      message: { type: DataTypes.STRING, allowNull: true, field: 'message' },
      orderId: { type: DataTypes.STRING, allowNull: false, field: 'order_id' },
    },
    {
      sequelize,
      tableName: 'order_events',
      timestamps: false,
    },
  );

  return OrderEvent;
}
