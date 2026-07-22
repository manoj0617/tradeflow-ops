import type { ChallanStatus } from '@prisma/client';
import { asyncHandler } from '../../common/asyncHandler.js';
import { challanService } from './challan.service.js';

export const listChallans = asyncHandler(async (request, response) => {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);
  const result = await challanService.list({
    page,
    limit,
    search: request.query.search as string | undefined,
    status: request.query.status as ChallanStatus | undefined,
    customerId: request.query.customerId as string | undefined,
  });
  response.json({ data: result.data, meta: { total: result.total, page, limit } });
});

export const getChallan = asyncHandler(async (request, response) => {
  response.json({ data: await challanService.get(request.params.id as string) });
});

export const createChallan = asyncHandler(async (request, response) => {
  const challan = await challanService.create(request.body, request.user!.id);
  response.status(201).json({ data: challan, message: 'Challan created successfully' });
});

export const updateChallan = asyncHandler(async (request, response) => {
  const challan = await challanService.update(request.params.id as string, request.body);
  response.json({ data: challan, message: 'Draft challan updated successfully' });
});

export const confirmChallan = asyncHandler(async (request, response) => {
  const challan = await challanService.confirm(request.params.id as string, request.user!.id);
  response.json({ data: challan, message: 'Challan confirmed and stock deducted' });
});

export const cancelChallan = asyncHandler(async (request, response) => {
  const challan = await challanService.cancel(
    request.params.id as string,
    request.body.reason,
    request.user!.id,
  );
  response.json({ data: challan, message: 'Challan cancelled successfully' });
});

