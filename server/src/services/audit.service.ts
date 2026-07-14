import { prisma } from '../lib/prisma.js';
import { ActionStatus, Prisma } from '../generated/prisma/client.js';

export const logActivity = async (
  userId: string,
  action: string,
  details?: string,
  ipAddress = 'unknown',
  metadata?: Record<string, unknown>,
  status: ActionStatus = ActionStatus.Success
) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: action,
        details: details || '',
        status: status,
        metadata: (metadata || {}) as Prisma.InputJsonValue,
        ip_address: ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
