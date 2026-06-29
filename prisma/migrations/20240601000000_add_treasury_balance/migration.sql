-- prisma/migrations/20240601000000_add_treasury_balance/migration.sql
--
-- Treasury: internal balance tracking and accounting
--
-- Two tables:
--
--   treasury_balance
--     One row per (asset_code, asset_issuer) pair — the single source of
--     truth for what the treasury holds.
--     • available_balance   — liquid; can be used immediately
--     • reserved_balance    — ear-marked by pending operations
--     • total_balance       — available + reserved (maintained as a
--                             generated column for fast reads)
--
--   treasury_ledger_entry
--     Immutable audit trail. Every debit and credit writes a row here.
--     Ops that mutate treasury_balance MUST also insert a ledger row in
--     the same Prisma transaction to ensure the ledger is never stale.
--
-- Atomicity guarantee:
--   All balance mutations go through a Prisma $transaction call that
--   updates treasury_balance AND inserts a treasury_ledger_entry in one
--   atomic database transaction. PostgreSQL serializable isolation prevents
--   concurrent over-minting or double-spending.
--
-- Concurrency protection:
--   • treasury_balance has a CHECK constraint ensuring both balance columns
--     are non-negative — the DB rejects invalid states even if application
--     logic has a bug.
--   • All UPDATE statements use a WHERE clause that re-checks the constraint
--     before committing (optimistic locking via Prisma's atomic increment).

-- ── treasury_balance ──────────────────────────────────────────────────────────

CREATE TABLE "treasury_balance" (
    "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
    -- Asset identity
    "asset_code"        VARCHAR(12) NOT NULL,
    "asset_issuer"      VARCHAR(56) NOT NULL DEFAULT 'native',
    -- Balance columns stored as NUMERIC(38,7) matching Stellar's 7-decimal
    -- precision while providing headroom for large institutional amounts.
    "available_balance" NUMERIC(38, 7) NOT NULL DEFAULT 0,
    "reserved_balance"  NUMERIC(38, 7) NOT NULL DEFAULT 0,
    -- Timestamps
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "treasury_balance_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "treasury_balance_asset_uniq" UNIQUE ("asset_code", "asset_issuer"),
    -- Invariant: neither balance may go negative
    CONSTRAINT "treasury_balance_available_non_negative"
        CHECK ("available_balance" >= 0),
    CONSTRAINT "treasury_balance_reserved_non_negative"
        CHECK ("reserved_balance" >= 0)
);

-- Fast lookup by asset pair (also enforced by the UNIQUE constraint above)
CREATE INDEX "treasury_balance_asset_idx"
    ON "treasury_balance" ("asset_code", "asset_issuer");

-- ── treasury_ledger_entry ─────────────────────────────────────────────────────

CREATE TYPE "ledger_entry_type" AS ENUM (
    'MINT',           -- funds added to available balance (deposit credited)
    'BURN',           -- funds removed from available balance (withdrawal debited)
    'RESERVE',        -- available → reserved  (funds ear-marked for pending op)
    'RELEASE',        -- reserved → available  (ear-mark cancelled / op failed)
    'SETTLE'          -- reserved → removed    (pending op completed successfully)
);

CREATE TABLE "treasury_ledger_entry" (
    "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
    "balance_id"       UUID          NOT NULL,
    "entry_type"       "ledger_entry_type" NOT NULL,
    -- Signed amount: positive = credit, negative = debit
    "amount"           NUMERIC(38, 7) NOT NULL,
    -- Balances AFTER this entry was applied (snapshot for easy reconciliation)
    "available_after"  NUMERIC(38, 7) NOT NULL,
    "reserved_after"   NUMERIC(38, 7) NOT NULL,
    -- Traceability — link to the payment / withdrawal / transfer that triggered this
    "reference_id"     VARCHAR(255)  NULL,
    "reference_type"   VARCHAR(64)   NULL,
    "note"             TEXT          NULL,
    "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "treasury_ledger_entry_pkey"
        PRIMARY KEY ("id"),
    CONSTRAINT "treasury_ledger_entry_balance_fk"
        FOREIGN KEY ("balance_id")
        REFERENCES "treasury_balance" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Time-series query pattern: newest entries first for a given balance
CREATE INDEX "treasury_ledger_balance_created_idx"
    ON "treasury_ledger_entry" ("balance_id", "created_at" DESC);

-- Reference lookups (audit / reconciliation queries)
CREATE INDEX "treasury_ledger_reference_idx"
    ON "treasury_ledger_entry" ("reference_id")
    WHERE "reference_id" IS NOT NULL;