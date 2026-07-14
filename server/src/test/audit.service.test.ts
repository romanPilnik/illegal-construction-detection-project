import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ActionStatus } from '../generated/prisma/client.js';

const createMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    auditLog: { create: createMock },
  },
}));

const { logActivity } = await import('../services/audit.service.js');

describe('logActivity', () => {
  afterEach(() => {
    createMock.mockReset();
    jest.restoreAllMocks();
  });

  it('writes normalized defaults and optional metadata', async () => {
    createMock.mockResolvedValue({});

    await logActivity('user-1', 'LOGIN', undefined, undefined, {
      requestId: 'req-1',
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        action: 'LOGIN',
        details: '',
        status: ActionStatus.Success,
        metadata: { requestId: 'req-1' },
        ip_address: 'unknown',
      },
    });
  });

  it('does not fail the business operation when auditing fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    createMock.mockRejectedValue(new Error('database unavailable'));

    await expect(
      logActivity(
        'user-1',
        'UPDATE',
        'changed user',
        '127.0.0.1',
        undefined,
        ActionStatus.Failure
      )
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to create audit log:',
      expect.any(Error)
    );
  });
});
