import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import auditLogRoutes from './routes/log.routes.js';
import analysisRoutes from './routes/analysis.routes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://illegal-construction-detection-project-1.onrender.com' // הקליינט בפרודקשן!
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // OPTIONS קריטי לבקשות מורכבות מהדפדפן
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/reports', express.static('reports'));
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/logs', auditLogRoutes);
app.use('/api/v1/analyses', analysisRoutes);

export default app;
