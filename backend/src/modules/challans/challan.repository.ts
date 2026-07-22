import type { ChallanStatus, Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { pageToPrisma } from '../../common/pagination.js';

export const challanInclude = {
  customer: { select: { id: true, name: true, businessName: true, mobile: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    orderBy: { snapshotProductName: 'asc' as const },
    include: { product: { select: { id: true, currentStock: true, isActive: true } } },
  },
} satisfies Prisma.SalesChallanInclude;

interface ChallanListOptions {
  page: number;
  limit: number;
  search?: string;
  status?: ChallanStatus;
  customerId?: string;
}

export const challanRepository = {
  async list(options: ChallanListOptions) {
    const where: Prisma.SalesChallanWhereInput = {
      ...(options.status ? { status: options.status } : {}),
      ...(options.customerId ? { customerId: options.customerId } : {}),
      ...(options.search ? {
        OR: [
          { challanNumber: { contains: options.search, mode: 'insensitive' } },
          { customer: { name: { contains: options.search, mode: 'insensitive' } } },
          { customer: { businessName: { contains: options.search, mode: 'insensitive' } } },
        ],
      } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.salesChallan.findMany({
        where,
        ...pageToPrisma(options.page, options.limit),
        orderBy: { createdAt: 'desc' },
        include: challanInclude,
      }),
      prisma.salesChallan.count({ where }),
    ]);
    return { data, total };
  },

  findById(id: string) {
    return prisma.salesChallan.findUnique({ where: { id }, include: challanInclude });
  },
};

