import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/validation.js';
import { authorize } from '../../middleware/auth.js';
import {
  addFollowUp,
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customer.controller.js';
import {
  createCustomerRequestSchema,
  customerIdRequestSchema,
  customerListRequestSchema,
  followUpRequestSchema,
  updateCustomerRequestSchema,
} from './customer.schemas.js';

export const customerRoutes = Router();

customerRoutes.get('/', validate(customerListRequestSchema), listCustomers);
customerRoutes.post('/', authorize(UserRole.ADMIN, UserRole.SALES), validate(createCustomerRequestSchema), createCustomer);
customerRoutes.get('/:id', validate(customerIdRequestSchema), getCustomer);
customerRoutes.patch('/:id', authorize(UserRole.ADMIN, UserRole.SALES), validate(updateCustomerRequestSchema), updateCustomer);
customerRoutes.post(
  '/:id/follow-ups',
  authorize(UserRole.ADMIN, UserRole.SALES),
  validate(followUpRequestSchema),
  addFollowUp,
);

