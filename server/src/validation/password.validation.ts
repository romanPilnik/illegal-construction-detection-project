import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;

/** New passwords (register, reset, change, admin create). */
export const newPasswordSchema = z
  .string()
  .trim()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE);

/** Login / current password — only requires non-empty input. */
export const loginPasswordSchema = z.string().trim().min(1, 'Password is required');
