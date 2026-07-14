import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/audit.service.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';
import {
  generateResetToken,
  getFrontendBaseUrl,
  hashResetToken,
} from '../services/password-reset.service.js';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
} from '../validation/auth.validation.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

type RegistrationPolicy = {
  allowed: boolean;
  reason: string;
  usersCount: number;
  allowPublicRegistration: string | undefined;
  nodeEnv: string | undefined;
};

async function getRegistrationPolicy(): Promise<RegistrationPolicy> {
  const allowPublicRegistration = process.env.ALLOW_PUBLIC_REGISTRATION;
  const nodeEnv = process.env.NODE_ENV;
  const usersCount = await prisma.user.count();

  if (allowPublicRegistration === 'false') {
    if (usersCount === 0) {
      return {
        allowed: true,
        reason: 'bootstrap mode (no users in database)',
        usersCount,
        allowPublicRegistration,
        nodeEnv,
      };
    }

    return {
      allowed: false,
      reason: 'ALLOW_PUBLIC_REGISTRATION=false with existing users',
      usersCount,
      allowPublicRegistration,
      nodeEnv,
    };
  }

  if (allowPublicRegistration === 'true') {
    return {
      allowed: true,
      reason: 'ALLOW_PUBLIC_REGISTRATION=true',
      usersCount,
      allowPublicRegistration,
      nodeEnv,
    };
  }

  return {
    allowed: true,
    reason:
      allowPublicRegistration === undefined
        ? 'ALLOW_PUBLIC_REGISTRATION is unset (default allow)'
        : 'ALLOW_PUBLIC_REGISTRATION value is not "false"',
    usersCount,
    allowPublicRegistration,
    nodeEnv,
  };
}

/**
 * Handles new user registration (public only when allowed; see ALLOW_PUBLIC_REGISTRATION / NODE_ENV).
 */
const register = async (
  req: Request<unknown, unknown, RegisterBody>,
  res: Response
): Promise<void> => {
  try {
    const policy = await getRegistrationPolicy();
    if (!policy.allowed) {
      console.warn('Registration denied by policy', policy);
      res.status(403).json({
        message:
          'Public registration is disabled. Contact an administrator.',
      });
      return;
    }

    const { username, email, password, role } = req.body;

    // Check if a user with this email  already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      res.status(409).json({ message: 'Email already in use' });
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
      select: { id: true, email: true, username: true },
    });

    res.status(201).json({
      message: 'User created successfully',
      userId: newUser.id,
    });

    // Send welcome email in background so registration response is fast.
    void sendWelcomeEmail(newUser.email, newUser.username);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

const registrationStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const policy = await getRegistrationPolicy();
    res.status(200).json({
      registrationAllowed: policy.allowed,
      reason: policy.reason,
      usersCount: policy.usersCount,
      nodeEnv: policy.nodeEnv,
      allowPublicRegistration: policy.allowPublicRegistration ?? '(unset)',
    });
  } catch (error) {
    console.error('Registration status error:', error);
    res.status(500).json({ message: 'Error retrieving registration status' });
  }
};

/**
 * Handles user authentication and issues a JWT
 */
const login = async (
  req: Request<unknown, unknown, LoginBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        role: true,
        is_active: true,
      },
    });
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
      `User ${existingUser.email} logged in`,
      req.ip || 'unknown'
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
const changePassword = async (
  req: Request<unknown, unknown, ChangePasswordBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password_hash: true, is_active: true },
    });
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
      `User ${existingUser.email} changed their password`,
      req.ip || 'unknown'
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
};

const FORGOT_PASSWORD_RESPONSE = {
  message:
    'If an eligible account exists, password-reset instructions will be sent.',
};

/**
 * Initiates password reset: stores a hashed token and emails a reset link.
 */
const forgotPassword = async (
  req: Request<unknown, unknown, ForgotPasswordBody>,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, is_active: true },
    });

    if (user?.is_active) {
      const { token, tokenHash, expiresAt } = generateResetToken();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_password_token: tokenHash,
          reset_password_expires: expiresAt,
        },
      });

      const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
      const sent = await sendPasswordResetEmail(
        user.email,
        user.username,
        resetUrl
      );
      if (!sent) {
        console.error(
          `Password reset: token saved for ${user.email} but email delivery failed`
        );
      }
    } else if (user && !user.is_active) {
      console.info('Password reset: user exists but account is inactive');
    } else {
      console.info('Password reset: no matching active user for request');
    }

    res.status(200).json(FORGOT_PASSWORD_RESPONSE);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

/**
 * Completes password reset using a valid, unexpired token.
 */
const resetPassword = async (
  req: Request<unknown, unknown, ResetPasswordBody>,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = hashResetToken(token);

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: tokenHash,
        reset_password_expires: { gt: new Date() },
        is_active: true,
      },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(400).json({
        message: 'Invalid or expired reset link. Please request a new one.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });

    await logActivity(
      user.id,
      'PASSWORD_RESET',
      `User ${user.email} reset their password via email link`,
      req.ip || 'unknown'
    );

    res.status(200).json({
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

export const AuthController = {
  register,
  registrationStatus,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};
