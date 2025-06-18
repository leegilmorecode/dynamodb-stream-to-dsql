import { z } from 'zod';

export const schema = z
  .object({
    userId: z.string().uuid(),
    contactEmail: z.string().email(),
    customerName: z.string(),
    contactPhone: z
      .string()
      .regex(/^\+?[0-9\- ]{7,15}$/)
      .optional(),
    deliveryAddress: z
      .object({
        street: z.string(),
        city: z.string(),
        postcode: z.string(),
        country: z.string().optional(),
      })
      .optional(),
    orderItems: z
      .array(
        z.object({
          sweetName: z.string(),
          quantity: z.number().min(1),
          notes: z.string().optional(),
          sku: z.string(),
        }),
      )
      .min(1),
    deliveryInstructions: z.string().optional(),
    paymentMethod: z
      .enum(['credit_card', 'paypal', 'apple_pay', 'cash_on_delivery'])
      .optional(),
  })
  .strict();

export type CreateOrderRequest = z.infer<typeof schema>;
