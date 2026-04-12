import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/audit.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

function isPublicRegistrationAllowed(): boolean {
  return (
    process.env.ALLOW_PUBLIC_REGISTRATION === 'true' ||
    process.env.NODE_ENV !== 'production'
  );
}

/**
 * Handles new user registration (public only when allowed; see ALLOW_PUBLIC_REGISTRATION / NODE_ENV).
 */
const register = async (
  req: Request,   // was: req: Partial<e.Request>
  res: Response   // was: res: Partial<e.Response>
): Promise<void> => {
  try {
    if (!isPublicRegistrationAllowed()) {
      res.status(403).json({
        message:
          'Public registration is disabled. Contact an administrator.',
      });
      return;
    }

    const { username, email, password, role } = req.body;

    // Check if a user with this email  already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    // Hash the password for security (Salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save the new user to the database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        role: role || 'Inspector', // Default role if not provided
        is_active: true,
      },
    });

    await sendWelcomeEmail(newUser.email, newUser.username);

    res.status(201).json({
      message: 'User created successfully',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

/**
 * Handles user authentication and issues a JWT
 */
const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (!existingUser.is_active) {
      res.status(403).json({
        message:
          'Your account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    // 2. Compare the provided password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, existingUser.password_hash);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // 3. Generate a JWT token containing the user's ID and role
    const token = jwt.default.sign(
      {
        userId: existingUser.id,
        role: existingUser.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(
      existingUser.id,
      'USER_LOGIN',
      `User ${existingUser.email} logged in`
    );

    // 4. Return the token and basic user info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Updates password for the authenticated user (JWT).
 */
const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!existingUser.is_active) {
      res.status(403).json({
        message:
          'Your account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      existingUser.password_hash
    );

    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    await logActivity(
      userId,
      'PASSWORD_CHANGE',
      `User ${existingUser.email} changed their password`
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
};

export const AuthController = {
  register,
  login,
  changePassword,
};
