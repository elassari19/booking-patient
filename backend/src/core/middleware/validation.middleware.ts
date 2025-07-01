import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export const validate = (
  schema: ZodSchema,
  location: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataToValidate;

      switch (location) {
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'body':
        default:
          dataToValidate = req.body;
          break;
      }

      const validatedData = schema.parse(dataToValidate);

      // Update the request object with validated data
      if (location === 'query') {
        req.query = validatedData as any;
      } else if (location === 'params') {
        req.params = validatedData as any;
      } else {
        req.body = validatedData;
      }

      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors || error.message,
      });
    }
  };
};
