let prisma;

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  const merchant = await prisma.merchant.upsert({
    where: { email: 'dev-merchant@stellar-pay.local' },
    update: { name: 'Stellar Pay Dev Merchant' },
    create: {
      name: 'Stellar Pay Dev Merchant',
      legalName: 'Stellar Pay Development LLC',
      email: 'dev-merchant@stellar-pay.local',
      users: {
        create: {
          email: 'owner@stellar-pay.local',
          fullName: 'Dev Owner',
          role: 'OWNER',
        },
      },
      treasuryWallets: {
        create: {
          network: 'stellar',
          publicKey: 'GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          encryptedSecret: 'encrypted-dev-secret',
          isPrimary: true,
        },
      },
    },
  });

  const customer = await prisma.customer.upsert({
    where: {
      merchantId_externalRef: {
        merchantId: merchant.id,
        externalRef: 'cust_dev_001',
      },
    },
    update: { email: 'customer@stellar-pay.local' },
    create: {
      merchantId: merchant.id,
      externalRef: 'cust_dev_001',
      email: 'customer@stellar-pay.local',
      name: 'Dev Customer',
      metadata: { source: 'seed' },
    },
  });

  const paymentIntent = await prisma.paymentIntent.create({
    data: {
      merchantId: merchant.id,
      customerId: customer.id,
      amountMinor: 2500,
      currency: 'USD',
      description: 'Seeded payment intent',
      idempotencyKey: `seed-${Date.now()}`,
      status: 'PROCESSING',
    },
  });

  await prisma.escrowTransaction.create({
    data: {
      paymentIntentId: paymentIntent.id,
      network: 'stellar',
      status: 'FUNDED',
    },
  });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
    data: {
      merchantId: merchant.id,
      customerId: customer.id,
      planCode: 'starter-monthly',
      amountMinor: 1999,
      currency: 'USD',
      interval: 'MONTH',
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      externalPaymentIntentId: paymentIntent.id,
      amountMinor: 1999,
      currency: 'USD',
      status: 'PENDING',
      dueAt: periodEnd,
    },
  });

  await prisma.payout.create({
    data: {
      merchantId: merchant.id,
      amountMinor: 1000,
      currency: 'USD',
      destination: 'GAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      status: 'REQUESTED',
    },
  });

  await prisma.webhookEvent.create({
    data: {
      merchantId: merchant.id,
      provider: 'stripe',
      eventType: 'payment_intent.succeeded',
      payload: { demo: true },
      status: 'RECEIVED',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'system',
      action: 'seed.completed',
      entityType: 'Merchant',
      entityId: merchant.id,
      metadata: { seededAt: now.toISOString() },
    },
  });
}

main()
  .then(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    globalThis.console.log('Database seed completed.');
  })
  .catch(async (error) => {
    if (prisma) {
      await prisma.$disconnect();
    }
    globalThis.console.error(error);
    globalThis.process.exit(1);
  });
