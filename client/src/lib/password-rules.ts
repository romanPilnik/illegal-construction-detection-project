export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;

export const PASSWORD_PLACEHOLDER = `Min. ${PASSWORD_MIN_LENGTH} characters`;

export function isPasswordLongEnough(password: string): boolean {
  return password.trim().length >= PASSWORD_MIN_LENGTH;
}
