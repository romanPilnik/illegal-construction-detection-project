import { z } from 'zod';
import { isValidTimeZone } from '../lib/date-range.js';

const dateOnlySchema = z.iso.date();
const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidTimeZone, 'Invalid IANA time zone');

const dateRangeFields = {
  start_date: dateOnlySchema.optional(),
  end_date: dateOnlySchema.optional(),
  time_zone: timeZoneSchema.default('Asia/Jerusalem'),
};

const validDateRange = (value: { start_date?: string; end_date?: string }) =>
  !value.start_date || !value.end_date || value.start_date <= value.end_date;

export const getAnalysesQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['Pending', 'Completed', 'Failed']).optional(),
  ...dateRangeFields,
}).refine(validDateRange, {
  message: 'start_date must be before or equal to end_date',
  path: ['start_date'],
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
    ...dateRangeFields,
  })
  .refine(validDateRange, {
    message: 'start_date must be before or equal to end_date',
    path: ['start_date'],
  });

export const createAnalysisBodySchema = z.strictObject({
  request_title: z
    .string()
    .trim()
    .min(1, 'Request title is required')
    .max(120, 'Request title must be at most 120 characters'),
});

// Kept for compatibility with legacy imports.
export const exportAnalysesSchema = z.object({
  body: exportByDateRangeBodySchema,
});

export type GetAnalysesQuery = z.output<typeof getAnalysesQuerySchema>;
export type AnalysisIdParams = z.output<typeof analysisIdParamsSchema>;
export type CreateAnalysisBody = z.output<typeof createAnalysisBodySchema>;
export type ExportByIdParams = z.output<typeof exportByIdParamsSchema>;
export type ExportByIdBody = z.output<typeof exportByIdBodySchema>;
export type ExportByDateRangeBody = z.output<
  typeof exportByDateRangeBodySchema
>;
