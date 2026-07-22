import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { prisma } from '../common/prisma.js';
import { AppError } from '../common/AppError.js';
import { asyncHandler } from '../common/asyncHandler.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  sub: string;
}

export const authenticate = asyncHandler(async (request, _response, next) => {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) throw AppError.unauthorized('A valid Bearer token is required');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  } catch {
    throw AppError.unauthorized('Your session is invalid or has expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user?.isActive) throw AppError.unauthorized('This account is inactive');
  request.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
});

export const authorize = (...roles: UserRole[]): RequestHandler => (request, _response, next) => {
  if (!request.user) return next(AppError.unauthorized());
  if (!roles.includes(request.user.role)) return next(AppError.forbidden());
  next();
};

