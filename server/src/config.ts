//import dotenv from 'dotenv';

//dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
}

const config: Config = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: [
    'http://localhost:5173',
    'https://illegal-construction-detection-project-1.onrender.com',
  ],
};

export default config;
