ALTER TABLE "payment_intents"
ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TABLE "webhook_endpoints"
ADD COLUMN "deleted_at" TIMESTAMP(3);
