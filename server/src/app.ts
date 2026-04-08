import express from 'express';
import cors, { CorsOptions } from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import auditLogRoutes from './routes/log.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import { prisma } from './lib/prisma.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://illegal-construction-detection-project-1.onrender.com'
];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
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

app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', message: 'Server and DB are alive! 🚀' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'ERROR', message: 'DB connection failed' });
  }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use('/reports', express.static('reports'));
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/logs', auditLogRoutes);
app.use('/api/v1/analyses', analysisRoutes);

export default app;