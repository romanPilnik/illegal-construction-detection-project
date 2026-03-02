import { z } from 'zod';

export const getAnalysesQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['Pending', 'Completed', 'Failed']).optional(),
});

export const analysisIdParamsSchema = z.strictObject({
  id: z.string().uuid(),
});

export const exportAnalysesSchema = z.object({
  body: z.object({
    format: z.enum(['EXCEL', 'PDF'], {
      error: "Format is required (EXCEL or PDF)",
    }),
    start_date: z.string().datetime().optional(), // מצפה לפורמט ISO
    end_date: z.string().datetime().optional(),
  }),
});