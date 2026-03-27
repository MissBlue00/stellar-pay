/**
 * Treasury Balance Error Types
 *
 * All custom error types for treasury balance operations.
 * Each error carries a unique string code and extends the base TreasuryError
 * for consistent error handling and propagation.
 */

/**
 * Base error class for all treasury balance operations.
 * Provides a consistent interface with error code, message, and HTTP status.
 */
export class TreasuryError extends Error {
  /** Unique string error code for programmatic handling */
  public readonly code: string;
  /** HTTP status code to surface in API responses */
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Raised when a burn or reserve operation would drive available_balance below zero.
 *
 * @example
 * ```
 * throw new InsufficientAvailableBalanceError(100n, 50n);
 * // "Insufficient available balance: requested 100, available 50"
 * ```
 */
export class InsufficientAvailableBalanceError extends TreasuryError {
  constructor(
    public readonly requested: bigint,
    public readonly available: bigint,
  ) {
    super(
      'TREASURY_ERR_INSUFFICIENT_AVAILABLE',
      `Insufficient available balance: requested ${requested}, available ${available}`,
      409,
    );
  }
}

/**
 * Raised when a release or settle operation would drive reserved_balance below zero.
 *
 * @example
 * ```
 * throw new InsufficientReservedBalanceError(100n, 50n);
 * // "Insufficient reserved balance: requested 100, reserved 50"
 * ```
 */
export class InsufficientReservedBalanceError extends TreasuryError {
  constructor(
    public readonly requested: bigint,
    public readonly reserved: bigint,
  ) {
    super(
      'TREASURY_ERR_INSUFFICIENT_RESERVED',
      `Insufficient reserved balance: requested ${requested}, reserved ${reserved}`,
      409,
    );
  }
}

/**
 * Raised when a mint operation would exceed the defined supply cap.
 * Omit usage if no supply cap is configured — included for forward compatibility.
 */
export class MintLimitExceededError extends TreasuryError {
  constructor(
    public readonly requested: bigint,
    public readonly totalMinted: bigint,
    public readonly mintCap: bigint,
  ) {
    super(
      'TREASURY_ERR_MINT_LIMIT_EXCEEDED',
      `Mint limit exceeded: minting ${requested} would bring total minted to ${totalMinted + requested}, cap is ${mintCap}`,
      409,
    );
  }
}

/**
 * Raised when querying a TreasuryBalance record that does not exist
 * for the given asset_code and asset_issuer combination.
 */
export class BalanceNotFoundError extends TreasuryError {
  constructor(
    public readonly assetCode: string,
    public readonly assetIssuer: string,
  ) {
    super(
      'TREASURY_ERR_BALANCE_NOT_FOUND',
      `Treasury balance not found for asset ${assetCode} issued by ${assetIssuer}`,
      404,
    );
  }
}

/**
 * Raised when the atomic operation fails to commit for infrastructure reasons
 * distinct from business logic violations (e.g., mutex acquisition timeout,
 * internal store corruption).
 */
export class AtomicUpdateFailedError extends TreasuryError {
  constructor(message: string) {
    super('TREASURY_ERR_ATOMIC_UPDATE_FAILED', `Atomic update failed: ${message}`, 500);
  }
}
