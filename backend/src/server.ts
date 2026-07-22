import 'dotenv/config';
import { z } from 'zod';
import { app } from './app.js';
import { prisma } from './common/prisma.js';

const environment = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('2h'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}).parse(process.env);

const server = app.listen(environment.PORT, () => {
  console.log(JSON.stringify({ level: 'info', message: 'TradeFlow Ops API started', port: environment.PORT }));
});

const shutdown = async (signal: string) => {
  console.log(JSON.stringify({ level: 'info', message: 'Shutting down API', signal }));
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

