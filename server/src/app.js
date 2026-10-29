import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import appointmentsRouter from './routes/appointments.js';
import { STATUSES, SERVICES } from './models/appointment.js';
import { errorHandler, notFound } from './middleware/errorHandlers.js';
import { store } from './store/index.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', persistence: store.name, uptime: process.uptime() });
  });

  app.get('/api/meta', (req, res) => {
    res.json({ statuses: STATUSES, services: SERVICES });
  });

  app.use('/api/appointments', appointmentsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
