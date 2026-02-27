import config from './config.js';
import app from './app.js';
import { prisma } from './lib/prisma.js';
import http from 'http';
import { initWebSocket } from './services/socket.service.js';

const server = http.createServer(app);

initWebSocket(server);
server.listen(config.port, async () => {
  console.log(` Server is running on port ${config.port}`);
  console.log(` WebSocket server is ready`);

  try {
    await prisma.$connect();
    console.log(' Prisma connected to database');
  } catch (error) {
    console.error(' Failed to connect to database:', error);
  }
});
