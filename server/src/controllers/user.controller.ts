import type { Request, Response } from 'express';
import { PrismaClient, Prisma, Role } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const requestedLimit = Number(req.query.limit) || 10;

    if (requestedLimit > 50) {
      res.status(400).json({ message: "Limit cannot exceed 50 items per page" });
      return;
    }

    const  limit = requestedLimit;

    const role = req.query.role as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.UserWhereInput = {};
    // Filter by role if provided
    if (role) {
      whereClause.role = role as Role;
    }
    // Search in username or email if search term provided
    if (search) {
      whereClause.OR = [
        { username: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where: whereClause });
    const totalPages = Math.ceil(total / limit);

    const users = await prisma.user.findMany({
      take: limit,
      skip: skip,
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
}
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};