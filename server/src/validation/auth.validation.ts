import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);
const normalizedEmail = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.email()
);

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
