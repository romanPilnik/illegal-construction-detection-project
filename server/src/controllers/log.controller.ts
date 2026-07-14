import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { GetLogsQuery } from '../validation/log.validation.js';

const getLogs = async (
  req: Request<unknown, unknown, unknown, GetLogsQuery>,
  res: Response
) => {
  try {
    const { page, limit, action } = req.query;

    const skip = (page - 1) * limit;
    const whereClause = action ? { action: { contains: action } } : {};

    const total = await prisma.auditLog.count({ where: whereClause });
    const totalPages = Math.ceil(total / limit);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      skip: skip,
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        action: true,
        ip_address: true,
        timestamp: true,
        status: true,
        details: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    res.status(200).json({
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};

export const AuditLogController = {
  getLogs,
};
