import type { Request, Response } from 'express';
import { Prisma, Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

type GetUserByIdParams = {
  id: string;
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const requestedLimit = Number(req.query.limit) || 10;

    if (requestedLimit > 50) {
      res
        .status(400)
        .json({ message: 'Limit cannot exceed 50 items per page' });
      return;
    }

    const limit = requestedLimit;

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
        { email: { contains: search } },
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const getUserById = async (req: Request<GetUserByIdParams>, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

const updateUser = async (req: Request<GetUserByIdParams>, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body as {
      username?: string;
      email?: string;
    };

    if (!id) {
      res.status(400).json({ message: 'User id is required' });
      return;
    }

    const data: Prisma.UserUpdateInput = {};

    if (username !== undefined) {
      if (typeof username !== 'string' || !username.trim()) {
        res
          .status(400)
          .json({ message: 'Username must be a non-empty string' });
        return;
      }
      data.username = username.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ message: 'Email must be a non-empty string' });
        return;
      }
      data.email = email.trim().toLowerCase();
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({
        message: 'No valid fields to update. Allowed: username, email',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    res
      .status(200)
      .json({ message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error(error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (error.code === 'P2002') {
        res.status(400).json({ message: 'Email already in use' });
        return;
      }
    }

    res.status(500).json({ message: 'Error updating user details' });
  }
};

const deleteUser = async (req: Request<GetUserByIdParams>, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'User id is required' });
      return;
    }

    const deletedUser = await prisma.user.update({
      where: { id },
      data: { is_active: false },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    res
      .status(200)
      .json({ message: 'User deleted successfully', data: deletedUser });
  } catch (error) {
    console.error(error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ message: 'User not found' });
        return;
      }
    }

    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const UserController = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
