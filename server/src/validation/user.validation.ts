import { z } from 'zod';
import { newPasswordSchema } from './password.validation.js';

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
  isActiveFilter: z
    .enum(['0', '1'])
    .default('0')
    .transform(Number),
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

const nonEmptyString = z.string().trim().min(1);
const normalizedEmail = z
  .transform((value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  .pipe(z.email());

/** Admin-only user creation (initial password set by admin). */
export const createUserBodySchema = z.strictObject({
  username: nonEmptyString,
  email: normalizedEmail,
  password: newPasswordSchema,
  role: z.enum(['Admin', 'Inspector']),
});

export type UserIdParams = z.output<typeof userIdParamsSchema>;
export type GetUsersQuery = z.output<typeof getUsersQuerySchema> & {
  isActiveFilter: number;
};
export type UpdateUserBody = z.output<typeof updateUserBodySchema>;
export type CreateUserBody = z.output<typeof createUserBodySchema>;
