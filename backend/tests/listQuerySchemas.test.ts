import { describe, expect, it } from 'vitest';
import { challanListRequestSchema } from '../src/modules/challans/challan.schemas.js';
import { customerListRequestSchema } from '../src/modules/customers/customer.schemas.js';
import {
  movementListRequestSchema,
  productListRequestSchema,
} from '../src/modules/inventory/inventory.schemas.js';

describe('list query schemas', () => {
  it.each([
    ['customers', customerListRequestSchema, { status: '', type: '' }],
    ['products', productListRequestSchema, { category: '', warehouseId: '', lowStock: '' }],
    ['stock movements', movementListRequestSchema, { productId: '', type: '' }],
    ['challans', challanListRequestSchema, { status: '', customerId: '' }],
  ])('accepts empty optional filters for %s', (_name, schema, filters) => {
    const result = schema.safeParse({
      query: { page: '1', limit: '20', search: '', ...filters },
    });

    expect(result.success).toBe(true);
  });

  it('still rejects a non-empty invalid movement type', () => {
    const result = movementListRequestSchema.safeParse({
      query: { page: '1', limit: '20', type: 'TRANSFER' },
    });

    expect(result.success).toBe(false);
  });
});
