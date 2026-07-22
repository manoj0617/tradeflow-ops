import { ChallanStatus } from '@prisma/client';
import { AppError } from '../../common/AppError.js';

export interface ChallanLineInput {
  productId: string;
  quantity: number;
}

export const assertUniqueProductLines = (items: ChallanLineInput[]) => {
  const productIds = items.map((item) => item.productId);
  if (new Set(productIds).size !== productIds.length) {
    throw AppError.badRequest('DUPLICATE_PRODUCT_LINE', 'Each product may appear only once in a challan');
  }
};

export const assertCanEdit = (status: ChallanStatus) => {
  if (status !== ChallanStatus.DRAFT) {
    throw AppError.conflict('INVALID_STATUS_TRANSITION', 'Only draft challans can be edited');
  }
};

export const assertCanConfirm = (status: ChallanStatus) => {
  if (status !== ChallanStatus.DRAFT) {
    throw AppError.conflict('INVALID_STATUS_TRANSITION', 'Only draft challans can be confirmed');
  }
};

export const assertCanCancel = (status: ChallanStatus) => {
  if (status === ChallanStatus.CANCELLED) {
    throw AppError.conflict('INVALID_STATUS_TRANSITION', 'This challan is already cancelled');
  }
};

