CREATE TABLE "ApiKey" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");
CREATE INDEX "ApiKey_merchantId_idx" ON "ApiKey"("merchantId");

ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
