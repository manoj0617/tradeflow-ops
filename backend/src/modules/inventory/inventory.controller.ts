import type { StockMovementType } from '@prisma/client';
import { asyncHandler } from '../../common/asyncHandler.js';
import { inventoryService } from './inventory.service.js';

export const listProducts = asyncHandler(async (request, response) => {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);
  const result = await inventoryService.listProducts({
    page,
    limit,
    search: request.query.search as string | undefined,
    category: request.query.category as string | undefined,
    warehouseId: request.query.warehouseId as string | undefined,
    lowStock: request.query.lowStock === 'true',
  });
  response.json({ data: result.data, meta: { total: result.total, page, limit } });
});

export const getProduct = asyncHandler(async (request, response) => {
  response.json({ data: await inventoryService.getProduct(request.params.id as string) });
});

export const createProduct = asyncHandler(async (request, response) => {
  const product = await inventoryService.createProduct(request.body, request.user!.id);
  response.status(201).json({ data: product, message: 'Product created successfully' });
});

export const updateProduct = asyncHandler(async (request, response) => {
  const product = await inventoryService.updateProduct(request.params.id as string, request.body, request.user!.id);
  response.json({ data: product, message: 'Product updated successfully' });
});

export const adjustStock = asyncHandler(async (request, response) => {
  const result = await inventoryService.adjustStock(
    request.params.id as string,
    request.body.type,
    request.body.quantity,
    request.body.reason,
    request.user!.id,
  );
  response.status(201).json({ data: result, message: 'Stock movement recorded successfully' });
});

export const listMovements = asyncHandler(async (request, response) => {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);
  const result = await inventoryService.listMovements({
    page,
    limit,
    search: request.query.search as string | undefined,
    productId: request.query.productId as string | undefined,
    type: request.query.type as StockMovementType | undefined,
  });
  response.json({ data: result.data, meta: { total: result.total, page, limit } });
});

export const listWarehouses = asyncHandler(async (_request, response) => {
  response.json({ data: await inventoryService.listWarehouses() });
});

