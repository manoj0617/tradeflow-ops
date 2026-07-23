import { ChallanStatus, Prisma, StockMovementType } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/AppError.js';
import { challanInclude, challanRepository } from './challan.repository.js';
import {
  assertCanCancel,
  assertCanConfirm,
  assertCanEdit,
  assertUniqueProductLines,
  type ChallanLineInput,
} from './challanRules.js';

type Transaction = Prisma.TransactionClient;

const loadProducts = async (transaction: Transaction, items: ChallanLineInput[]) => {
  assertUniqueProductLines(items);
  const ids = items.map((item) => item.productId);
  const products = await transaction.product.findMany({ where: { id: { in: ids }, isActive: true } });
  if (products.length !== ids.length) throw AppError.badRequest('INVALID_PRODUCT', 'One or more products are unavailable');
  return new Map(products.map((product) => [product.id, product]));
};

const nextChallanNumber = async (transaction: Transaction) => {
  const year = new Date().getUTCFullYear();
  const sequence = await transaction.documentSequence.upsert({
    where: { key: `CHALLAN_${year}` },
    update: { currentValue: { increment: 1 } },
    create: { key: `CHALLAN_${year}`, currentValue: 1 },
  });
  return `CH-${year}-${String(sequence.currentValue).padStart(6, '0')}`;
};

const lockProducts = async (transaction: Transaction, productIds: string[]) => {
  const sortedIds = [...productIds].sort();
  if (sortedIds.length) {
    const uuidParameters = sortedIds.map((id) => Prisma.sql`${id}::uuid`);
    await transaction.$queryRaw(
      Prisma.sql`SELECT id FROM "Product" WHERE id IN (${Prisma.join(uuidParameters)}) ORDER BY id FOR UPDATE`,
    );
  }
};

const confirmWithinTransaction = async (transaction: Transaction, id: string, userId: string) => {
  await transaction.$queryRaw`SELECT id FROM "SalesChallan" WHERE id = ${id}::uuid FOR UPDATE`;
  const challan = await transaction.salesChallan.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!challan) throw AppError.notFound('Challan');
  assertCanConfirm(challan.status);

  await lockProducts(transaction, challan.items.map((item) => item.productId));

  for (const item of challan.items) {
    const product = await transaction.product.findUnique({ where: { id: item.productId } });
    if (!product?.isActive) throw AppError.conflict('PRODUCT_UNAVAILABLE', `${item.snapshotProductName} is unavailable`);
    if (product.currentStock < item.quantity) {
      throw AppError.conflict(
        'INSUFFICIENT_STOCK',
        `Only ${product.currentStock} units of ${item.snapshotProductName} are available`,
        { productId: product.id, sku: product.sku, available: product.currentStock, requested: item.quantity },
      );
    }

    const update = await transaction.product.updateMany({
      where: { id: product.id, currentStock: { gte: item.quantity } },
      data: { currentStock: { decrement: item.quantity }, updatedById: userId },
    });
    if (update.count !== 1) {
      throw AppError.conflict('INSUFFICIENT_STOCK', `Stock changed while confirming ${item.snapshotProductName}. Try again.`);
    }
    const updated = await transaction.product.findUniqueOrThrow({ where: { id: product.id } });
    await transaction.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.OUT,
        quantity: item.quantity,
        reason: `Confirmed sales challan ${challan.challanNumber}`,
        balanceAfter: updated.currentStock,
        referenceType: 'SALES_CHALLAN',
        referenceId: challan.id,
        referenceNumber: challan.challanNumber,
        challanId: challan.id,
        createdById: userId,
      },
    });
  }

  return transaction.salesChallan.update({
    where: { id },
    data: { status: ChallanStatus.CONFIRMED, confirmedAt: new Date() },
    include: challanInclude,
  });
};

export const challanService = {
  list: challanRepository.list,

  async get(id: string) {
    const challan = await challanRepository.findById(id);
    if (!challan) throw AppError.notFound('Challan');
    return challan;
  },

  async create(
    data: { customerId: string; items: ChallanLineInput[]; status: ChallanStatus },
    userId: string,
  ) {
    return prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.findUnique({ where: { id: data.customerId } });
      if (!customer || customer.status === 'INACTIVE') {
        throw AppError.badRequest('INVALID_CUSTOMER', 'Select an active customer');
      }
      const products = await loadProducts(transaction, data.items);
      const challan = await transaction.salesChallan.create({
        data: {
          challanNumber: await nextChallanNumber(transaction),
          customerId: data.customerId,
          totalQuantity: data.items.reduce((total, item) => total + item.quantity, 0),
          createdById: userId,
          items: {
            create: data.items.map((item) => {
              const product = products.get(item.productId)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                snapshotProductName: product.name,
                snapshotSku: product.sku,
                snapshotUnitPrice: product.unitPrice,
              };
            }),
          },
        },
      });
      if (data.status === ChallanStatus.CONFIRMED) {
        return confirmWithinTransaction(transaction, challan.id, userId);
      }
      return transaction.salesChallan.findUniqueOrThrow({ where: { id: challan.id }, include: challanInclude });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async update(id: string, data: { customerId: string; items: ChallanLineInput[] }) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM "SalesChallan" WHERE id = ${id}::uuid FOR UPDATE`;
      const existing = await transaction.salesChallan.findUnique({ where: { id } });
      if (!existing) throw AppError.notFound('Challan');
      assertCanEdit(existing.status);
      const customer = await transaction.customer.findUnique({ where: { id: data.customerId } });
      if (!customer || customer.status === 'INACTIVE') throw AppError.badRequest('INVALID_CUSTOMER', 'Select an active customer');
      const products = await loadProducts(transaction, data.items);
      await transaction.salesChallanItem.deleteMany({ where: { challanId: id } });
      return transaction.salesChallan.update({
        where: { id },
        data: {
          customerId: data.customerId,
          totalQuantity: data.items.reduce((total, item) => total + item.quantity, 0),
          items: {
            create: data.items.map((item) => {
              const product = products.get(item.productId)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                snapshotProductName: product.name,
                snapshotSku: product.sku,
                snapshotUnitPrice: product.unitPrice,
              };
            }),
          },
        },
        include: challanInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  confirm(id: string, userId: string) {
    return prisma.$transaction(
      (transaction) => confirmWithinTransaction(transaction, id, userId),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async cancel(id: string, reason: string, userId: string) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM "SalesChallan" WHERE id = ${id}::uuid FOR UPDATE`;
      const challan = await transaction.salesChallan.findUnique({ where: { id }, include: { items: true } });
      if (!challan) throw AppError.notFound('Challan');
      assertCanCancel(challan.status);

      if (challan.status === ChallanStatus.CONFIRMED) {
        await lockProducts(transaction, challan.items.map((item) => item.productId));
        for (const item of challan.items) {
          const updated = await transaction.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity }, updatedById: userId },
          });
          await transaction.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.IN,
              quantity: item.quantity,
              reason: `Cancelled sales challan ${challan.challanNumber}: ${reason}`,
              balanceAfter: updated.currentStock,
              referenceType: 'SALES_CHALLAN_CANCELLATION',
              referenceId: challan.id,
              referenceNumber: challan.challanNumber,
              challanId: challan.id,
              createdById: userId,
            },
          });
        }
      }

      return transaction.salesChallan.update({
        where: { id },
        data: {
          status: ChallanStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        include: challanInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
};
