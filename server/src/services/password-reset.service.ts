import crypto from 'crypto';

const RESET_TOKEN_BYTES = 32;
export const RESET_TOKEN_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

export const hashResetToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generateResetToken = (): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} => {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
};

export const getFrontendBaseUrl = (): string => {
  const raw =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CLIENT_URL?.trim() ||
    'http://localhost:5173';
  return raw.replace(/\/+$/, '');
};
