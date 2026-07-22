import { ChallanStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AppError } from '../src/common/AppError.js';
import {
  assertCanCancel,
  assertCanConfirm,
  assertCanEdit,
  assertUniqueProductLines,
} from '../src/modules/challans/challanRules.js';

describe('challan business rules', () => {
  it('rejects duplicate product lines', () => {
    expect(() => assertUniqueProductLines([
      { productId: 'same', quantity: 1 },
      { productId: 'same', quantity: 2 },
    ])).toThrowError(AppError);
  });

  it('allows draft challans to be edited and confirmed', () => {
    expect(() => assertCanEdit(ChallanStatus.DRAFT)).not.toThrow();
    expect(() => assertCanConfirm(ChallanStatus.DRAFT)).not.toThrow();
  });

  it('prevents confirmed challans from being edited or confirmed twice', () => {
    expect(() => assertCanEdit(ChallanStatus.CONFIRMED)).toThrowError(/Only draft/);
    expect(() => assertCanConfirm(ChallanStatus.CONFIRMED)).toThrowError(/Only draft/);
  });

  it('prevents cancelling a challan twice', () => {
    expect(() => assertCanCancel(ChallanStatus.CANCELLED)).toThrowError(/already cancelled/);
  });
});

