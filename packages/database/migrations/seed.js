let prisma;

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();

  const merchant1 = await prisma.merchant.upsert({
    where: { email: 'merchant-one@stellar-pay.local' },
    update: {},
    create: {
      email: 'merchant-one@stellar-pay.local',
      passwordHash: '$2b$10$placeholder_hash_for_dev_merchant_one',
      kycStatus: 'APPROVED',
      paymentIntents: {
        create: [
          {
            amount: 2500,
            currency: 'USD',
            status: 'CONFIRMED',
          },
          {
            amount: 5000,
            currency: 'USD',
            status: 'PENDING',
          },
        ],
      },
      webhookEndpoints: {
        create: [
          {
            url: 'https://example.com/webhooks/payments',
            secret: 'whsec_dev_secret_one',
          },
        ],
      },
    },
  });

  const merchant2 = await prisma.merchant.upsert({
    where: { email: 'merchant-two@stellar-pay.local' },
    update: {},
    create: {
      email: 'merchant-two@stellar-pay.local',
      passwordHash: '$2b$10$placeholder_hash_for_dev_merchant_two',
      kycStatus: 'PENDING',
      paymentIntents: {
        create: [
          {
            amount: 1200,
            currency: 'EUR',
            status: 'DETECTED',
          },
          {
            amount: 999,
            currency: 'USD',
            status: 'FAILED',
          },
        ],
      },
      webhookEndpoints: {
        create: [
          {
            url: 'https://example.com/webhooks/merchant-two',
            secret: 'whsec_dev_secret_two',
          },
        ],
      },
    },
  });

  const assets = [
    { symbol: 'USDC', totalMinted: 1000000, totalReserved: 250000 },
    { symbol: 'XLM', totalMinted: 50000000, totalReserved: 5000000 },
  ];

  for (const asset of assets) {
    await prisma.treasuryAsset.upsert({
      where: { symbol: asset.symbol },
      update: {},
      create: {
        symbol: asset.symbol,
        totalMinted: asset.totalMinted,
        totalReserved: asset.totalReserved,
      },
    });
  }

  console.log('Seeded merchants:', merchant1.email, merchant2.email);
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
