/**
 * Treasury Balance Invariants & Threat Model
 *
 * This file documents the invariants, threat model, and non-goals for the
 * internal treasury balance tracking system. It serves as the foundation
 * for both the implementation and the security notes in the PR.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DOUBLE-SPENDING SCENARIO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Without atomic balance updates, double-spending occurs when two concurrent
 * burn operations both read the same available_balance value before either
 * writes back the decremented result:
 *
 *   Thread A reads available_balance = 100
 *   Thread B reads available_balance = 100
 *   Thread A burns 80, writes available_balance = 20   ✓
 *   Thread B burns 80, writes available_balance = 20   ✗ (should have failed)
 *
 * Combined burns of 160 exceed the original 100, but neither operation saw
 * the other's write. This is a classic TOCTOU (Time-of-check-to-time-of-use)
 * race condition.
 *
 * Mitigation: All balance mutations acquire an async mutex, serialising
 * operations so each sees the result of the previous one.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * OVER-MINTING SCENARIO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Without atomicity, over-minting occurs when concurrent mint operations
 * both check the supply cap against a stale total_minted value:
 *
 *   Cap = 1000, total_minted = 950
 *   Thread A checks: 950 + 100 = 1050 > 1000 → should reject
 *   Thread B checks: 950 + 30  = 980  ≤ 1000 → allowed
 *   Thread A (without check): mints 100, total_minted = 1050  ✗
 *
 * If mint operations interleave without serialisation, the cap check in
 * one operation may see a stale total_minted, allowing combined mints to
 * exceed the intended supply cap.
 *
 * Mitigation: Cap validation and total_minted increment occur within the
 * same mutex-protected critical section.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INVARIANTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. available_balance + reserved_balance == total tracked treasury balance
 *    at every point in time — no operation may leave these two fields in an
 *    inconsistent intermediate state.
 *
 * 2. available_balance >= 0 — always.
 *
 * 3. reserved_balance >= 0 — always.
 *
 * 4. A mint operation that fails at any point must leave TreasuryBalance
 *    exactly as it was before the operation began — no partial updates.
 *
 * 5. A burn operation that fails at any point must leave TreasuryBalance
 *    exactly as it was before the operation began — no partial updates.
 *
 * 6. Concurrent mint and burn operations must serialise correctly — the
 *    final state must be equivalent to some sequential ordering of the
 *    operations.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NON-GOALS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This implementation does NOT cover:
 *
 * - Cross-chain reconciliation: No validation against on-chain Stellar
 *   balances or Horizon API state. This is an internal ledger only.
 *
 * - Frontend display: No REST/API endpoints are added for displaying
 *   balance data to end-users. The existing proof-of-reserves endpoint
 *   is unchanged.
 *
 * - External audit reporting: No export or reporting functionality for
 *   external auditors. The internal ledger is a building block for
 *   future audit features.
 *
 * - Persistence beyond process lifetime: Uses in-memory storage
 *   consistent with the current codebase. When a database (PostgreSQL)
 *   is integrated, the store implementation can be swapped behind the
 *   same interface.
 *
 * - Multi-node consistency: The async mutex provides single-process
 *   serialisation only. Distributed locking (e.g., via Redis) is out
 *   of scope until the infrastructure layer is implemented.
 */

import type { TreasuryBalance } from './interfaces/treasury-balance.interface';

/**
 * Validates that all TreasuryBalance invariants hold for the given record.
 * Throws an Error if any invariant is violated.
 *
 * @param balance - The TreasuryBalance record to validate
 * @param expectedTotal - Optional: the expected total (available + reserved)
 *                        to verify against. If omitted, only non-negativity
 *                        is checked.
 */
export function assertTreasuryInvariants(balance: TreasuryBalance, expectedTotal?: bigint): void {
  if (balance.available_balance < 0n) {
    throw new Error(
      `Invariant violation: available_balance is negative (${balance.available_balance})`,
    );
  }

  if (balance.reserved_balance < 0n) {
    throw new Error(
      `Invariant violation: reserved_balance is negative (${balance.reserved_balance})`,
    );
  }

  if (expectedTotal !== undefined) {
    const actualTotal = balance.available_balance + balance.reserved_balance;
    if (actualTotal !== expectedTotal) {
      throw new Error(
        `Invariant violation: available (${balance.available_balance}) + reserved (${balance.reserved_balance}) = ${actualTotal}, expected ${expectedTotal}`,
      );
    }
  }
}
