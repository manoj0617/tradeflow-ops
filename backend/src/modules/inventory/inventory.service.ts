import { Prisma, StockMovementType } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/AppError.js';
import { inventoryRepository } from './inventory.repository.js';

export const inventoryService = {
  listProducts: inventoryRepository.listProducts,
  listMovements: inventoryRepository.listMovements,
  listWarehouses: inventoryRepository.listWarehouses,

  async getProduct(id: string) {
    const product = await inventoryRepository.findProductById(id);
    if (!product) throw AppError.notFound('Product');
    return product;
  },

  async createProduct(
    data: {
      name: string;
      sku: string;
      category: string;
      unitPrice: number;
      minimumStock: number;
      warehouseId: string;
      openingStock: number;
    },
    userId: string,
  ) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id: data.warehouseId, isActive: true } });
    if (!warehouse) throw AppError.notFound('Warehouse');

    return prisma.$transaction(async (transaction) => {
      const product = await transaction.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          unitPrice: data.unitPrice,
          minimumStock: data.minimumStock,
          currentStock: data.openingStock,
          warehouseId: data.warehouseId,
          createdById: userId,
          updatedById: userId,
        },
        include: { warehouse: true },
      });
      if (data.openingStock > 0) {
        await transaction.stockMovement.create({
          data: {
            productId: product.id,
            type: StockMovementType.IN,
            quantity: data.openingStock,
            reason: 'Opening stock',
            balanceAfter: data.openingStock,
            referenceType: 'PRODUCT_OPENING',
            referenceId: product.id,
            createdById: userId,
          },
        });
      }
      return product;
    });
  },

  async updateProduct(id: string, data: Prisma.ProductUncheckedUpdateInput, userId: string) {
    await this.getProduct(id);
    return prisma.product.update({
      where: { id },
      data: { ...data, updatedById: userId },
      include: { warehouse: true },
    });
  },

  async adjustStock(id: string, type: StockMovementType, quantity: number, reason: string, userId: string) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM "Product" WHERE id = ${id}::uuid FOR UPDATE`;
      const product = await transaction.product.findUnique({ where: { id } });
      if (!product?.isActive) throw AppError.notFound('Product');
      if (type === StockMovementType.OUT && product.currentStock < quantity) {
        throw AppError.conflict('INSUFFICIENT_STOCK', `Only ${product.currentStock} units are available`, {
          available: product.currentStock,
          requested: quantity,
        });
      }
      const updated = await transaction.product.update({
        where: { id },
        data: {
          currentStock: type === StockMovementType.IN ? { increment: quantity } : { decrement: quantity },
          updatedById: userId,
        },
      });
      const movement = await transaction.stockMovement.create({
        data: {
          productId: id,
          type,
          quantity,
          reason,
          balanceAfter: updated.currentStock,
          referenceType: 'MANUAL_ADJUSTMENT',
          createdById: userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
      return { product: updated, movement };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
};

