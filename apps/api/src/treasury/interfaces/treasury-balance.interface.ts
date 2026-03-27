/**
 * TreasuryBalance — Internal ledger record for a single asset's treasury state.
 *
 * All monetary amounts use bigint (representing stroops / smallest unit)
 * to avoid floating-point precision errors when working with Stellar assets.
 * This mirrors the i128 type used in the Soroban contracts.
 *
 * Invariants that must hold at all times:
 * - available_balance >= 0
 * - reserved_balance >= 0
 * - available_balance + reserved_balance == total tracked treasury balance
 * - total_minted is monotonically non-decreasing (never decremented)
 * - total_burned is monotonically non-decreasing (never decremented)
 */
export interface TreasuryBalance {
  /** Unique identifier for this balance record (UUID v4) */
  id: string;

  /** Stellar asset code (e.g., "USDC", "ARS") */
  asset_code: string;

  /** Stellar issuer address (e.g., "GDTREASURYADDRESSXXXXXX") */
  asset_issuer: string;

  /** Portion of balance free for new operations (stroops precision, bigint) */
  available_balance: bigint;

  /** Portion committed to in-flight operations, not available for new commitments */
  reserved_balance: bigint;

  /** Cumulative counter of all mint operations ever processed — never decremented */
  total_minted: bigint;

  /** Cumulative counter of all burn operations ever processed — never decremented */
  total_burned: bigint;

  /** Timestamp of the most recent update to this record */
  last_updated_at: Date;

  /** Creation timestamp */
  created_at: Date;
}

/**
 * Result returned from balance mutation operations (mint, burn, reserve, release, settle).
 * Provides the full post-operation state for logging and verification.
 */
export interface TreasuryBalanceOperationResult {
  /** The operation that was performed */
  operation: 'mint' | 'burn' | 'reserve' | 'release' | 'settle';

  /** Asset code operated on */
  asset_code: string;

  /** Amount involved in the operation */
  amount: bigint;

  /** Available balance after the operation */
  available_balance: bigint;

  /** Reserved balance after the operation */
  reserved_balance: bigint;

  /** Whether the operation succeeded */
  success: boolean;
}
