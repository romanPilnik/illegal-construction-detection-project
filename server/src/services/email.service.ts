import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a real welcome email to new users
 */
export const sendWelcomeEmail = async (userEmail: string, username: string) => {
  try {
    const mailOptions = {
      from: `"Illegal Construction Detection" <${process.env.EMAIL_USER}>`,
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