export const CUSTOMER_KEYS = {
  all: ['customers'] as const,
  list: (params: Record<string, unknown>) => ['customers', 'list', params] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
};

