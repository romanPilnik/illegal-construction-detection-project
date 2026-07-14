import { z } from 'zod';
import {
  loginPasswordSchema,
  newPasswordSchema,
} from './password.validation.js';

const nonEmptyString = z.string().trim().min(1);
const normalizedEmail = z
  .transform((value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  .pipe(z.email());

export const registerBodySchema = z.strictObject({
  username: nonEmptyString,
  email: normalizedEmail,
  password: newPasswordSchema,
  role: z.enum(['Admin', 'Inspector']).optional(),
});

export const loginBodySchema = z.strictObject({
  email: normalizedEmail,
  password: loginPasswordSchema,
});

export const changePasswordBodySchema = z
  .strictObject({
    currentPassword: nonEmptyString,
    newPassword: newPasswordSchema,
  })
  .refine(
    ({ currentPassword, newPassword }) => currentPassword !== newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }
  );

export const forgotPasswordBodySchema = z.strictObject({
  email: normalizedEmail,
});

export const resetPasswordBodySchema = z.strictObject({
  token: nonEmptyString,
  newPassword: newPasswordSchema,
});

export type RegisterBody = z.output<typeof registerBodySchema>;
export type LoginBody = z.output<typeof loginBodySchema>;
export type ChangePasswordBody = z.output<typeof changePasswordBodySchema>;
export type ForgotPasswordBody = z.output<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.output<typeof resetPasswordBodySchema>;
