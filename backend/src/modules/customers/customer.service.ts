import type { CustomerStatus, CustomerType, Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/AppError.js';
import { customerRepository } from './customer.repository.js';

interface CustomerListOptions {
  page: number;
  limit: number;
  search?: string;
  status?: CustomerStatus;
  type?: CustomerType;
}

export const customerService = {
  list: (options: CustomerListOptions) => customerRepository.list(options),

  async get(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw AppError.notFound('Customer');
    return customer;
  },

  create(data: Omit<Prisma.CustomerUncheckedCreateInput, 'createdById' | 'updatedById'>, userId: string) {
    return customerRepository.create({ ...data, createdById: userId, updatedById: userId });
  },

  async update(id: string, data: Prisma.CustomerUncheckedUpdateInput, userId: string) {
    await this.get(id);
    return customerRepository.update(id, { ...data, updatedById: userId });
  },

  async addFollowUp(customerId: string, note: string, followUpDate: Date | undefined, userId: string) {
    await this.get(customerId);
    return prisma.$transaction(async (transaction) => {
      const followUp = await transaction.customerFollowUp.create({
        data: { customerId, note, followUpDate, createdById: userId },
        include: { createdBy: { select: { id: true, name: true } } },
      });
      if (followUpDate) {
        await transaction.customer.update({
          where: { id: customerId },
          data: { followUpDate, updatedById: userId },
        });
      }
      return followUp;
    });
  },
};

