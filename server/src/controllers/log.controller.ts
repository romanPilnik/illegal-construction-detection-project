import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const getLogs = async (req: Request, res: Response) => {
  try {
        const {page, limit, action} = req.query as unknown as {
          page: number;
          limit: number;
          action?: string;
        }

        const skip = (page - 1) * limit;
        const  whereClause = action ? { action: { contains: action } } : {};

        const total = await prisma.auditLog.count({where: whereClause});
        const totalPages = Math.ceil( total / limit);

        const logs = await prisma.auditLog.findMany({
          take: limit,
          skip: skip,
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                email: true,
                role: true
              }
            }
          }
        })

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