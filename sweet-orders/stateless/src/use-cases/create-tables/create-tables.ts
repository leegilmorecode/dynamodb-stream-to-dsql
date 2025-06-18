import { Order, OrderEvent, Product } from '@models';

import { logger } from '@shared/logger';
import { QueryTypes } from 'sequelize';

const ORDER_TABLE_CREATE = `
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  created VARCHAR(255),
  updated VARCHAR(255),
  type VARCHAR(255),
  customer_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  delivery_address TEXT,
  order_items TEXT,
  delivery_instructions VARCHAR(255),
  payment_method VARCHAR(255),
  order_date VARCHAR(255),
  status VARCHAR(255)
);
`;

const PRODUCT_TABLE_CREATE = `
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(255),
  description VARCHAR(255),
  price FLOAT,
  category VARCHAR(255),
  stock_quantity INTEGER,
  sku VARCHAR(255),
  tags TEXT,
  image_url VARCHAR(255),
  created VARCHAR(255),
  updated VARCHAR(255)
);
`;

const ORDER_EVENT_TABLE_CREATE = `
CREATE TABLE IF NOT EXISTS order_events (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255),
  type VARCHAR(255),
  event_type VARCHAR(255),
  message TEXT,
  created VARCHAR(255)
);
`;

export async function createTablesUseCase(): Promise<void> {
  logger.info('Creating tables if they dont exist');

  try {
    if (!Order.sequelize || !Product.sequelize || !OrderEvent.sequelize) {
      throw new Error('Sequelize instance is not attached to models');
    }

    await Order.sequelize.query(ORDER_TABLE_CREATE, {
      type: QueryTypes.RAW,
    });
    logger.info('Orders table created successfully');

    await Product.sequelize.query(PRODUCT_TABLE_CREATE, {
      type: QueryTypes.RAW,
    });
    logger.info('Products table created successfully');

    await OrderEvent.sequelize.query(ORDER_EVENT_TABLE_CREATE, {
      type: QueryTypes.RAW,
    });
    logger.info('OrderEvents table created successfully');
  } catch (error) {
    logger.error('Error creating tables', { error });
    throw error;
  }
}

export default createTablesUseCase;
