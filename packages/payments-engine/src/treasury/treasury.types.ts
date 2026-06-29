/**
 * packages/payments-engine/src/treasury/treasury.types.ts
 *
 * Shared DTOs, domain types, and error classes for the treasury module.
 * Used by both the NestJS service layer (apps/api) and the payments-engine
 * package so internal callers don't need to import from NestJS.
 */

import type { Decimal } from '@prisma/client/runtime/library';

// ─── LedgerEntryType ─────────────────────────────────────────────────────────

export enum LedgerEntryType {
  /** Funds added to available balance (deposit or on-chain credit confirmed). */
  MINT = 'MINT',
  /** Funds removed from available balance (withdrawal or burn executed). */
  BURN = 'BURN',
  /** Available → Reserved: ear-marks funds for a pending operation. */
  RESERVE = 'RESERVE',
  /** Reserved → Available: releases an ear-mark (op cancelled / failed). */
  RELEASE = 'RELEASE',
  /** Reserved → Removed: completes a reservation (op settled successfully). */
  SETTLE = 'SETTLE',
}

// ─── Asset identity ───────────────────────────────────────────────────────────

export interface AssetIdentifier {
  /** Stellar asset code, e.g. 'USDC', 'XLM'. */
  assetCode: string;
  /** Issuer public key, or 'native' for XLM. @default 'native' */
  assetIssuer?: string;
}

// ─── Balance snapshot ─────────────────────────────────────────────────────────

export interface BalanceSnapshot {
  id: string;
  assetCode: string;
  assetIssuer: string;
  /** Liquid funds available for immediate use. */
  availableBalance: Decimal;
  /** Ear-marked funds for pending operations. */
  reservedBalance: Decimal;
  /** Derived: available + reserved. */
  totalBalance: Decimal;
  updatedAt: Date;
}

// ─── Operation inputs ─────────────────────────────────────────────────────────

export interface MintInput {
  asset: AssetIdentifier;
  /** Positive amount to credit to available balance. */
  amount: Decimal | string | number;
  /** ID of the originating payment / deposit record. */
  referenceId?: string;
  referenceType?: string;
  note?: string;
}

export interface BurnInput {
  asset: AssetIdentifier;
  /** Positive amount to debit from available balance. */
  amount: Decimal | string | number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
}

export interface ReserveInput {
  asset: AssetIdentifier;
  /** Amount to move from available → reserved. */
  amount: Decimal | string | number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
}

export interface ReleaseInput {
  asset: AssetIdentifier;
  /** Amount to move from reserved → available. */
  amount: Decimal | string | number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
}

export interface SettleInput {
  asset: AssetIdentifier;
  /** Amount to remove from reserved (settlement complete). */
  amount: Decimal | string | number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
}

// ─── Ledger query ─────────────────────────────────────────────────────────────

export interface LedgerQueryInput {
  asset: AssetIdentifier;
  entryType?: LedgerEntryType;
  fromDate?: Date;
  toDate?: Date;
  referenceId?: string;
  /** @default 50 */
  limit?: number;
  /** @default 0 */
  offset?: number;
}

export interface LedgerEntryView {
  id: string;
  balanceId: string;
  entryType: LedgerEntryType;
  amount: Decimal;
  availableAfter: Decimal;
  reservedAfter: Decimal;
  referenceId?: string | null;
  referenceType?: string | null;
  note?: string | null;
  createdAt: Date;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/** Base class for all treasury domain errors. */
export class TreasuryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'TreasuryError';
  }
}

/** Thrown when a debit would push a balance below zero. */
export class InsufficientBalanceError extends TreasuryError {
  constructor(
    public readonly required: Decimal,
    public readonly available: Decimal,
    public readonly assetCode: string,
  ) {
    super(
      `Insufficient ${assetCode} balance: required ${required.toFixed(7)}, available ${available.toFixed(7)}`,
      'INSUFFICIENT_BALANCE',
    );
    this.name = 'InsufficientBalanceError';
  }
}

/** Thrown when the requested amount is not a positive finite number. */
export class InvalidAmountError extends TreasuryError {
  constructor(amount: unknown) {
    super(`Amount must be a positive finite number, got: ${String(amount)}`, 'INVALID_AMOUNT');
    this.name = 'InvalidAmountError';
  }
}