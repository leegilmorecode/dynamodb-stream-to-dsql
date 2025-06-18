import { z } from 'zod';

export const schema = z.object({
  orderId: z.string().uuid(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  eventType: z
    .enum([
      'ORDER_PLACED',
      'ORDER_CONFIRMED',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'ORDER_RETURNED',
      'ORDER_UPDATED',
    ])
    .optional(),
});

export type GetOrderEventsRequest = z.infer<typeof schema>;
