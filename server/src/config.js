import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  persistence: process.env.PERSISTENCE || 'memory',
  mongodbUri: process.env.MONGODB_URI || '',
};
