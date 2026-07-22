import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  { name: 'Asha Admin', email: 'admin@tradeflow.local', role: UserRole.ADMIN },
  { name: 'Sameer Sales', email: 'sales@tradeflow.local', role: UserRole.SALES },
  { name: 'Wafa Warehouse', email: 'warehouse@tradeflow.local', role: UserRole.WAREHOUSE },
  { name: 'Arun Accounts', email: 'accounts@tradeflow.local', role: UserRole.ACCOUNTS },
];

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD ?? 'TradeFlow@123', 12);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, isActive: true, passwordHash },
      create: { ...user, passwordHash },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@tradeflow.local' } });
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: { name: 'Main Warehouse', location: 'Distribution Centre' },
    create: { code: 'MAIN', name: 'Main Warehouse', location: 'Distribution Centre' },
  });

  const customer = await prisma.customer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Priya Raman',
      mobile: '9876543210',
      email: 'priya@example.com',
      businessName: 'Raman Retail Mart',
      gstNumber: '29ABCDE1234F1Z5',
      type: 'RETAIL',
      address: '12 Market Road, Bengaluru, Karnataka',
      status: 'ACTIVE',
      notes: 'Prefers weekday morning deliveries.',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'TF-RICE-25' },
    update: {},
    create: {
      name: 'Premium Rice 25 kg',
      sku: 'TF-RICE-25',
      category: 'Staples',
      unitPrice: 1450,
      currentStock: 48,
      minimumStock: 12,
      warehouseId: warehouse.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'TF-OIL-05' },
    update: {},
    create: {
      name: 'Sunflower Oil 5 L',
      sku: 'TF-OIL-05',
      category: 'Cooking Oil',
      unitPrice: 710,
      currentStock: 8,
      minimumStock: 10,
      warehouseId: warehouse.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.customerFollowUp.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      customerId: customer.id,
      note: 'Requested updated wholesale price list before the next call.',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  });
}

main()
  .then(() => console.log('TradeFlow Ops seed completed.'))
  .finally(() => prisma.$disconnect());

