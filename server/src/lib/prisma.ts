import dotenv from 'dotenv'

// Load environment-specific file
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.production.development'
})

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT!),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  connectionLimit: 2,
  connectTimeout: 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export const prisma = new PrismaClient({ adapter })

prisma.$connect()
  .then(() => console.log('Prisma connected to database'))
  .catch((err) => console.error('Prisma connection failed:', err))