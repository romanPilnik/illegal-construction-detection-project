import dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import {
  buildAnalysisCompleteEmailHtml,
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

export const isEmailConfigured = (): boolean => getMailConfig() !== null;

const createTransporter = () => {
  const config = getMailConfig();
  if (!config) {
    return null;
  }

  const port = Number(process.env.EMAIL_PORT) || 465;
  const host = process.env.EMAIL_HOST?.trim() || 'smtp.gmail.com';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Render has no route to Gmail SMTP over IPv6 (ENETUNREACH on 2a00:1450:...).
    family: 4,
    // Render → Gmail can be slow; short timeouts caused ETIMEDOUT in production logs.
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: {
      minVersion: 'TLSv1.2',
    },
  });
};

/** Call once at startup to surface SMTP misconfiguration in Render logs. */
export const verifyEmailTransport = async (): Promise<boolean> => {
  const config = getMailConfig();
  const transporter = createTransporter();
  if (!transporter || !config) {
    return false;
  }

  const port = Number(process.env.EMAIL_PORT) || 465;
  const host = process.env.EMAIL_HOST?.trim() || 'smtp.gmail.com';

  try {
    await transporter.verify();
    console.log(
      `📧 SMTP verified for ${config.user} via ${host}:${port}`
    );
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown SMTP verify error';
    console.error(
      `📧 SMTP verification failed for ${config.user} via ${host}:${port}: ${message}`
    );
    if (port === 465) {
      console.error(
        '📧 Tip: On Render, try EMAIL_PORT=587 with EMAIL_HOST=smtp.gmail.com'
      );
    }
    return false;
  }
};

const sendMail = async (
  logLabel: string,
  mailOptions: nodemailer.SendMailOptions
): Promise<boolean> => {
  const config = getMailConfig();
  const transporter = createTransporter();
  if (!transporter || !config) {
    console.warn(`${logLabel} skipped: EMAIL_USER/EMAIL_PASS is not configured`);
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`${logLabel} sent to ${String(mailOptions.to)}`);
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown send error';
    console.error(`${logLabel} failed: ${message}`);
    return false;
  }
};

/**
 * Sends a branded welcome email to new users.
 */
export const sendWelcomeEmail = async (userEmail: string, username: string) => {
  const config = getMailConfig();
  if (!config) {
    return;
  }

  const loginUrl = `${getFrontendBaseUrl()}/login`;

  await sendMail('Welcome email', {
    from: `"Illegal Construction Detection" <${config.user}>`,
    to: userEmail,
    subject: 'Welcome to Illegal Construction Detection',
    html: buildWelcomeEmailHtml(username, loginUrl),
  });
};

/**
 * Sends a branded password reset link (valid for RESET_TOKEN_TTL_MINUTES).
 */
export const sendPasswordResetEmail = async (
  userEmail: string,
  username: string,
  resetUrl: string
): Promise<boolean> => {
  const config = getMailConfig();
  if (!config) {
    return false;
  }

  return sendMail('Password reset email', {
    from: `"Illegal Construction Detection" <${config.user}>`,
    to: userEmail,
    subject: 'Reset your password',
    html: buildPasswordResetEmailHtml(
      username,
      resetUrl,
      RESET_TOKEN_TTL_MINUTES
    ),
  });
};

/**
 * Sends a branded analysis completion summary to the submitting user.
 */
export const sendAnalysisCompleteEmail = async (options: {
  userEmail: string;
  username: string;
  requestTitle: string;
  completedAt: Date;
  anomalyDetected: boolean;
  analysisId: string;
}) => {
  const config = getMailConfig();
  if (!config) {
    return;
  }

  const resultsUrl = `${getFrontendBaseUrl()}/analyses/${options.analysisId}`;
  const completedAtLabel = options.completedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  await sendMail('Analysis complete email', {
    from: `"Illegal Construction Detection" <${config.user}>`,
    to: options.userEmail,
    subject: `Analysis complete: ${options.requestTitle}`,
    html: buildAnalysisCompleteEmailHtml({
      username: options.username,
      requestTitle: options.requestTitle,
      completedAt: completedAtLabel,
      anomalyDetected: options.anomalyDetected,
      resultsUrl,
    }),
  });
};
