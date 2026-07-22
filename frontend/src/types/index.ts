export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
}

export interface FollowUp {
  id: string;
  note: string;
  followUpDate?: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string | number;
  currentStock: number;
  minimumStock: number;
  warehouseId: string;
  warehouse: Warehouse;
  isActive: boolean;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  balanceAfter: number;
  referenceNumber?: string;
  createdAt: string;
  product: Pick<Product, 'id' | 'name' | 'sku'>;
  createdBy: Pick<User, 'id' | 'name'>;
}

export interface ChallanItem {
  id: string;
  productId: string;
  quantity: number;
  snapshotProductName: string;
  snapshotSku: string;
  snapshotUnitPrice: string | number;
  product?: Pick<Product, 'id' | 'currentStock' | 'isActive'>;
}

export interface Challan {
  id: string;
  challanNumber: string;
  status: ChallanStatus;
  totalQuantity: number;
  cancellationReason?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  customer: Pick<Customer, 'id' | 'name' | 'businessName' | 'mobile'>;
  createdBy: Pick<User, 'id' | 'name'>;
  items: ChallanItem[];
}

export interface ApiList<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface ApiItem<T> {
  data: T;
  message?: string;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field: string; message: string }> | Record<string, unknown>;
  };
}

