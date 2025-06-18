import { z } from 'zod';

export const schema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    price: z.number().min(0),
    category: z.string().min(1).max(50),
    stockQuantity: z.number().min(0),
    sku: z.string().min(1).max(50),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
  })
  .strict();

export type CreateProductRequest = z.infer<typeof schema>;
