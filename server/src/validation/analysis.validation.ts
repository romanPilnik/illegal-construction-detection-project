import { z } from 'zod';

export const getAnalysesQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['Pending', 'Completed', 'Failed']).optional(),
});

export const analysisIdParamsSchema = z.strictObject({
  id: z.string().uuid(),
});

const exportFormatSchema = z.enum(['EXCEL', 'PDF'], {
  error: 'Format is required (EXCEL or PDF)',
});

export const exportByIdParamsSchema = z.strictObject({
  id: z.string().uuid(),
});

export const exportByIdBodySchema = z.strictObject({
  format: exportFormatSchema,
});

export const exportByDateRangeBodySchema = z
  .strictObject({
    format: exportFormatSchema,
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  })
  .refine(
    ({ start_date, end_date }) =>
      !start_date || !end_date || new Date(start_date) <= new Date(end_date),
    {
      message: 'start_date must be before or equal to end_date',
      path: ['start_date'],
    }
  );

// Kept for compatibility with legacy imports.
export const exportAnalysesSchema = z.object({
  body: exportByDateRangeBodySchema,
});
