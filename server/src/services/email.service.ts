import dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import {
  buildPasswordResetEmailHtml,
  buildWelcomeEmailHtml,
} from '../lib/email-templates.js';
import {
  getFrontendBaseUrl,
  RESET_TOKEN_TTL_MINUTES,
} from './password-reset.service.js';

dotenv.config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
});

const getMailConfig = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, '');
  if (!user || !pass) {
    return null;
  }
  return { user, pass };
};

const createTransporter = () => {
  const config = getMailConfig();
  if (!config) {
    return null;
  }

  const port = Number(process.env.EMAIL_PORT) || 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

/**
 * Sends a branded welcome email to new users.
 */
export const sendWelcomeEmail = async (userEmail: string, username: string) => {
  try {
    const config = getMailConfig();
    const transporter = createTransporter();
    if (!transporter || !config) {
      console.warn('Welcome email skipped: EMAIL_USER/EMAIL_PASS is not configured');
      return;
    }

    const loginUrl = `${getFrontendBaseUrl()}/login`;

    const mailOptions = {
      from: `"Illegal Construction Detection" <${config.user}>`,
      to: userEmail,
      subject: 'Welcome to Illegal Construction Detection',
      html: buildWelcomeEmailHtml(username, loginUrl),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Real email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send real email:', error);
  }
};

/**
 * Sends a branded password reset link (valid for RESET_TOKEN_TTL_MINUTES).
 */
export const sendPasswordResetEmail = async (
  userEmail: string,
  username: string,
  resetUrl: string
) => {
  try {
    const config = getMailConfig();
    const transporter = createTransporter();
    if (!transporter || !config) {
      console.warn(
        'Password reset email skipped: EMAIL_USER/EMAIL_PASS is not configured'
      );
      return;
    }

    const mailOptions = {
      from: `"Illegal Construction Detection" <${config.user}>`,
      to: userEmail,
      subject: 'Reset your password',
      html: buildPasswordResetEmailHtml(
        username,
        resetUrl,
        RESET_TOKEN_TTL_MINUTES
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};
