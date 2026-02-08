import config from './config.js';
import app from './app.js';
import { prisma } from './lib/prisma.js';

app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);
  try {
    await prisma.$connect();
    console.log('Prisma connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
});
