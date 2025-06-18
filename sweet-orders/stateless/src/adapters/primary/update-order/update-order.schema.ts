import { z } from 'zod';

export const schema = z
  .object({
    status: z.enum([
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]),
  })
  .strict();

export type UpdateOrderRequest = z.infer<typeof schema>;
