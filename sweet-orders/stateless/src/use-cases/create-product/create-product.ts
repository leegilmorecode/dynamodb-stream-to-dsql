import { Product, schema } from '@schemas/product/product';
import { getISOString, stripInternalKeys } from '@shared';

import { CreateProductRequest } from '@adapters/primary/create-product/create-product.schema';
import { upsert } from '@adapters/secondary/dynamodb-adapter';
import { config } from '@config';
import { entityTypes } from '@dto/entity-types';
import { v4 as uuid } from 'uuid';

const tableName = config.get('tableName');

export async function createProductUseCase(
  product: CreateProductRequest,
): Promise<Product> {
  const createdDate = getISOString();
  const productId = uuid();

  // no mapper here - lets keep it simple for the example only
  const createdProduct: Product = schema.parse({
    ...product,
    id: productId,
    pk: `PRODUCT#${productId}`,
    sk: `PRODUCT#${productId}`,
    created: createdDate,
    updated: createdDate,
    type: entityTypes.PRODUCT,
  });

  // write it to the database
  await upsert(createdProduct, tableName, createdProduct.id);

  // strip off internal keys before returning
  return stripInternalKeys(createdProduct) as Product;
}
