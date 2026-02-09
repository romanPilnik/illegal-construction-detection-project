import type { NextFunction, Request, Response } from 'express';
import type { ZodIssue, ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validateRequest = (schemas: RequestSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationTargets = [
      { key: 'params' as const, schema: schemas.params, value: req.params },
      { key: 'query' as const, schema: schemas.query, value: req.query },
      { key: 'body' as const, schema: schemas.body, value: req.body },
    ];
    const validatedValues: Partial<Record<'params' | 'query' | 'body', unknown>> = {};
    const issues: ZodIssue[] = [];

    for (const target of validationTargets) {
      if (!target.schema) {
        continue;
      }

      const parsedResult = target.schema.safeParse(target.value);

      if (!parsedResult.success) {
        issues.push(
          ...parsedResult.error.issues.map((issue) => ({
            ...issue,
            path: [target.key, ...issue.path],
          }))
        );
        continue;
      }

      validatedValues[target.key] = parsedResult.data;
    }

    if (issues.length > 0) {
      res.status(400).json({
        message: 'Validation failed',
        errors: issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    if (validatedValues.params !== undefined) {
      req.params = validatedValues.params as Request['params'];
    }
    if (validatedValues.query !== undefined) {
      req.query = validatedValues.query as Request['query'];
    }
    if (validatedValues.body !== undefined) {
      req.body = validatedValues.body;
    }

    next();
  };
};
