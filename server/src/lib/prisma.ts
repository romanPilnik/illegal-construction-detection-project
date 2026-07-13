import dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

dotenv.config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
});

/** Avoid Windows resolving localhost to ::1 when MySQL only listens on IPv4. */
const resolveDatabaseHost = (host: string | undefined): string => {
  const value = host?.trim();
  if (!value || value === 'localhost') {
    return '127.0.0.1';
  }
  return value;
};

/** Use SSL for remote managed MySQL (e.g. Aiven) even in local dev. */
const databaseHost = resolveDatabaseHost(process.env.DATABASE_HOST);
const useDatabaseSsl =
  process.env.NODE_ENV === 'production' ||
  databaseHost.includes('aivencloud.com');

const adapter = new PrismaMariaDb({
  host: databaseHost,
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  allowPublicKeyRetrieval: true,
  connectionLimit: 2,
  connectTimeout: 30000,
  ssl: useDatabaseSsl ? { rejectUnauthorized: false } : false,
});

export const prisma = new PrismaClient({ adapter });

prisma
  .$connect()
  .then(() => console.log('Prisma connected to database'))
  .catch((err) => console.error('Prisma connection failed:', err));
