import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { AuthenticatedUser } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const isUserPayload = (value: unknown): value is AuthenticatedUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.userId === 'string' &&
    payload.userId.length > 0 &&
    (payload.role === Role.Admin || payload.role === Role.Inspector)
  );
};

const getBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization) {
    return null;
  }

  const parts = authorization.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return null;
  }

  return parts[1];
};

export const authenticateToken = async <Params, ResBody, ReqBody, ReqQuery>(
  req: Request<Params, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      code: 'SESSION_REQUIRED',
      message: 'A valid Bearer token is required.',
    });
    return;
  }

  let payload: unknown;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({
      code: 'SESSION_INVALID',
      message: 'Invalid or expired token.',
    });
    return;
  }

  if (!isUserPayload(payload)) {
    res.status(401).json({
      code: 'SESSION_INVALID',
      message: 'Invalid token payload.',
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, is_active: true },
    });

    if (!user?.is_active) {
      res
        .status(401)
        .json({
          code: 'SESSION_INACTIVE',
          message: 'User account is inactive or unavailable.',
        });
      return;
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    console.error('Authentication database lookup failed:', error);
    res.status(500).json({ message: 'Authentication service unavailable.' });
  }
};
