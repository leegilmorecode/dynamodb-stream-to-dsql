import { z } from 'zod';

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customerName: z.string().optional(),
  contactEmail: z.string().optional(),
  paymentMethod: z
    .enum(['credit_card', 'paypal', 'apple_pay', 'cash_on_delivery'])
    .optional(),
});

export type GetOrdersRequest = z.infer<typeof schema>;
