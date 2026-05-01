import * as nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter =
  EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      // Prevent long registration delays when SMTP is slow/unavailable.
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    })
    : null;

/**
 * Sends a real welcome email to new users
 */
export const sendWelcomeEmail = async (userEmail: string, username: string) => {
  try {
    if (!transporter || !EMAIL_USER) {
      console.warn('Welcome email skipped: EMAIL_USER/EMAIL_PASS is not configured');
      return;
    }

    const mailOptions = {
      from: `"Illegal Construction Detection" <${EMAIL_USER}>`,
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
