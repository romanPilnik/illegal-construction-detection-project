import dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';

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
 * Sends a real welcome email to new users
 */
export const sendWelcomeEmail = async (userEmail: string, username: string) => {
  try {
    const config = getMailConfig();
    const transporter = createTransporter();
    if (!transporter || !config) {
      console.warn('Welcome email skipped: EMAIL_USER/EMAIL_PASS is not configured');
      return;
    }

    const mailOptions = {
      from: `"Illegal Construction Detection" <${config.user}>`,
      to: userEmail,
      subject: 'Welcome to the System! 🏗️',
      html: `
        <div style="font-family: Arial, sans-serif; direction: ltr;">
          <h1 style="color: #2c3e50;">Hi ${username}!</h1>
          <p>Your registration to the construction detection system was successful.</p>
          <p>From now on, you can upload imagery and analyze construction status.</p>
          <hr>
          <p>Best regards,<br><strong>System Administration Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Real email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send real email:', error);
  }
};

/**
 * Sends a password reset link (valid for 1 hour).
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
      html: `
        <div style="font-family: Arial, sans-serif; direction: ltr;">
          <h1 style="color: #2c3e50;">Hi ${username},</h1>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetUrl}" style="color: #2563eb;">Click here to set a new password</a></p>
          <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">Or copy this URL into your browser:<br>${resetUrl}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};
