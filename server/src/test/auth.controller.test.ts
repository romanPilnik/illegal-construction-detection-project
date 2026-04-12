import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

const mockFindUnique = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
const mockCreate = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
const mockUpdate = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
const mockSendWelcomeEmail = jest.fn<() => Promise<void>>();
const mockGenSalt = jest.fn<() => Promise<string>>().mockResolvedValue('fake_salt');
const mockHash = jest.fn<() => Promise<string>>().mockResolvedValue('hashed_password');
const mockCompare = jest.fn<() =>Promise<boolean>>().mockResolvedValue(true);
const mockSign = jest.fn<() => string>().mockReturnValue('fake_jwt_token_123');
const mockLoginActivity = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

jest.unstable_mockModule('../services/email.service.js', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: mockGenSalt,
    hash: mockHash,
    compare: mockCompare,
  },
  genSalt: mockGenSalt,
  hash: mockHash,
  compare: mockCompare,
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: mockSign,
  },
  sign: mockSign,
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
    logActivity: mockLoginActivity,
}));

const { AuthController } = await import('../controllers/auth.controller.js');

describe('AuthController - register', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        username: 'shirelTest',
        password: 'Password123',
        email: 'shirel@test.com',
        role: 'Admin',
      },
    };
    res = {
        status: jest.fn().mockReturnThis() as unknown as Response['status'],
        json: jest.fn() as unknown as Response['json'],
    };
  });

  it('should register successfully and return 201 and welcome mail send', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 1, username: 'shirelTest', email: 'shirel@test.com' });

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith('shirel@test.com', 'shirelTest');
  });

  it('should return 400 if user already exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 99 });

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should return 500 if DB creation fails', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error('DB Connection Failed'));

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return 403 when public registration is disabled in production', async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevAllow = process.env.ALLOW_PUBLIC_REGISTRATION;
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PUBLIC_REGISTRATION;

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockCreate).not.toHaveBeenCalled();

    process.env.NODE_ENV = prevEnv;
    if (prevAllow === undefined) {
      delete process.env.ALLOW_PUBLIC_REGISTRATION;
    } else {
      process.env.ALLOW_PUBLIC_REGISTRATION = prevAllow;
    }
  });
});


describe('AuthController - login', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {
                email:'shirel@test.com',
                password: 'Password123',
            },
        };
        res = {
            status: jest.fn().mockReturnThis() as unknown as Response['status'],
            json: jest.fn() as unknown as Response['json'],
        };
    });

    it('should login successfully and return 200 with token', async () => {
        const mockUser ={id:1, email:'shirel@test.com', username: 'shirelTest', password: 'Password123', is_active : true, role:'Inspector'};
        mockFindUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(true);

        await AuthController.login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            token: 'fake_jwt_token_123',
            user: expect.objectContaining({
                id: 1,
                email: 'shirel@test.com',
            }),
        }));
        expect(mockLoginActivity).toHaveBeenCalledWith(1, 'USER_LOGIN', expect.any(String));
    });

    it('should return 401 if the user is not found', async () => {
        mockFindUnique.mockResolvedValue(null);

        await AuthController.login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return 401 if the password does not match', async () => {
        const mockUser ={id:1, email:'shirel@test.com', username: 'shirelTest', password: 'Password123', is_active : true, role:'Inspector'};
        mockFindUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(false);

        await AuthController.login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if the user is deactivated', async () => {
        const mockUser ={id:1, email:'shirel@test.com', username: 'shirelTest', password: 'Password123', is_active : false , role:'Inspector'};
        mockFindUnique.mockResolvedValue(mockUser);

        await AuthController.login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('deactivated')
        }));
    });

    it('should return 500 if DB fails during login', async () => {
        mockFindUnique.mockRejectedValue(new Error('DB Connection Failed'));
        await AuthController.login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    });

describe('AuthController - changePassword', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { userId: 'user-uuid-1', role: 'Inspector' },
      body: {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      },
    };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn() as unknown as Response['json'],
    };
  });

  it('should update password and return 200', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-uuid-1',
      email: 'u@test.com',
      password_hash: 'stored_hash',
      is_active: true,
    });
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue('new_hashed');

    await AuthController.changePassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockLoginActivity).toHaveBeenCalledWith(
      'user-uuid-1',
      'PASSWORD_CHANGE',
      expect.any(String)
    );
  });

  it('should return 401 if current password is wrong', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-uuid-1',
      email: 'u@test.com',
      password_hash: 'stored_hash',
      is_active: true,
    });
    mockCompare.mockResolvedValue(false);

    await AuthController.changePassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should return 404 if user is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    await AuthController.changePassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should return 401 if req.user is missing', async () => {
    req.user = undefined;

    await AuthController.changePassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});