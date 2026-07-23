import { CustomerStatus, CustomerType } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema, optionalQueryParam } from '../../common/pagination.js';

const customerFields = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,17}$/, 'Enter a valid mobile number'),
  email: z.union([z.string().trim().email(), z.literal('')]).optional().transform((value) => value || undefined),
  businessName: z.string().trim().min(2).max(140),
  gstNumber: z.union([
    z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/, 'Enter a valid GST number'),
    z.literal(''),
  ]).optional().transform((value) => value || undefined),
  type: z.nativeEnum(CustomerType),
  address: z.string().trim().min(5).max(500),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z.union([z.coerce.date(), z.literal('')]).optional().transform((value) => value || undefined),
  notes: z.string().trim().max(1000).optional(),
});

export const createCustomerRequestSchema = z.object({ body: customerFields });
export const updateCustomerRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: customerFields.partial(),
});
export const customerIdRequestSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const customerListRequestSchema = z.object({
  query: listQuerySchema.extend({
    status: optionalQueryParam(z.nativeEnum(CustomerStatus)),
    type: optionalQueryParam(z.nativeEnum(CustomerType)),
  }),
});
export const followUpRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    note: z.string().trim().min(3).max(1000),
    followUpDate: z.union([z.coerce.date(), z.literal('')]).optional().transform((value) => value || undefined),
  }),
});
