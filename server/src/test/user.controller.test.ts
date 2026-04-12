/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import type { Request, Response } from 'express';
import { Role } from '../generated/prisma/client.js';

const mockLogActivity = jest.fn<() => Promise<void>>();
const mockFindMany = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);
const mockCount = jest.fn<() => Promise<number>>().mockResolvedValue(0);
const mockFindUnique = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
const mockUpdate = jest.fn<() => Promise<any>>().mockResolvedValue(null);
const mockCreate = jest.fn<() => Promise<any>>().mockResolvedValue(null);
const mockSendWelcomeEmail = jest.fn<() => Promise<void>>();
const mockGenSalt = jest.fn<() => Promise<string>>().mockResolvedValue('salt');
const mockHash = jest.fn<() => Promise<string>>().mockResolvedValue('hashed');

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      count: mockCount,
      update: mockUpdate,
      create: mockCreate,
    },
  },
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
  logActivity: mockLogActivity,
}));

jest.unstable_mockModule('../services/email.service.js', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: mockGenSalt,
    hash: mockHash,
  },
  genSalt: mockGenSalt,
  hash: mockHash,
}));

const { UserController } = await import('../controllers/user.controller.js');

describe('UserController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      user: {
        userId: 'admin-123',
        role: Role.Admin
      },
    };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn() as unknown as Response['json'],
    };
  });

  describe('createUser', () => {
    it('should return 201, send welcome email, and log USER_CREATE', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@test.com',
        password: 'secret123',
        role: Role.Inspector,
      };
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'u-new',
        username: 'newuser',
        email: 'new@test.com',
        role: Role.Inspector,
        is_active: true,
      });

      await UserController.createUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith('new@test.com', 'newuser');
      expect(mockLogActivity).toHaveBeenCalledWith(
        'admin-123',
        'USER_CREATE',
        expect.stringContaining('new@test.com'),
        expect.objectContaining({ target_user_id: 'u-new' })
      );
    });

    it('should return 400 if email already exists', async () => {
      req.body = {
        username: 'x',
        email: 'taken@test.com',
        password: 'secret123',
        role: Role.Inspector,
      };
      mockFindUnique.mockResolvedValue({ id: 'existing' });

      await UserController.createUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should return 500 if create fails', async () => {
      req.body = {
        username: 'x',
        email: 'x@test.com',
        password: 'p',
        role: Role.Inspector,
      };
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockRejectedValue(new Error('fail'));

      await UserController.createUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUsers', () => {
    it('should return 200 and list of users', async () => {
      req.query = { page: '1', limit: '10' };
      mockCount.mockResolvedValue(1);
      mockFindMany.mockResolvedValue([{ id: '1', username: 'testUser' }]);

      await UserController.getUsers(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.any(Array),
      }));
    });

    it('should return 500 if DB fails', async () => {
      mockCount.mockRejectedValue(new Error('DB Error'));

      await UserController.getUsers(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserById', () => {
    it('should return 200 if user is found', async () => {
      req.params = { id: 'user-1' };
      const mockUser = {
        id: 'user-1',
        username: 'shirel',
        email: 's@test.com',
        role: Role.Inspector,
      };
      mockFindUnique.mockResolvedValue(mockUser);

      await UserController.getUserById(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockUser });
    });

    it('should return 404 if user does not exist', async () => {
      req.params = { id: 'not-exists' };
      mockFindUnique.mockResolvedValue(null);

      await UserController.getUserById(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 500 if DB fails', async () => {
      mockFindUnique.mockRejectedValue(new Error('DB Error'));

      await UserController.getUserById(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUser', () => {
    it('should return 200 and update user and log activity', async () => {
      req.user = { userId: 'admin-123', role: Role.Admin };
      req.params = { id: 'user-1' };
      req.body = { username: 'newShirel', email: 'new@test.com' };

      mockFindUnique.mockResolvedValue({ id: 'user-1', username: 'oldShirel', email: 'old@test.com' });
      mockUpdate.mockResolvedValue({ id: 'user-1', username: 'newShirel', email: 'new@test.com' });
      await UserController.updateUser(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockLogActivity).toHaveBeenCalledWith(
        'admin-123',
        'USER_UPDATE',
        expect.stringContaining('new@test.com'),
        expect.objectContaining({
          before: { username: 'oldShirel', email: 'old@test.com' },
          after: { username: 'newShirel', email: 'new@test.com' }
        })
      );
    });

    it('should return 404 if user to update is not found', async () => {
      req.params = { id: 'no-user' };
      mockFindUnique.mockResolvedValue(null);

      await UserController.updateUser(req as any, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 if update fails', async () => {
      mockFindUnique.mockResolvedValue({ id: '1' });
      mockUpdate.mockRejectedValue(new Error('Update failed'));

      await UserController.updateUser(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteUser', () => {
    it('should return 200 and deactivate user (soft delete)', async () => {
      req.params = { id: 'user-1' };
      const deactivatedUser = { id: 'user-1', is_active: false, email: 's@test.com' };

      mockUpdate.mockResolvedValue(deactivatedUser);

      await UserController.deleteUser(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user-1' },
        data: { is_active: false }
      }));
      expect(mockLogActivity).toHaveBeenCalledWith(
        'admin-123',
        'USER_DELETE',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should return 500 if DB fails', async () => {
      mockUpdate.mockRejectedValue(new Error('DB Error'));

      await UserController.deleteUser(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

});


