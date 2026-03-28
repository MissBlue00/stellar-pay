import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  RedeemDto,
  RedeemResponse,
  RedemptionStatus,
  WithdrawalJob,
} from './interfaces/redemption.interface';

@Injectable()
export class RedemptionService {
  private readonly logger = new Logger(RedemptionService.name);

  private readonly STELLAR_HORIZON_URL =
    process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
  // TODO: pass process.env.SOROBAN_RPC_URL to SorobanRpc.Server once contract is deployed
  private readonly BURN_CONTRACT_ID = process.env.BURN_CONTRACT_ID ?? '';

  /** In-memory withdrawal queue — replace with a real queue (BullMQ, SQS, etc.) */
  private readonly withdrawalQueue: WithdrawalJob[] = [];

  async redeem(merchantId: string, dto: RedeemDto): Promise<RedeemResponse> {
    const { asset_code, amount, merchant_wallet, destination_address } = dto;

    // -------------------------------------------------------------------------
    // Step 1: Validate merchant balance
    // -------------------------------------------------------------------------
    const balance = await this.getMerchantBalance(merchant_wallet, asset_code);
    const requested = parseFloat(amount);

    if (isNaN(requested) || requested <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    if (balance < requested) {
      throw new BadRequestException(
        `Insufficient balance: wallet holds ${balance} ${asset_code}, requested ${requested}`,
      );
    }

    this.logger.log(
      `[Redeem] Balance OK — merchant=${merchantId} wallet=${merchant_wallet} ` +
        `balance=${balance} ${asset_code} requested=${requested}`,
    );

    // -------------------------------------------------------------------------
    // Step 2: Invoke Soroban burn function
    // -------------------------------------------------------------------------
    const burnTxHash = await this.invokeBurn(merchant_wallet, asset_code, amount);

    this.logger.log(
      `[Redeem] Burn submitted — merchant=${merchantId} asset=${asset_code} ` +
        `amount=${amount} burn_tx=${burnTxHash}`,
    );

    // -------------------------------------------------------------------------
    // Step 3: Trigger underlying asset withdrawal (handled by withdrawal worker)
    // -------------------------------------------------------------------------
    const withdrawalId = await this.enqueueWithdrawal({
      merchantId,
      assetCode: asset_code,
      amount,
      destinationAddress: destination_address,
      burnTransactionHash: burnTxHash,
    });

    this.logger.log(
      `[Redeem] Withdrawal queued — withdrawal_id=${withdrawalId} destination=${destination_address}`,
    );

    return {
      redemption_id: crypto.randomUUID(),
      merchant_id: merchantId,
      asset_code,
      amount,
      status: RedemptionStatus.WITHDRAWAL_QUEUED,
      burn_transaction_hash: burnTxHash,
      withdrawal_id: withdrawalId,
      created_at: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Step 1 helper: query Horizon for the mirror-asset balance
  // ---------------------------------------------------------------------------
  private async getMerchantBalance(
    merchantWallet: string,
    assetCode: string,
  ): Promise<number> {
    const url = `${this.STELLAR_HORIZON_URL}/accounts/${merchantWallet}`;
    const res = await fetch(url);

    if (res.status === 404) {
      throw new BadRequestException(
        `Stellar account ${merchantWallet} not found on network`,
      );
    }
    if (!res.ok) {
      throw new UnprocessableEntityException(
        `Horizon returned HTTP ${res.status} for account ${merchantWallet}`,
      );
    }

    const account = (await res.json()) as {
      balances: Array<{
        asset_type: string;
        asset_code?: string;
        balance: string;
      }>;
    };

    const entry = account.balances.find(
      (b) => b.asset_code?.toUpperCase() === assetCode.toUpperCase(),
    );

    return entry ? parseFloat(entry.balance) : 0;
  }

  // ---------------------------------------------------------------------------
  // Step 2 helper: call the Soroban burn function
  // ---------------------------------------------------------------------------
  private async invokeBurn(
    _merchantWallet: string,
    _assetCode: string,
    _amount: string,
  ): Promise<string> {
    if (!this.BURN_CONTRACT_ID) {
      // Contract not yet deployed — return a placeholder hash in dev/test
      this.logger.warn(
        '[Redeem] BURN_CONTRACT_ID not configured; skipping real burn (dev mode)',
      );
      return `simulated_burn_${crypto.randomUUID()}`;
    }

    // TODO: Replace with @stellar/stellar-sdk SorobanRpc client once contract is deployed.
    //
    // Example using stellar-sdk (v14+):
    //   const server = new SorobanRpc.Server(this.SOROBAN_RPC_URL);
    //   const contract = new Contract(this.BURN_CONTRACT_ID);
    //   const account = await server.getAccount(merchantWallet);
    //   const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    //     .addOperation(
    //       contract.call('burn', ...[
    //         Address.fromString(merchantWallet).toScVal(),
    //         nativeToScVal(BigInt(Math.round(parseFloat(amount) * 1e7)), { type: 'i128' }),
    //       ]),
    //     )
    //     .setTimeout(30)
    //     .build();
    //   const prepared = await server.prepareTransaction(tx);
    //   prepared.sign(merchantKeypair);
    //   const result = await server.sendTransaction(prepared);
    //   return result.hash;

    throw new UnprocessableEntityException(
      'Soroban burn contract is configured but invocation is not yet implemented',
    );
  }

  // ---------------------------------------------------------------------------
  // Step 3 helper: push a job onto the withdrawal queue
  // ---------------------------------------------------------------------------
  private async enqueueWithdrawal(params: {
    merchantId: string;
    assetCode: string;
    amount: string;
    destinationAddress: string;
    burnTransactionHash: string;
  }): Promise<string> {
    const job: WithdrawalJob = {
      withdrawal_id: crypto.randomUUID(),
      merchant_id: params.merchantId,
      asset_code: params.assetCode,
      amount: params.amount,
      destination_address: params.destinationAddress,
      burn_transaction_hash: params.burnTransactionHash,
      queued_at: new Date().toISOString(),
    };

    this.withdrawalQueue.push(job);

    // TODO: Replace in-memory queue with a durable message broker:
    //   - BullMQ (Redis-backed): await this.withdrawalQueue.add('process', job);
    //   - AWS SQS:               await this.sqsClient.send(new SendMessageCommand({ ... }));
    //   - RabbitMQ / Kafka:      await this.channel.publish(exchange, routingKey, job);

    return job.withdrawal_id;
  }

  /** Expose the queue for inspection / testing — will be removed once a real broker is wired in. */
  getPendingWithdrawals(): WithdrawalJob[] {
    return [...this.withdrawalQueue];
  }
}
