import type { NextFunction, Request, Response } from 'express';
import type { ZodIssue, ZodType } from 'zod';

type RequestSchemas = {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
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

        // הפתרון ל-Express 5: שימוש ב-Object.defineProperty כדי לדרוס את הנעילה
        if (validatedValues.params !== undefined) {
            Object.defineProperty(req, 'params', { value: validatedValues.params, writable: true, enumerable: true });
        }
        if (validatedValues.query !== undefined) {
            Object.defineProperty(req, 'query', { value: validatedValues.query, writable: true, enumerable: true });
        }
        if (validatedValues.body !== undefined) {
            req.body = validatedValues.body;
        }

        next();
    };
};