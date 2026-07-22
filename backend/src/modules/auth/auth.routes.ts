import { Router } from 'express';
import { validate } from '../../common/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { login, me } from './auth.controller.js';
import { loginRequestSchema } from './auth.schemas.js';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginRequestSchema), login);
authRoutes.get('/me', authenticate, me);
authRoutes.post('/logout', authenticate, (_request, response) => response.status(204).send());

