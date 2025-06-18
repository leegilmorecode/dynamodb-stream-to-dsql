import {
  AttributeValue,
  DynamoDBClient,
  PutItemCommand,
  ReturnValue,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { ResourceNotFoundError } from '@errors/resource-not-found-error';
import { logger } from '@shared';

const dynamoDb = new DynamoDBClient({});

export async function upsert<T>(
  newItem: T,
  tableName: string,
  id: string,
): Promise<T> {
  const params = {
    TableName: tableName,
    Item: marshall(newItem),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`item created with ID ${id} into ${tableName}`);

    return newItem;
  } catch (error) {
    console.error('error creating item:', error);
    throw error;
  }
}

export async function updateById<T>(
  tableName: string,
  updatedItem: Partial<T>,
  partitionKeyName: string,
  partitionKeyValue: string,
  sortKeyName?: string,
  sortKeyValue?: string,
): Promise<T> {
  const key: Record<string, AttributeValue> = {
    [partitionKeyName]: { S: partitionKeyValue },
  };

  if (sortKeyName && sortKeyValue !== undefined) {
    key[sortKeyName] = { S: sortKeyValue };
  }

  const expressionAttributeValues: Record<string, AttributeValue> = {};
  const expressionAttributeNames: Record<string, string> = {};
  const updateExpressionParts: string[] = [];

  for (const [attributeName, attributeValue] of Object.entries(updatedItem)) {
    const placeholderName = `#${attributeName}`;
    const placeholderValue = `:${attributeName}`;
    expressionAttributeNames[placeholderName] = attributeName;
    expressionAttributeValues[placeholderValue] = marshall({
      value: attributeValue,
    }).value;
    updateExpressionParts.push(`${placeholderName} = ${placeholderValue}`);
  }

  const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

  const params: UpdateItemCommandInput = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: ReturnValue.ALL_NEW,
  };

  try {
    const data = await dynamoDb.send(new UpdateItemCommand(params));
    if (!data.Attributes) {
      throw new ResourceNotFoundError(
        `item with ${partitionKeyName} = ${partitionKeyValue}${
          sortKeyName ? ` and ${sortKeyName} = ${sortKeyValue}` : ''
        } not found`,
      );
    }
    const updatedRecord = unmarshall(data.Attributes) as T;
    logger.info(
      `item with ${partitionKeyName} = ${partitionKeyValue}${
        sortKeyName ? ` and ${sortKeyName} = ${sortKeyValue}` : ''
      } updated successfully`,
    );
    return updatedRecord;
  } catch (error) {
    console.error('error updating item:', error);
    throw error;
  }
}
