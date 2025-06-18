import { z } from 'zod';

export const schema = z
  .object({
    id: z.string().uuid(),
    pk: z.string().startsWith('ORDER#'),
    sk: z.string().startsWith('ORDER_EVENT#'),
    type: z.literal('ORDER_EVENT'),
    eventType: z.enum([
      'ORDER_PLACED',
      'ORDER_CONFIRMED',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'ORDER_RETURNED',
      'ORDER_UPDATED',
    ]),
    created: z.string().datetime(),
    message: z.string().optional(),
    orderId: z.string().uuid(),
  })
  .strict();

export type OrderEvent = z.infer<typeof schema>;

export type OrderEventType = z.infer<typeof schema>['eventType'];
export type OrderEventTypeEnum = OrderEventType;
