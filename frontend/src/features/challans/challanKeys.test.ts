import { describe, expect, it } from 'vitest';
import { CHALLAN_KEYS } from './challanKeys';

describe('challan query keys', () => {
  it('keeps list parameters structured for precise cache invalidation', () => {
    expect(CHALLAN_KEYS.list({ page: 1, status: 'DRAFT' })).toEqual([
      'challans',
      'list',
      { page: 1, status: 'DRAFT' },
    ]);
  });
});

