import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);
const normalizedEmail = z
  .transform((value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  .pipe(z.email());

export const registerBodySchema = z.strictObject({
  username: nonEmptyString,
  email: normalizedEmail,
  password: nonEmptyString,
  role: z.enum(['Admin', 'Inspector']).optional(),
});

export const loginBodySchema = z.strictObject({
  email: normalizedEmail,
  password: nonEmptyString,
});

export const changePasswordBodySchema = z
  .strictObject({
    currentPassword: nonEmptyString,
    newPassword: z.string().trim().min(8, 'New password must be at least 8 characters'),
  })
  .refine(
    ({ currentPassword, newPassword }) => currentPassword !== newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }
  );
