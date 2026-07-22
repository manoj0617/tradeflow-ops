export const INVENTORY_KEYS = {
  products: ['inventory', 'products'] as const,
  productList: (params: Record<string, unknown>) => ['inventory', 'products', params] as const,
  movements: ['inventory', 'movements'] as const,
  movementList: (params: Record<string, unknown>) => ['inventory', 'movements', params] as const,
  warehouses: ['inventory', 'warehouses'] as const,
};

