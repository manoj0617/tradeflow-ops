import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { validate } from '../../common/validation.js';
import { authorize } from '../../middleware/auth.js';
import {
  adjustStock,
  createProduct,
  getProduct,
  listMovements,
  listProducts,
  listWarehouses,
  updateProduct,
} from './inventory.controller.js';
import {
  createProductRequestSchema,
  movementListRequestSchema,
  productIdRequestSchema,
  productListRequestSchema,
  stockAdjustmentRequestSchema,
  updateProductRequestSchema,
} from './inventory.schemas.js';

export const inventoryRoutes = Router();

inventoryRoutes.get('/warehouses', listWarehouses);
inventoryRoutes.get('/stock-movements', validate(movementListRequestSchema), listMovements);
inventoryRoutes.get('/products', validate(productListRequestSchema), listProducts);
inventoryRoutes.post(
  '/products',
  authorize(UserRole.ADMIN, UserRole.WAREHOUSE),
  validate(createProductRequestSchema),
  createProduct,
);
inventoryRoutes.get('/products/:id', validate(productIdRequestSchema), getProduct);
inventoryRoutes.patch(
  '/products/:id',
  authorize(UserRole.ADMIN, UserRole.WAREHOUSE),
  validate(updateProductRequestSchema),
  updateProduct,
);
inventoryRoutes.post(
  '/products/:id/stock-adjustments',
  authorize(UserRole.ADMIN, UserRole.WAREHOUSE),
  validate(stockAdjustmentRequestSchema),
  adjustStock,
);

