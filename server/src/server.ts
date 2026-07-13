import config from './config.js';
import app from './app.js';
import { prisma } from './lib/prisma.js';
import {
  getEmailProvider,
  isEmailConfigured,
  verifyEmailTransport,
} from './services/email.service.js';
import http from 'http';
import { initWebSocket } from './services/socket.service.js';

const server = http.createServer(app);

initWebSocket(server);
server.listen(config.port, async () => {
  console.log(`🚀 Server is running on port ${config.port}`);
  console.log(`🔌 WebSocket server is ready`);
  const dbDisplay = process.env.DATABASE_HOST === 'localhost' || process.env.DATABASE_HOST === 'db'
    ? 'testing port (Local Docker)'
    : process.env.DATABASE_HOST;

  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('💾 DB Host:', dbDisplay); // כאן יודפס "הפורט בדיקות"
  console.log('🔢 DB Port:', process.env.DATABASE_PORT || '3306');
  const emailProvider = getEmailProvider();
  console.log(
    isEmailConfigured()
      ? `📧 Email: configured (${emailProvider === 'resend' ? 'Resend HTTPS' : 'SMTP'})`
      : '📧 Email: NOT configured — set RESEND_API_KEY on Render, or EMAIL_USER/EMAIL_PASS locally'
  );
  console.log('🔗 FRONTEND_URL:', process.env.FRONTEND_URL || '(not set)');

  if (isEmailConfigured()) {
    void verifyEmailTransport();
  }

  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
  }
});
