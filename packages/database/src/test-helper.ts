import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const TABLES = [
  'audit_logs',
  'webhook_events',
  'webhook_endpoints',
  'api_keys',
  'payment_intents',
  'treasury_assets',
  'merchants',
] as const;

export interface TestDb {
  prisma: PrismaClient;
  url: string;
}

export async function setupTestDb(url?: string): Promise<TestDb> {
  const databaseUrl =
    url || process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/stellar_pay_test';

  const schemaPath = path.resolve(__dirname, '..', 'migrations', 'schema.prisma');

  execSync(
    `DATABASE_URL="${databaseUrl}" pnpm exec prisma migrate deploy --schema "${schemaPath}"`,
    {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    },
  );

  execSync(`DATABASE_URL="${databaseUrl}" pnpm exec prisma generate --schema "${schemaPath}"`, {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();

  return { prisma, url: databaseUrl };
}

export async function cleanTestDb(prisma: PrismaClient): Promise<void> {
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
}

export interface SeedData {
  merchantId: string;
  paymentIntentId: string;
  apiKeyId: string;
  webhookEndpointId: string;
}

export async function seedTestData(prisma: PrismaClient): Promise<SeedData> {
  const merchant = await prisma.merchant.create({
    data: {
      email: 'test-merchant@stellar-pay.test',
      passwordHash: '$2b$10$testhashedpassword',
      kycStatus: 'APPROVED',
    },
  });

  const paymentIntent = await prisma.paymentIntent.create({
    data: {
      merchantId: merchant.id,
      amount: 2500,
      currency: 'USD',
      status: 'PENDING',
    },
  });

  await prisma.treasuryAsset.create({
    data: {
      symbol: 'USDC',
      totalMinted: 1000000,
      totalReserved: 50000,
    },
  });

  await prisma.treasuryAsset.create({
    data: {
      symbol: 'XLM',
      totalMinted: 5000000,
      totalReserved: 100000,
    },
  });

  const webhookEndpoint = await prisma.webhookEndpoint.create({
    data: {
      merchantId: merchant.id,
      url: 'https://example.test/webhook',
      secret: 'whsec_test_secret_key',
    },
  });

  await prisma.webhookEvent.create({
    data: {
      webhookEndpointId: webhookEndpoint.id,
      merchantId: merchant.id,
      type: 'payment_intent.succeeded',
      payload: { id: paymentIntent.id, status: 'CONFIRMED' },
    },
  });

  const apiKey = await prisma.apiKey.create({
    data: {
      merchantId: merchant.id,
      keyHash: 'test_key_hash',
      prefix: 'sp_test_',
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      merchantId: merchant.id,
      eventType: 'seed.completed',
      metadata: { seededAt: new Date().toISOString() },
      ip: '127.0.0.1',
      entryHash: `test-entry-${Date.now()}`,
    },
  });

  return {
    merchantId: merchant.id,
    paymentIntentId: paymentIntent.id,
    apiKeyId: apiKey.id,
    webhookEndpointId: webhookEndpoint.id,
  };
}
