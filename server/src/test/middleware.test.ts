import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '../generated/prisma/client.js';

process.env.JWT_SECRET = 'middleware-test-secret';

const mockFindUnique = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

const { authenticateToken } = await import('../middlewares/auth.middleware.js');
const { requireAdmin } = await import('../middlewares/admin.middleware.js');
const { validateRequest } =
  await import('../middlewares/validate-request.middleware.js');

const createResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  jest.mocked(res.status).mockReturnValue(res);
  return res;
};

describe('authenticateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([undefined, 'Basic token', 'Bearer', 'Bearer token extra'])(
    'rejects a missing or malformed Bearer header: %s',
    async (authorization) => {
      const req = { headers: { authorization } } as Request;
      const res = createResponse();
      const next = jest.fn() as NextFunction;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 'SESSION_REQUIRED',
        message: 'A valid Bearer token is required.',
      });
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    }
  );

  it('rejects an expired token as unauthenticated', async () => {
    const token = jwt.sign(
      { userId: 'user-1', role: Role.Inspector },
      process.env.JWT_SECRET!,
      { expiresIn: -1 }
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: 'SESSION_INVALID',
      message: 'Invalid or expired token.',
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('rejects a verified token with an unknown role', async () => {
    const token = jwt.sign(
      { userId: 'user-1', role: 'Manager' },
      process.env.JWT_SECRET!
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: 'SESSION_INVALID',
      message: 'Invalid token payload.',
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it.each([null, { id: 'user-1', role: Role.Inspector, is_active: false }])(
    'rejects an unavailable or inactive database user',
    async (databaseUser) => {
      mockFindUnique.mockResolvedValue(databaseUser);
      const token = jwt.sign(
        { userId: 'user-1', role: Role.Inspector },
        process.env.JWT_SECRET!
      );
      const req = { headers: { authorization: `Bearer ${token}` } } as Request;
      const res = createResponse();
      const next = jest.fn() as NextFunction;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 'SESSION_INACTIVE',
        message: 'User account is inactive or unavailable.',
      });
      expect(next).not.toHaveBeenCalled();
    }
  );

  it('uses the current database role instead of a stale token role', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      role: Role.Admin,
      is_active: true,
    });
    const token = jwt.sign(
      { userId: 'user-1', role: Role.Inspector },
      process.env.JWT_SECRET!
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticateToken(req, res, next);

    expect(req.user).toEqual({ userId: 'user-1', role: Role.Admin });
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns a consistent JSON error when the user lookup fails', async () => {
    const databaseError = new Error('database unavailable');
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockFindUnique.mockRejectedValue(databaseError);
    const token = jwt.sign(
      { userId: 'user-1', role: Role.Inspector },
      process.env.JWT_SECRET!
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication service unavailable.',
    });
    expect(next).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('requireAdmin', () => {
  it('allows an administrator', () => {
    const req = { user: { userId: 'admin-1', role: Role.Admin } } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 for an authenticated inspector', () => {
    const req = {
      user: { userId: 'inspector-1', role: Role.Inspector },
    } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateRequest', () => {
  it('replaces request values with parsed and normalized data', () => {
    const middleware = validateRequest({
      query: z.strictObject({ page: z.coerce.number().int().default(1) }),
      body: z.strictObject({ name: z.string().trim() }),
    });
    const req = {
      params: {},
      query: { page: '2' },
      body: { name: '  Site A  ' },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(req.query).toEqual({ page: 2 });
    expect(req.body).toEqual({ name: 'Site A' });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns one consistent response containing errors from every target', () => {
    const middleware = validateRequest({
      params: z.strictObject({ id: z.string().uuid() }),
      body: z.strictObject({ name: z.string().min(1) }),
    });
    const req = {
      params: { id: 'invalid' },
      query: {},
      body: { name: '' },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'params.id' }),
        expect.objectContaining({ field: 'body.name' }),
      ]),
    });
    expect(next).not.toHaveBeenCalled();
  });
});
