import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

const mockFindMany = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);
const mockCount = jest.fn<() => Promise<number>>().mockResolvedValue(0);

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    auditLog: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const { AuditLogController } = await import('../controllers/log.controller.js');

describe('AuditLogController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {
        page: '1',
        limit: '0',
      },
    };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn() as unknown as Response['json'],
    };
  });

  it('should return 200 and return all the asked logs', async () => {
    mockFindMany.mockResolvedValue([{ id: 1, action: 'LOGIN' }]);
    mockCount.mockResolvedValue(1);
    await AuditLogController.getLogs(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.any(Array),
      meta: expect.any(Object)
    }));
  });

  it('should return a 500 if there is Error fetching logs', async () => {

    mockFindMany.mockRejectedValue(new Error('DB error'));

    await AuditLogController.getLogs(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching audit logs' });

  })

});