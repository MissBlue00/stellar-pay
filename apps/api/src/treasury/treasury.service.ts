import { Injectable, BadRequestException } from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';
import { AssetReserve, RedeemResponse } from './interfaces/proof-of-reserves.interface';
import { RedemptionRepository } from '../modules/database/redemption.repository';
import { RedeemDto } from './dto/redeem.dto';

interface MerchantBalance {
  merchantId: string;
  asset: string;
  balance: number;
}

interface HorizonAssetRecord {
  amount?: string;
}

interface HorizonBalanceRecord {
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface SorobanBurnResult {
  hash?: string;
  transactionHash?: string;
  id?: string;
}

interface SorobanClient {
  contractCall(
    contractId: string,
    functionName: string,
    args: unknown[],
  ): Promise<SorobanBurnResult>;
}

interface SorobanClientConstructor {
  new (url: string): SorobanClient;
}

@Injectable()
export class TreasuryService {
  // In-memory merchant balances for validation (stub)
  private readonly merchantBalances: MerchantBalance[] = [];

  private readonly horizonUrl =
    process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

  private readonly issuerPublicKey = process.env.ISSUER_PUBLIC_KEY;

  private get horizonServer(): StellarSdk.Horizon.Server {
    return new StellarSdk.Horizon.Server(this.horizonUrl);
  }

  constructor(private readonly redemptionRepo: RedemptionRepository) {}

  private getAssetIssuer(): string {
    if (!this.issuerPublicKey) {
      throw new BadRequestException('Missing ISSUER_PUBLIC_KEY environment variable');
    }
    return this.issuerPublicKey;
  }

  async getTotalSupply(assetCode: string): Promise<string> {
    const issuer = this.getAssetIssuer();
    const response = await this.horizonServer.assets().forCode(assetCode).forIssuer(issuer).call();

    const assetRecord = response.records?.[0] as HorizonAssetRecord | undefined;
    return assetRecord?.amount ?? '0';
  }

  async getTreasuryBalance(assetCode: string, treasuryAddress: string): Promise<string> {
    const issuer = this.getAssetIssuer();
    const account = await this.horizonServer.loadAccount(treasuryAddress);
    const balance = account.balances.find(
      (b): b is HorizonBalanceRecord => b.asset_code === assetCode && b.asset_issuer === issuer,
    );
    return balance?.balance ?? '0';
  }

  /**
   * BURN: Debits `amount` from `available_balance`.
   *
   * Use when:
   *   - An on-chain withdrawal is confirmed (funds left the treasury account).
   *   - A redemption is settled off-chain.
   *
   * Call RESERVE before submitting to Stellar, then SETTLE/RELEASE on result.
   * BURN is for situations where no reservation was made (direct debit).
   *
   * @throws InsufficientBalanceError if available < amount.
   * @throws InvalidAmountError if amount ≤ 0 or non-finite.
   */
  async burn(input: BurnInput): Promise<BalanceSnapshot> {
    const amount = this.validateAmount(input.amount);
    const issuer = input.asset.assetIssuer ?? 'native';

    this.logger.log(
      `BURN ${amount.toFixed(7)} ${input.asset.assetCode} ref=${input.referenceId ?? 'none'}`,
    );

    return this.runAtomicUpdate(
      { assetCode: input.asset.assetCode, assetIssuer: issuer },
      (current) => {
        if (current.availableBalance.lessThan(amount)) {
          throw new InsufficientBalanceError(
            amount,
            current.availableBalance,
            input.asset.assetCode,
          );
        }
        return {
          availableBalance: current.availableBalance.sub(amount),
          reservedBalance: current.reservedBalance,
        };
      },
      LedgerEntryType.BURN,
      amount.negated(),
      input,
    );
  }

  /**
   * RESERVE: Moves `amount` from `available_balance` → `reserved_balance`.
   *
   * Call this BEFORE submitting a withdrawal or burn to Stellar so the
   * funds are ear-marked and unavailable to concurrent operations.
   *
   * @throws InsufficientBalanceError if available < amount.
   */
  async reserve(input: ReserveInput): Promise<BalanceSnapshot> {
    const amount = this.validateAmount(input.amount);
    const issuer = input.asset.assetIssuer ?? 'native';

    this.logger.log(
      `RESERVE ${amount.toFixed(7)} ${input.asset.assetCode} ref=${input.referenceId ?? 'none'}`,
    );

    return this.runAtomicUpdate(
      { assetCode: input.asset.assetCode, assetIssuer: issuer },
      (current) => {
        if (current.availableBalance.lessThan(amount)) {
          throw new InsufficientBalanceError(
            amount,
            current.availableBalance,
            input.asset.assetCode,
          );
        }
        return {
          availableBalance: current.availableBalance.sub(amount),
          reservedBalance: current.reservedBalance.add(amount),
        };
      },
      LedgerEntryType.RESERVE,
      amount.negated(), // available decreases
      input,
    );
  }

  /**
   * RELEASE: Returns `amount` from `reserved_balance` → `available_balance`.
   *
   * Call this when a pending operation is cancelled or fails, so the
   * ear-marked funds become liquid again.
   *
   * @throws InsufficientBalanceError if reserved < amount.
   */
  async release(input: ReleaseInput): Promise<BalanceSnapshot> {
    const amount = this.validateAmount(input.amount);
    const issuer = input.asset.assetIssuer ?? 'native';

    this.logger.log(
      `RELEASE ${amount.toFixed(7)} ${input.asset.assetCode} ref=${input.referenceId ?? 'none'}`,
    );

    return this.runAtomicUpdate(
      { assetCode: input.asset.assetCode, assetIssuer: issuer },
      (current) => {
        if (current.reservedBalance.lessThan(amount)) {
          throw new InsufficientBalanceError(
            amount,
            current.reservedBalance,
            input.asset.assetCode,
          );
        }
        return {
          availableBalance: current.availableBalance.add(amount),
          reservedBalance: current.reservedBalance.sub(amount),
        };
      },
      LedgerEntryType.RELEASE,
      amount, // available increases
      input,
    );
  }

  /**
   * SETTLE: Removes `amount` from `reserved_balance` (operation completed).
   *
   * Call this after a withdrawal transaction is confirmed on Stellar.
   * The reserved funds are consumed — they do not return to available.
   *
   * @throws InsufficientBalanceError if reserved < amount.
   */
  async settle(input: SettleInput): Promise<BalanceSnapshot> {
    const amount = this.validateAmount(input.amount);
    const issuer = input.asset.assetIssuer ?? 'native';

    this.logger.log(
      `SETTLE ${amount.toFixed(7)} ${input.asset.assetCode} ref=${input.referenceId ?? 'none'}`,
    );

    return this.runAtomicUpdate(
      { assetCode: input.asset.assetCode, assetIssuer: issuer },
      (current) => {
        if (current.reservedBalance.lessThan(amount)) {
          throw new InsufficientBalanceError(
            amount,
            current.reservedBalance,
            input.asset.assetCode,
          );
        }
        return {
          availableBalance: current.availableBalance,
          reservedBalance: current.reservedBalance.sub(amount),
        };
      },
      LedgerEntryType.SETTLE,
      amount.negated(), // reserved decreases
      input,
    );
  }

  // ─── Core atomic update ────────────────────────────────────────────────────

  /**
   * Executes a balance mutation atomically:
   *   1. Opens a Prisma interactive transaction with REPEATABLE READ.
   *   2. Upserts the TreasuryBalance row (creating it at zero if absent).
   *   3. Applies `computeNext` to derive the new column values.
   *   4. Updates the balance row.
   *   5. Inserts a TreasuryLedgerEntry with the post-op snapshot.
   *   6. Returns the new snapshot.
   *
   * The `FOR UPDATE` advisory is provided by Prisma's interactive transaction
   * combined with PostgreSQL's REPEATABLE READ: a second concurrent transaction
   * touching the same row will block until the first commits.
   */
  private async runAtomicUpdate(
    asset: Required<AssetIdentifier>,
    computeNext: (current: {
      availableBalance: Decimal;
      reservedBalance: Decimal;
    }) => { availableBalance: Decimal; reservedBalance: Decimal },
    entryType: LedgerEntryType,
    signedAmount: Decimal,
    meta: { referenceId?: string; referenceType?: string; note?: string },
  ): Promise<BalanceSnapshot> {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Upsert balance row — creates a zero-balance entry if this is the
        // first operation for this asset.
        const current = await tx.treasuryBalance.upsert({
          where: {
            assetCode_assetIssuer: {
              assetCode: asset.assetCode,
              assetIssuer: asset.assetIssuer,
            },
          },
          create: {
            assetCode: asset.assetCode,
            assetIssuer: asset.assetIssuer,
            availableBalance: new Decimal(0),
            reservedBalance: new Decimal(0),
          },
          update: {}, // no-op — we need the current row to compute the delta
        });

        // Compute next balances (may throw InsufficientBalanceError)
        const next = computeNext({
          availableBalance: current.availableBalance,
          reservedBalance: current.reservedBalance,
        });

        // Apply the update
        const updated = await tx.treasuryBalance.update({
          where: { id: current.id },
          data: {
            availableBalance: next.availableBalance,
            reservedBalance: next.reservedBalance,
            updatedAt: new Date(),
          },
        });

        // Write the immutable ledger entry
        await tx.treasuryLedgerEntry.create({
          data: {
            balanceId: updated.id,
            entryType,
            amount: signedAmount,
            availableAfter: updated.availableBalance,
            reservedAfter: updated.reservedBalance,
            referenceId: meta.referenceId ?? null,
            referenceType: meta.referenceType ?? null,
            note: meta.note ?? null,
          },
        });

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 5_000,  // ms to wait for a connection
        timeout: 10_000, // ms before the transaction times out
      },
    );

    return this.toSnapshot(result);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private toSnapshot(row: {
    id: string;
    assetCode: string;
    assetIssuer: string;
    availableBalance: Decimal;
    reservedBalance: Decimal;
    updatedAt: Date;
  }): BalanceSnapshot {
    return {
      id: row.id,
      assetCode: row.assetCode,
      assetIssuer: row.assetIssuer,
      availableBalance: row.availableBalance,
      reservedBalance: row.reservedBalance,
      totalBalance: row.availableBalance.add(row.reservedBalance),
      updatedAt: row.updatedAt,
    };
  }

  async redeem(dto: RedeemDto, merchantId: string): Promise<RedeemResponse> {
    // 1. Validate merchant has sufficient balance
    const balance = this.merchantBalances.find(
      (b) => b.merchantId === merchantId && b.asset === dto.currency,
    );

    if (!balance || balance.balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient ${dto.currency} balance. Available: ${balance?.balance ?? 0}, Requested: ${dto.amount}`,
      );
    }

    const sorobanRpcUrl = process.env.SOROBAN_RPC_URL;
    const contractId = process.env.MIRROR_ASSET_CONTRACT_ID;
    if (!sorobanRpcUrl || !contractId) {
      throw new BadRequestException(
        'SOROBAN_RPC_URL and MIRROR_ASSET_CONTRACT_ID must be configured for redemption',
      );
    }

    // 2. Invoke Soroban burn function
    const SorobanClient = (StellarSdk as unknown as { SorobanClient: SorobanClientConstructor })
      .SorobanClient;
    const sorobanClient = new SorobanClient(sorobanRpcUrl);
    const burnTx = await sorobanClient.contractCall(contractId, 'burn', [
      merchantId,
      dto.amount.toString(),
      dto.currency,
    ]);

    const burnTxHash =
      burnTx.hash ||
      burnTx.transactionHash ||
      burnTx.id ||
      `burn_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;

    // 3. Deduct balance after successful burn
    balance.balance -= dto.amount;

    // 4. Create redemption record for withdrawal worker
    const redemptionId = `rdm_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;
    await this.redemptionRepo.create({
      id: redemptionId,
      status: 'PENDING',
      destinationAddress: dto.destination,
      amount: dto.amount.toString(),
    });

    return {
      redemption_id: redemptionId,
      amount: dto.amount,
      currency: dto.currency,
      destination: dto.destination,
      status: 'pending',
      burn_tx_hash: burnTxHash,
      created_at: new Date().toISOString(),
    };
  }
}
