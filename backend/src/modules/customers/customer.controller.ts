import type { CustomerStatus, CustomerType } from '@prisma/client';
import { asyncHandler } from '../../common/asyncHandler.js';
import { customerService } from './customer.service.js';

export const listCustomers = asyncHandler(async (request, response) => {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);
  const result = await customerService.list({
    page,
    limit,
    search: request.query.search as string | undefined,
    status: request.query.status as CustomerStatus | undefined,
    type: request.query.type as CustomerType | undefined,
  });
  response.json({ data: result.data, meta: { total: result.total, page, limit } });
});

export const getCustomer = asyncHandler(async (request, response) => {
  response.json({ data: await customerService.get(request.params.id as string) });
});

export const createCustomer = asyncHandler(async (request, response) => {
  const customer = await customerService.create(request.body, request.user!.id);
  response.status(201).json({ data: customer, message: 'Customer created successfully' });
});

export const updateCustomer = asyncHandler(async (request, response) => {
  const customer = await customerService.update(request.params.id as string, request.body, request.user!.id);
  response.json({ data: customer, message: 'Customer updated successfully' });
});

export const addFollowUp = asyncHandler(async (request, response) => {
  const followUp = await customerService.addFollowUp(
    request.params.id as string,
    request.body.note,
    request.body.followUpDate,
    request.user!.id,
  );
  response.status(201).json({ data: followUp, message: 'Follow-up added successfully' });
});

