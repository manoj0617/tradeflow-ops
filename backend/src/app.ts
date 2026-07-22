import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { customerRoutes } from './modules/customers/customer.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { challanRoutes } from './modules/challans/challan.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  credentials: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  const requestId = request.header('X-Request-Id') ?? crypto.randomUUID();
  response.setHeader('X-Request-Id', requestId);
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api', authenticate);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/challans', challanRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

