import { z } from 'zod';

export const schema = z
  .object({
    id: z.string(),
    pk: z.string(),
    sk: z.string(),
    created: z.string(),
    updated: z.string(),
    type: z.string(),
    customerName: z.string(),
    userId: z.string().uuid(),
    contactEmail: z.string().email(),
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
    status: z
      .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .default('PENDING'),
  })
  .strict();

export type Order = z.infer<typeof schema>;

export type DeliveryAddress = z.infer<typeof schema>['deliveryAddress'];
export type OrderItem = z.infer<typeof schema>['orderItems'][number];
export type PaymentMethod = z.infer<typeof schema>['paymentMethod'];
export type OrderStatus = z.infer<typeof schema>['status'];
