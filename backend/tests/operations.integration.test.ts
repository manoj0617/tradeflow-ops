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
    let productId = '';
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
          name: 'Integration Product',
          sku: `INT-${unique}`,
          category: 'Test',
          unitPrice: 100,
          minimumStock: 2,
          openingStock: 10,
          warehouseId,
        })
        .expect(201);
      productId = product.body.data.id;

      const challan = await request(app)
        .post('/api/challans')
        .set(authorization)
        .send({
          customerId,
          status: 'CONFIRMED',
          items: [{ productId, quantity: 3 }],
        })
        .expect(201);
      challanId = challan.body.data.id;
      expect(challan.body.data.status).toBe('CONFIRMED');
      expect(challan.body.data.items[0].snapshotSku).toBe(`INT-${unique}`);

      const storedProduct = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
      expect(storedProduct.currentStock).toBe(7);
      const movement = await prisma.stockMovement.findFirstOrThrow({
        where: { challanId, productId, type: 'OUT' },
      });
      expect(movement.quantity).toBe(3);
      expect(movement.balanceAfter).toBe(7);
    } finally {
      if (challanId) {
        await prisma.stockMovement.deleteMany({ where: { challanId } });
        await prisma.salesChallanItem.deleteMany({ where: { challanId } });
        await prisma.salesChallan.deleteMany({ where: { id: challanId } });
      }
      if (productId) {
        await prisma.stockMovement.deleteMany({ where: { productId } });
        await prisma.product.deleteMany({ where: { id: productId } });
      }
      if (customerId) await prisma.customer.deleteMany({ where: { id: customerId } });
      await prisma.$disconnect();
    }
  }, 30_000);
});

