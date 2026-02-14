import type { Request, Response } from 'express';
import { logActivity } from '../services/audit.service.js';
import { Prisma, Role } from '../generated/prisma/index.js';
import { prisma } from '../lib/prisma.js';

type GetUserByIdParams = {
  id: string;
};

/**
 * Fetches a paginated list of users with optional filtering
 */
const getUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, role, search, isActiveFilter } = req.query as unknown as {
      page: number;
      limit: number;
      role?: string;
      search?: string;
      isActiveFilter?: boolean;
    };

    const skip = (page - 1) * limit;
    const whereClause: Prisma.UserWhereInput = {};

    const status = isActiveFilter !== undefined ? Number(isActiveFilter) : 0;

    if (status === 0) {
      whereClause.is_active = true;
    } else if (status === 1) {
      whereClause.is_active = false;
    }

    if (role) {
      whereClause.role = role as Role;
    }
    if (search) {
      whereClause.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

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
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      data: users,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

/**
 * Fetches a single user by their ID
 */
const getUserById = async (req: Request<GetUserByIdParams>, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true },
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

/**
 * Updates user details and logs the changes (Before/After)
 */
const updateUser = async (req: Request<GetUserByIdParams>, res: Response) => {
  try {
    const { id } = req.params; // We use 'id' as defined in GetUserByIdParams
    const { username, email } = req.body;

    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const data: Prisma.UserUpdateInput = {};
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, role: true, is_active: true },
    });

    const adminId = req.user?.userId;
    if (adminId) {
      await logActivity(
        adminId,
        'USER_UPDATE',
        `Updated user details for: ${updatedUser.email}`,
        {
          before: { username: oldUser.username, email: oldUser.email },
          after: { username: updatedUser.username, email: updatedUser.email }
        }
      );
    }

    res.status(200).json({ message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user details' });
  }
};

/**
 * Soft deletes a user and logs the action
 */
const deleteUser = async (req: Request<GetUserByIdParams>, res: Response) => {
  try {
    const { id } = req.params;

    const deletedUser = await prisma.user.update({
      where: { id },
      data: { is_active: false },
      select: { id: true, username: true, email: true, role: true, is_active: true },
    });

    const adminId = req.user?.userId;
    if (adminId) {
      await logActivity(
        adminId,
        'USER_DELETE',
        `Deactivated user: ${deletedUser.email}`,
        { target_user_id: id }
      );
    }

    res.status(200).json({ message: 'User deleted successfully', data: deletedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const UserController = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};