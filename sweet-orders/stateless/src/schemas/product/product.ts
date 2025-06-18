import { z } from 'zod';

export const schema = z
  .object({
    id: z.string().uuid(),
    pk: z.string(),
    sk: z.string(),
    type: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    price: z.number().min(0),
    category: z.string().min(1).max(50),
    stockQuantity: z.number().min(0),
    sku: z.string().min(1).max(50),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    created: z.string(),
    updated: z.string(),
  })
  .strict();

export type Product = z.infer<typeof schema>;

export type ProductTag = string;
export type ProductTags = z.infer<typeof schema>['tags'];
