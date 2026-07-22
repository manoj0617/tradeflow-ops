import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from './AppError.js';

export const validate = (schema: ZodType): RequestHandler => (request, _response, next) => {
  const result = schema.safeParse({ body: request.body, params: request.params, query: request.query });
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.').replace(/^(body|params|query)\./, ''),
      message: issue.message,
    }));
    next(new AppError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields', details));
    return;
  }
  const value = result.data as { body?: unknown; params?: unknown; query?: unknown };
  if (value.body) request.body = value.body;
  if (value.params) request.params = value.params as Request['params'];
  if (value.query) Object.assign(request.query, value.query);
  next();
};
