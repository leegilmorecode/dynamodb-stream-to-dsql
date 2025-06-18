import { Order, initOrderModel } from '@models/order';
import { OrderEvent, initOrderEventModel } from '@models/order-event';
import { Product, initProductModel } from '@models/product';

import { Sequelize } from 'sequelize';

let initialized = false;

export async function initModels(sequelize: Sequelize) {
  if (initialized) return;

  initOrderModel(sequelize);
  initProductModel(sequelize);
  initOrderEventModel(sequelize);

  // we define our relationships here
  Order.hasMany(OrderEvent, {
    foreignKey: 'orderId',
    sourceKey: 'id',
    as: 'events',
    constraints: false,
  });

  OrderEvent.belongsTo(Order, {
    foreignKey: 'orderId',
    targetKey: 'id',
    as: 'order',
    constraints: false,
  });

  initialized = true;
}

export { Order, OrderEvent, Product };
