import { asyncHandler } from '../../common/asyncHandler.js';
import { authService } from './auth.service.js';

export const login = asyncHandler(async (request, response) => {
  const result = await authService.login(request.body.email, request.body.password);
  response.json({ data: result, message: 'Signed in successfully' });
});

export const me = asyncHandler(async (request, response) => {
  response.json({ data: request.user });
});

