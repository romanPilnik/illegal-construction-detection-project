import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

/**
 * Handles new user registration
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    // Check if a user with this email already exists
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

    res
      .status(201)
      .json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

/**
 * Handles user authentication and issues a JWT
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // 2. Compare the provided password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, existingUser.password_hash);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // 3. Generate a JWT token containing the user's ID and role
    const token = jwt.sign(
      {
        userId: existingUser.id,
        role: existingUser.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    );

    // 4. Return the token and basic user info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
