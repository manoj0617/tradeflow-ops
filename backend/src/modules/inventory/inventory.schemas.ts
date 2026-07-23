import { StockMovementType } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema, optionalQueryParam } from '../../common/pagination.js';

const productFields = z.object({
  name: z.string().trim().min(2).max(140),
  sku: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  category: z.string().trim().min(2).max(80),
  unitPrice: z.coerce.number().positive().max(99_999_999),
  minimumStock: z.coerce.number().int().min(0).max(1_000_000),
  warehouseId: z.string().uuid(),
});

export const createProductRequestSchema = z.object({
  body: productFields.extend({ openingStock: z.coerce.number().int().min(0).max(1_000_000).default(0) }),
});
export const updateProductRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: productFields.partial().extend({ isActive: z.boolean().optional() }),
});
export const productIdRequestSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const productListRequestSchema = z.object({
  query: listQuerySchema.extend({
    category: optionalQueryParam(z.string().trim().max(80)),
    warehouseId: optionalQueryParam(z.string().uuid()),
    lowStock: optionalQueryParam(z.enum(['true', 'false'])),
  }),
});
export const movementListRequestSchema = z.object({
  query: listQuerySchema.extend({
    productId: optionalQueryParam(z.string().uuid()),
    type: optionalQueryParam(z.nativeEnum(StockMovementType)),
  }),
});
export const stockAdjustmentRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    type: z.nativeEnum(StockMovementType),
    quantity: z.coerce.number().int().positive().max(1_000_000),
    reason: z.string().trim().min(3).max(300),
  }),
});
