import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/validation.js';
import { authorize } from '../../middleware/auth.js';
import {
  cancelChallan,
  confirmChallan,
  createChallan,
  getChallan,
  listChallans,
  updateChallan,
} from './challan.controller.js';
import {
  cancelChallanRequestSchema,
  challanIdRequestSchema,
  challanListRequestSchema,
  createChallanRequestSchema,
  updateChallanRequestSchema,
} from './challan.schemas.js';

export const challanRoutes = Router();

challanRoutes.get('/', validate(challanListRequestSchema), listChallans);
challanRoutes.post('/', authorize(UserRole.ADMIN, UserRole.SALES), validate(createChallanRequestSchema), createChallan);
challanRoutes.post(
  '/:id/confirm',
  authorize(UserRole.ADMIN, UserRole.SALES),
  validate(challanIdRequestSchema),
  confirmChallan,
);
challanRoutes.post(
  '/:id/cancel',
  authorize(UserRole.ADMIN, UserRole.SALES),
  validate(cancelChallanRequestSchema),
  cancelChallan,
);
challanRoutes.get('/:id', validate(challanIdRequestSchema), getChallan);
challanRoutes.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SALES),
  validate(updateChallanRequestSchema),
  updateChallan,
);

