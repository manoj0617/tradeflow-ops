import type { CustomerStatus, CustomerType, Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { pageToPrisma } from '../../common/pagination.js';

interface CustomerListOptions {
  page: number;
  limit: number;
  search?: string;
  status?: CustomerStatus;
  type?: CustomerType;
}

export const customerRepository = {
  async list(options: CustomerListOptions) {
    const where: Prisma.CustomerWhereInput = {
      ...(options.status ? { status: options.status } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.search ? {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { businessName: { contains: options.search, mode: 'insensitive' } },
          { mobile: { contains: options.search } },
          { email: { contains: options.search, mode: 'insensitive' } },
          { gstNumber: { contains: options.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        ...pageToPrisma(options.page, options.limit),
        orderBy: { updatedAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      }),
      prisma.customer.count({ where }),
    ]);
    return { data, total };
  },

  findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });
  },

  create(data: Prisma.CustomerUncheckedCreateInput) {
    return prisma.customer.create({ data });
  },

  update(id: string, data: Prisma.CustomerUncheckedUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  createFollowUp(data: Prisma.CustomerFollowUpUncheckedCreateInput) {
    return prisma.customerFollowUp.create({
      data,
      include: { createdBy: { select: { id: true, name: true } } },
    });
  },
};

