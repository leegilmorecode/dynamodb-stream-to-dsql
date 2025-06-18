import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

import { logger } from '@shared/logger';

export interface OrderAttributes {
  id: string;
  created: string;
  updated: string;
  type: string;
  customerName: string;
  contactEmail: string;
  contactPhone?: string;
  deliveryAddress?: string;
  orderItems: string;
  deliveryInstructions?: string;
  paymentMethod?: 'credit_card' | 'paypal' | 'apple_pay' | 'cash_on_delivery';
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

type OrderCreationAttributes = Optional<
  OrderAttributes,
  'contactPhone' | 'deliveryAddress' | 'deliveryInstructions' | 'paymentMethod'
>;

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: string;
  public created!: string;
  public updated!: string;
  public type!: string;
  public customerName!: string;
  public contactEmail!: string;
  public contactPhone?: string;
  public deliveryAddress?: OrderAttributes['deliveryAddress'];
  public orderItems!: OrderAttributes['orderItems'];
  public deliveryInstructions?: string;
  public paymentMethod?: OrderAttributes['paymentMethod'];
  public status: OrderAttributes['status'];
}

export function initOrderModel(sequelize: Sequelize): typeof Order {
  logger.info('Initialising Order model');
  Order.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, field: 'id' },
      created: { type: DataTypes.STRING, field: 'created' },
      updated: { type: DataTypes.STRING, field: 'updated' },
      type: { type: DataTypes.STRING, field: 'type' },
      customerName: { type: DataTypes.STRING, field: 'customer_name' },
      contactEmail: { type: DataTypes.STRING, field: 'contact_email' },
      contactPhone: { type: DataTypes.STRING, field: 'contact_phone' },
      deliveryAddress: { type: DataTypes.TEXT, field: 'delivery_address' },
      orderItems: { type: DataTypes.TEXT, field: 'order_items' },
      deliveryInstructions: {
        type: DataTypes.STRING,
        field: 'delivery_instructions',
      },
      paymentMethod: { type: DataTypes.STRING, field: 'payment_method' },
      status: {
        type: DataTypes.STRING,
        field: 'status',
        defaultValue: 'PENDING',
      },
    },
    {
      sequelize,
      tableName: 'orders',
      timestamps: false,
    },
  );

  return Order;
}
