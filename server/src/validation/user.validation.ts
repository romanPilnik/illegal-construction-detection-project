import { z } from 'zod';

const optionalTrimmedString = z
  .transform((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? undefined : trimmedValue;
  })
  .pipe(z.string().optional());

const optionalNormalizedEmail = z
  .transform((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalizedEmail = value.trim().toLowerCase();
    return normalizedEmail.length === 0 ? undefined : normalizedEmail;
  })
  .pipe(z.email().optional());

export const userIdParamsSchema = z.strictObject({
  id: z.uuid(),
});

export const getUsersQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  role: z.enum(['Admin', 'Inspector']).optional(),
  search: optionalTrimmedString,
});

export const updateUserBodySchema = z
  .strictObject({
    username: optionalTrimmedString,
    email: optionalNormalizedEmail,
  })
  .refine(
    (value) => value.username !== undefined || value.email !== undefined,
    'At least one field must be provided for update'
  );
