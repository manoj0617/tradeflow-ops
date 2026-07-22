export const CHALLAN_KEYS = {
  all: ['challans'] as const,
  list: (params: Record<string, unknown>) => ['challans', 'list', params] as const,
  detail: (id: string) => ['challans', 'detail', id] as const,
};

