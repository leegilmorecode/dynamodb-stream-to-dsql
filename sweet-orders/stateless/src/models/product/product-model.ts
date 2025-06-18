import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

import { logger } from '@shared/logger';

export interface ProductAttributes {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  sku: string;
  tags?: string;
  imageUrl?: string;
  created: string;
  updated: string;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  'tags' | 'imageUrl'
>;

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: string;
  public name!: string;
  public type!: string;
  public description!: string;
  public price!: number;
  public category!: string;
  public stockQuantity!: number;
  public sku!: string;
  public tags?: string;
  public imageUrl?: string;
  public created!: string;
  public updated!: string;
}

export function initProductModel(sequelize: Sequelize): typeof Product {
  logger.info('Initialising Product model');
  Product.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, field: 'id' },
      name: { type: DataTypes.STRING, field: 'name' },
      type: { type: DataTypes.STRING, field: 'type' },
      description: { type: DataTypes.STRING, field: 'description' },
      price: { type: DataTypes.FLOAT, field: 'price' },
      category: { type: DataTypes.STRING, field: 'category' },
      stockQuantity: { type: DataTypes.INTEGER, field: 'stock_quantity' },
      sku: { type: DataTypes.STRING, field: 'sku' },
      tags: { type: DataTypes.TEXT, field: 'tags' },
      imageUrl: { type: DataTypes.STRING, field: 'image_url' },
      created: { type: DataTypes.STRING, field: 'created' },
      updated: { type: DataTypes.STRING, field: 'updated' },
    },
    {
      sequelize,
      tableName: 'products',
      timestamps: false,
    },
  );

  return Product;
}
