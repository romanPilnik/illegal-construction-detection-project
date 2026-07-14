import type { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { logActivity } from '../services/audit.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { disconnectUserSockets } from '../services/socket.service.js';
import type {
  CreateUserBody,
  GetUsersQuery,
  UpdateUserBody,
  UserIdParams,
} from '../validation/user.validation.js';

const respondToPrismaWriteError = (
  error: unknown,
  res: Response,
  fallbackMessage: string
): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code === 'P2002') {
    res.status(409).json({ message: 'Email already in use' });
    return true;
  }
  if (error.code === 'P2025') {
    res.status(404).json({ message: 'User not found' });
    return true;
  }

  res.status(500).json({ message: fallbackMessage });
  return true;
};

/**
 * Creates a user (admin-provisioned password). Sends welcome email and audit log.
 */
const createUser = async (
  req: Request<unknown, unknown, CreateUserBody>,
  res: Response
) => {
  try {
    const { username, email, password, role } = req.body;
    const adminId = req.user?.userId;
    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        role,
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    await sendWelcomeEmail(newUser.email, newUser.username);

    await logActivity(
      adminId,
      'USER_CREATE',
      `Created user: ${newUser.email}`,
      req.ip || 'unknown',
      { target_user_id: newUser.id, role: newUser.role }
    );

    res.status(201).json({
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    console.error(error);
    if (respondToPrismaWriteError(error, res, 'Error creating user')) return;
    res.status(500).json({ message: 'Error creating user' });
  }
};

/**
 * Fetches a paginated list of users with optional filtering
 */
const getUsers = async (
  req: Request<unknown, unknown, unknown, GetUsersQuery>,
  res: Response
) => {
  try {
    const { page, limit, role, search, isActiveFilter } = req.query;

    const skip = (page - 1) * limit;
    const whereClause: Prisma.UserWhereInput = {};

    if (isActiveFilter === 0) {
      whereClause.is_active = true;
    } else {
      whereClause.is_active = false;
    }

    if (role) {
      whereClause.role = role;
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
const getUserById = async (req: Request<UserIdParams>, res: Response) => {
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
const updateUser = async (
  req: Request<UserIdParams, unknown, UpdateUserBody>,
  res: Response
) => {
  try {
    const { id } = req.params; // We use 'id' as defined in GetUserByIdParams
    const { username, email } = req.body;

    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { username: true, email: true },
    });
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
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    const adminId = req.user?.userId;
    if (adminId) {
      await logActivity(
        adminId,
        'USER_UPDATE',
        `Updated user details for: ${updatedUser.email}`,
        req.ip || 'unknown',
        {
          before: { username: oldUser.username, email: oldUser.email },
          after: { username: updatedUser.username, email: updatedUser.email },
        }
      );
    }

    res
      .status(200)
      .json({ message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error(error);
    if (
      respondToPrismaWriteError(error, res, 'Error updating user details')
    ) return;
    res.status(500).json({ message: 'Error updating user details' });
  }
};

/**
 * Soft deletes a user and logs the action
 */
const deleteUser = async (req: Request<UserIdParams>, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, is_active: true },
    });
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!existingUser.is_active) {
      res.status(400).json({ message: 'User is already inactive' });
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

    const adminId = req.user?.userId;
    if (adminId) {
      await logActivity(
        adminId,
        'USER_DELETE',
        `Deactivated user: ${deletedUser.email}`,
        req.ip || 'unknown',
        { target_user_id: id }
      );
    }

    try {
      disconnectUserSockets(id);
    } catch (error) {
      console.error(`Failed to disconnect sockets for deactivated user ${id}:`, error);
    }
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    if (respondToPrismaWriteError(error, res, 'Error deleting user')) return;
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const UserController = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
