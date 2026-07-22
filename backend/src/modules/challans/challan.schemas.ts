import { ChallanStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../common/pagination.js';

const lineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(1_000_000),
});

const challanFields = z.object({
  customerId: z.string().uuid(),
  items: z.array(lineItemSchema).min(1).max(100),
});

export const createChallanRequestSchema = z.object({
  body: challanFields.extend({
    status: z.enum([ChallanStatus.DRAFT, ChallanStatus.CONFIRMED]).default(ChallanStatus.DRAFT),
  }),
});
export const updateChallanRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: challanFields,
});
export const challanIdRequestSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const cancelChallanRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reason: z.string().trim().min(3).max(300) }),
});
export const challanListRequestSchema = z.object({
  query: listQuerySchema.extend({
    status: z.nativeEnum(ChallanStatus).optional(),
    customerId: z.string().uuid().optional(),
  }),
});

