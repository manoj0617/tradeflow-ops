import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { prisma } from '../../common/prisma.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', asyncHandler(async (_request, response) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [activeCustomers, upcomingFollowUps, draftChallans, lowStockRows, recentMovements] = await Promise.all([
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { followUpDate: { gte: now, lte: nextWeek }, status: { not: 'INACTIVE' } } }),
    prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Product"
      WHERE "isActive" = true AND "currentStock" <= "minimumStock"
    `,
    prisma.stockMovement.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
    }),
  ]);
  response.json({
    data: {
      activeCustomers,
      upcomingFollowUps,
      lowStockProducts: Number(lowStockRows[0]?.count ?? 0),
      draftChallans,
      recentMovements,
    },
  });
}));

