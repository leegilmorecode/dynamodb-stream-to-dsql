import { ZodError, ZodSchema } from 'zod';

import { ValidationError } from '@errors/validation-error';

export function schemaValidator(schema: ZodSchema, body: unknown) {
  try {
    schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const errorMessage = JSON.stringify(err.errors, null, 2);
      throw new ValidationError(errorMessage);
    }
    throw err;
  }
}
