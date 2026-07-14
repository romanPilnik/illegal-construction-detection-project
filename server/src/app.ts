import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import auditLogRoutes from './routes/log.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import { prisma } from './lib/prisma.js';
import {
  getEmailProvider,
  isEmailConfigured,
} from './services/email.service.js';
import config from './config.js';

const app = express();

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      message: 'Server and DB are alive! 🚀',
      emailConfigured: isEmailConfigured(),
      emailProvider: getEmailProvider(),
      frontendUrlSet: Boolean(process.env.FRONTEND_URL?.trim()),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'ERROR', message: 'DB connection failed' });
  }
});

app.use(express.json());
app.use('/reports', express.static('reports'));
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/logs', auditLogRoutes);
app.use('/api/v1/analyses', analysisRoutes);

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found.' });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  void next;
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
      ? error.status
      : error instanceof Error && error.message === 'Not allowed by CORS'
        ? 403
        : 500;

  console.error('Unhandled request error:', error);
  res.status(status).json({
    message:
      status === 400
        ? 'Invalid request body.'
        : status === 403
          ? 'Request origin is not allowed.'
          : status === 413
            ? 'Request body is too large.'
            : status < 500
              ? 'Request could not be processed.'
              : 'Internal server error.',
  });
};

app.use(notFoundHandler);
app.use(errorHandler);
export default app;
