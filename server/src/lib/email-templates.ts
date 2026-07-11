const BRAND_NAME = 'Illegal Construction Detection';
const BRAND_BLUE = '#2563eb';
const BRAND_BLUE_DARK = '#1d4ed8';
const BRAND_GREEN = '#10b981';
const SLATE_900 = '#0f172a';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailLayout(options: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  const safeHeading = escapeHtml(options.heading);
  const safePreheader = escapeHtml(options.preheader);
  const safeCtaUrl = escapeHtml(options.ctaUrl);
  const safeCtaLabel = escapeHtml(options.ctaLabel);
  const footerNote = options.footerNote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${SLATE_500};">${options.footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${safeHeading}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef2f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,${SLATE_900} 0%,#1e293b 100%);padding:28px 32px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:${BRAND_GREEN};line-height:48px;font-size:22px;margin-bottom:12px;">🏗️</div>
              <div style="font-size:18px;font-weight:700;color:#f8fafc;letter-spacing:0.2px;">${BRAND_NAME}</div>
              <div style="margin-top:6px;font-size:12px;color:#94a3b8;letter-spacing:0.4px;text-transform:uppercase;">Municipal Inspection Platform</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${SLATE_900};">${safeHeading}</h1>
              ${options.bodyHtml}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="border-radius:10px;background:${BRAND_BLUE};">
                    <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background:${BRAND_BLUE};">${safeCtaLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${SLATE_500};">
                Or copy and paste this link into your browser:<br />
                <a href="${safeCtaUrl}" style="color:${BRAND_BLUE_DARK};word-break:break-all;">${safeCtaUrl}</a>
              </p>
              ${footerNote}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${SLATE_500};">
                © ${new Date().getFullYear()} ${BRAND_NAME}<br />
                Automated message — please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWelcomeEmailHtml(username: string, loginUrl: string): string {
  const safeUsername = escapeHtml(username);
  return emailLayout({
    preheader: 'Your account is ready — sign in to start submitting analyses.',
    heading: `Welcome, ${safeUsername}!`,
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${SLATE_700};">
        Your registration was successful. You can now sign in to upload before/after imagery and run construction change analyses.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:${SLATE_700};">
        Use the button below to open the application and access your dashboard.
      </p>`,
    ctaLabel: 'Log In to Your Account',
    ctaUrl: loginUrl,
  });
}

export function buildPasswordResetEmailHtml(
  username: string,
  resetUrl: string,
  expiryMinutes: number
): string {
  const safeUsername = escapeHtml(username);
  return emailLayout({
    preheader: `Reset your password — this link is valid for ${expiryMinutes} minutes only.`,
    heading: 'Reset your password',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${SLATE_700};">
        Hi ${safeUsername}, we received a request to reset the password for your ${BRAND_NAME} account.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:${SLATE_700};">
        Click the button below to choose a new password. For your security, this link can only be used once.
      </p>`,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
    footerNote: `<strong style="color:${SLATE_700};">This link is valid for ${expiryMinutes} minutes only.</strong> If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.`,
  });
}
