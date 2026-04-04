import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

const mockFindUnique = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
const mockCreate = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
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
            token: 'fake_jwt_token_123'
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