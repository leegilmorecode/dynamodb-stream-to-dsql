import { OrderAttributes, Order as OrderModel } from '@models/order';

import { GetOrdersRequest } from '@adapters/primary/get-orders/get-orders.schema';
import { logger } from '@shared';
import { Op, WhereOptions } from 'sequelize';

export async function getOrdersUseCase(
  params: GetOrdersRequest,
): Promise<{ orders: OrderAttributes[]; totalCount: number }> {
  try {
    logger.info('Fetching orders with params', { params });

    const {
      page,
      limit,
      status,
      startDate,
      endDate,
      contactEmail,
      customerName,
      paymentMethod,
    } = params;

    const whereClause: WhereOptions<OrderModel> = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.created = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    } else if (startDate) {
      whereClause.created = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.created = { [Op.lte]: endDate };
    }

    if (contactEmail) {
      whereClause.contactEmail = { [Op.iLike]: `%${contactEmail}%` };
    }

    if (customerName) {
      whereClause.customerName = { [Op.iLike]: `%${customerName}%` };
    }

    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    // Get total count for pagination
    const totalCount = await OrderModel.count({ where: whereClause });

    // Get paginated results
    const orders = await OrderModel.findAll({
      where: whereClause,
      offset: (page - 1) * limit,
      limit: limit,
      order: [['created', 'DESC']],
    });

    return { orders, totalCount };
  } catch (error) {
    logger.error('Error fetching orders', { error });
    throw error;
  }
}
