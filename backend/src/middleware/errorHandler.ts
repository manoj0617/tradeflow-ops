import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/AppError.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `No route matches ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  let appError = error instanceof AppError ? error : null;

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    appError = AppError.conflict('DUPLICATE_RECORD', 'A record with that unique value already exists', error.meta);
  }

  if (!appError) {
    console.error(JSON.stringify({
      level: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: response.getHeader('X-Request-Id'),
      method: request.method,
      path: request.path,
    }));
    appError = new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  response.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
    },
  });
};

