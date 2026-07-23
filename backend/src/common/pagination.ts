import { z } from 'zod';

export const optionalQueryParam = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => value === '' ? undefined : value, schema.optional());

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional().default(''),
});

export const pageToPrisma = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});
