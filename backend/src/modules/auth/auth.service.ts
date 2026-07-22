import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppError } from '../../common/AppError.js';
import { authRepository } from './auth.repository.js';

export const authService = {
  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      throw AppError.unauthorized('Email or password is incorrect');
    }

    const token = jwt.sign(
      { role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      {
        subject: user.id,
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '2h') as SignOptions['expiresIn'],
      },
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
};

