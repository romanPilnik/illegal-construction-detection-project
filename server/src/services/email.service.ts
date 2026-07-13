import dotenv from 'dotenv';
import dns from 'node:dns/promises';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
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

export type EmailProvider = 'resend' | 'smtp' | 'none';

const getSmtpConfig = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, '');
  if (!user || !pass) {
    return null;
  }
  return { user, pass };
};

const getResendApiKey = (): string | null =>
  process.env.RESEND_API_KEY?.trim() || null;

/** Resend uses HTTPS (port 443) — required on Render free tier, which blocks SMTP. */
export const getEmailProvider = (): EmailProvider => {
  if (getResendApiKey()) {
    return 'resend';
  }
  if (getSmtpConfig()) {
    return 'smtp';
  }
  return 'none';
};

export const isEmailConfigured = (): boolean => getEmailProvider() !== 'none';

const getFromAddress = (): string => {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured) {
    return configured;
  }

  const user = process.env.EMAIL_USER?.trim();
  if (user) {
    return `"Illegal Construction Detection" <${user}>`;
  }

  return '"Illegal Construction Detection" <onboarding@resend.dev>';
};

const getSmtpSettings = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  const hostname = process.env.EMAIL_HOST?.trim() || 'smtp.gmail.com';
  return { port, hostname };
};

const ipv4ByHostname = new Map<string, string>();

const resolveSmtpIpv4 = async (hostname: string): Promise<string> => {
  const cached = ipv4ByHostname.get(hostname);
  if (cached) {
    return cached;
  }

  const { address } = await dns.lookup(hostname, { family: 4 });
  ipv4ByHostname.set(hostname, address);
  console.log(`📧 SMTP resolved ${hostname} -> ${address} (IPv4)`);
  return address;
};

const createSmtpTransporter = async () => {
  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  const { port, hostname } = getSmtpSettings();
  const connectHost = await resolveSmtpIpv4(hostname);

  return nodemailer.createTransport({
    host: connectHost,
    port,
    secure: port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: {
      minVersion: 'TLSv1.2',
      servername: hostname,
    },
  });
};

let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

/** Call once at startup to surface email misconfiguration in Render logs. */
export const verifyEmailTransport = async (): Promise<boolean> => {
  const provider = getEmailProvider();
  if (provider === 'none') {
    return false;
  }

  if (provider === 'resend') {
    console.log(
      `📧 Email provider: Resend (HTTPS) — from ${getFromAddress()}`
    );
    return true;
  }

  const config = getSmtpConfig();
  if (!config) {
    return false;
  }

  const { port, hostname } = getSmtpSettings();

  try {
    const transporter = await createSmtpTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.verify();
    const ipv4 = ipv4ByHostname.get(hostname);
    console.log(
      `📧 SMTP verified for ${config.user} via ${hostname}:${port} (IPv4 ${ipv4 ?? 'unknown'})`
    );
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown SMTP verify error';
    console.error(
      `📧 SMTP verification failed for ${config.user} via ${hostname}:${port}: ${message}`
    );
    console.error(
      '📧 On Render free tier SMTP ports are blocked — set RESEND_API_KEY instead.'
    );
    return false;
  }
};

const sendMail = async (
  logLabel: string,
  mailOptions: { to: string; subject: string; html: string }
): Promise<boolean> => {
  const provider = getEmailProvider();
  if (provider === 'none') {
    console.warn(
      `${logLabel} skipped: set RESEND_API_KEY (Render) or EMAIL_USER/EMAIL_PASS (local SMTP)`
    );
    return false;
  }

  const from = getFromAddress();

  if (provider === 'resend') {
    try {
      const client = getResendClient();
      if (!client) {
        return false;
      }

      const { error } = await client.emails.send({
        from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });

      if (error) {
        console.error(`${logLabel} failed (Resend): ${error.message}`);
        return false;
      }

      console.log(`${logLabel} sent to ${mailOptions.to} (Resend)`);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Resend error';
      console.error(`${logLabel} failed (Resend): ${message}`);
      return false;
    }
  }

  const config = getSmtpConfig();
  if (!config) {
    return false;
  }

  try {
    const transporter = await createSmtpTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.sendMail({
      from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
    });
    console.log(`${logLabel} sent to ${mailOptions.to} (SMTP)`);
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown SMTP send error';
    console.error(`${logLabel} failed (SMTP): ${message}`);
    return false;
  }
};

export const sendWelcomeEmail = async (userEmail: string, username: string) => {
  if (!isEmailConfigured()) {
    return;
  }

  const loginUrl = `${getFrontendBaseUrl()}/login`;

  await sendMail('Welcome email', {
    to: userEmail,
    subject: 'Welcome to Illegal Construction Detection',
    html: buildWelcomeEmailHtml(username, loginUrl),
  });
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  username: string,
  resetUrl: string
): Promise<boolean> => {
  if (!isEmailConfigured()) {
    return false;
  }

  return sendMail('Password reset email', {
    to: userEmail,
    subject: 'Reset your password',
    html: buildPasswordResetEmailHtml(
      username,
      resetUrl,
      RESET_TOKEN_TTL_MINUTES
    ),
  });
};

export const sendAnalysisCompleteEmail = async (options: {
  userEmail: string;
  username: string;
  requestTitle: string;
  completedAt: Date;
  anomalyDetected: boolean;
  analysisId: string;
}) => {
  if (!isEmailConfigured()) {
    return;
  }

  const resultsUrl = `${getFrontendBaseUrl()}/analyses/${options.analysisId}`;
  const completedAtLabel = options.completedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  await sendMail('Analysis complete email', {
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
