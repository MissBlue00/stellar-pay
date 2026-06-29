-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('NEEDS_INFO', 'PROCESSING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "country_code" TEXT,
    "bank_account_number" TEXT,
    "bank_routing_number" TEXT,
    "date_of_birth" TEXT,
    "street_address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postal_code" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'NEEDS_INFO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_merchant_id_status_idx" ON "customers"("merchant_id", "status");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
