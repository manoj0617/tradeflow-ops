import type { Prisma, StockMovementType } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { pageToPrisma } from '../../common/pagination.js';

interface ProductListOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  warehouseId?: string;
  lowStock?: boolean;
}

interface MovementListOptions {
  page: number;
  limit: number;
  search?: string;
  productId?: string;
  type?: StockMovementType;
}

export const inventoryRepository = {
  async listProducts(options: ProductListOptions) {
    const conditions: Prisma.ProductWhereInput[] = [
      { isActive: true },
      ...(options.category ? [{ category: { equals: options.category, mode: 'insensitive' as const } }] : []),
      ...(options.warehouseId ? [{ warehouseId: options.warehouseId }] : []),
      ...(options.search ? [{
        OR: [
          { name: { contains: options.search, mode: 'insensitive' as const } },
          { sku: { contains: options.search, mode: 'insensitive' as const } },
          { category: { contains: options.search, mode: 'insensitive' as const } },
        ],
      }] : []),
    ];
    const where: Prisma.ProductWhereInput = { AND: conditions };
    const [records, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        ...pageToPrisma(options.page, options.limit),
        orderBy: { updatedAt: 'desc' },
        include: { warehouse: true },
      }),
      prisma.product.count({ where }),
    ]);
    const data = options.lowStock
      ? records.filter((product) => product.currentStock <= product.minimumStock)
      : records;
    return { data, total: options.lowStock ? data.length : total };
  },

  findProductById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: { warehouse: true } });
  },

  listWarehouses() {
    return prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  },

  async listMovements(options: MovementListOptions) {
    const where: Prisma.StockMovementWhereInput = {
      ...(options.productId ? { productId: options.productId } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.search ? {
        OR: [
          { product: { name: { contains: options.search, mode: 'insensitive' } } },
          { product: { sku: { contains: options.search, mode: 'insensitive' } } },
          { reason: { contains: options.search, mode: 'insensitive' } },
          { referenceNumber: { contains: options.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        ...pageToPrisma(options.page, options.limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return { data, total };
  },
};

