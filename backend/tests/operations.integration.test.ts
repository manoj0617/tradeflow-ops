import { describe, expect, it } from 'vitest';

const integrationEnabled = Boolean(process.env.TEST_DATABASE_URL);

describe.runIf(integrationEnabled)('core operations integration', () => {
  it('creates and confirms a challan while preserving the stock ledger', async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'integration-secret-that-is-longer-than-32-characters';
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    const [{ app }, { prisma }] = await Promise.all([
      import('../src/app.js'),
      import('../src/common/prisma.js'),
    ]);
    const request = (await import('supertest')).default;
    const unique = Date.now();
    let customerId = '';
    const productIds: string[] = [];
    let challanId = '';

    try {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@tradeflow.local', password: process.env.SEED_PASSWORD ?? 'TradeFlow@123' })
        .expect(200);
      const authorization = { Authorization: `Bearer ${login.body.data.token}` };

      const warehouses = await request(app).get('/api/warehouses').set(authorization).expect(200);
      const warehouseId = warehouses.body.data[0].id as string;

      const customer = await request(app)
        .post('/api/customers')
        .set(authorization)
        .send({
          name: 'Integration Buyer',
          mobile: '9876500000',
          email: `buyer-${unique}@example.com`,
          businessName: `Integration Mart ${unique}`,
          gstNumber: '',
          type: 'WHOLESALE',
          address: '1 Integration Test Road, Bengaluru',
          status: 'ACTIVE',
          followUpDate: '',
          notes: 'Created by automated integration test.',
        })
        .expect(201);
      customerId = customer.body.data.id;

      const product = await request(app)
        .post('/api/products')
        .set(authorization)
        .send({
          name: 'Integration Product A',
          sku: `INT-A-${unique}`,
          category: 'Test',
          unitPrice: 100,
          minimumStock: 2,
          openingStock: 10,
          warehouseId,
        })
        .expect(201);
      productIds.push(product.body.data.id);

      const secondProduct = await request(app)
        .post('/api/products')
        .set(authorization)
        .send({
          name: 'Integration Product B',
          sku: `INT-B-${unique}`,
          category: 'Test',
          unitPrice: 150,
          minimumStock: 2,
          openingStock: 8,
          warehouseId,
        })
        .expect(201);
      productIds.push(secondProduct.body.data.id);

      const challan = await request(app)
        .post('/api/challans')
        .set(authorization)
        .send({
          customerId,
          status: 'CONFIRMED',
          items: [
            { productId: productIds[0], quantity: 3 },
            { productId: productIds[1], quantity: 4 },
          ],
        })
        .expect(201);
      challanId = challan.body.data.id;
      expect(challan.body.data.status).toBe('CONFIRMED');
      expect(challan.body.data.items).toHaveLength(2);
      expect(challan.body.data.items.map((item: { snapshotSku: string }) => item.snapshotSku)).toEqual([
        `INT-A-${unique}`,
        `INT-B-${unique}`,
      ]);

      const storedProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        orderBy: { name: 'asc' },
      });
      expect(storedProducts.map((storedProduct) => storedProduct.currentStock)).toEqual([7, 4]);
      const movements = await prisma.stockMovement.findMany({
        where: { challanId, productId: { in: productIds }, type: 'OUT' },
        orderBy: { quantity: 'asc' },
      });
      expect(movements.map((movement) => [movement.quantity, movement.balanceAfter])).toEqual([
        [3, 7],
        [4, 4],
      ]);
    } finally {
      if (challanId) {
        await prisma.stockMovement.deleteMany({ where: { challanId } });
        await prisma.salesChallanItem.deleteMany({ where: { challanId } });
        await prisma.salesChallan.deleteMany({ where: { id: challanId } });
      }
      if (productIds.length) {
        await prisma.stockMovement.deleteMany({ where: { productId: { in: productIds } } });
        await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      }
      if (customerId) await prisma.customer.deleteMany({ where: { id: customerId } });
      await prisma.$disconnect();
    }
  }, 30_000);
});
