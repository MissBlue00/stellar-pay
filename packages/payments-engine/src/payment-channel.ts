import * as StellarSdk from 'stellar-sdk';

export type Horizon = StellarSdk.Horizon.Server;

export interface PaymentChannelConfig {
  id: string;
  asset: PaymentChannelAsset;
  distributions: PaymentChannelDistribution[];
  signers: PaymentChannelSigner[];
  networkPassphrase: string;
  fee?: string | number;
  signatureThreshold?: number;
}

export type PaymentChannelStatus = 'open' | 'closing' | 'closed';

export interface PaymentChannelAsset {
  code?: string;
  issuer?: string;
}

export interface PaymentChannelDistribution {
  publicKey: string;
  amount: string;
}

export interface PaymentChannelSigner {
  publicKey: string;
  /** Provided at close time to authorize the settlement transaction. */
  keypair?: StellarSdk.Keypair;
}

export interface PaymentChannel {
  id: string;
  escrowAccountId: string;
  status: PaymentChannelStatus;
  asset: PaymentChannelAsset;
  distributions: PaymentChannelDistribution[];
  signers: PaymentChannelSigner[];
  networkPassphrase: string;
  fee?: string | number;
  /** Defaults to all configured signers. */
  signatureThreshold?: number;
}

export interface ChannelCloseResult {
  channelId: string;
  status: 'closed';
  transactionHash: string;
  escrowAccountId: string;
  distributions: PaymentChannelDistribution[];
  closedAt: string;
}

export async function createPaymentChannel(config: PaymentChannelConfig): Promise<PaymentChannel> {
  const { id, asset, distributions, signers, networkPassphrase, fee, signatureThreshold } = config;

  if (!id) {
    throw new Error('Payment channel id is required');
  }
  if (!signers.length) {
    throw new Error('At least one signer is required');
  }
  if (!distributions.length) {
    throw new Error('At least one distribution is required');
  }
  for (const signer of signers) {
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(signer.publicKey)) {
      throw new Error(`Invalid signer public key: ${signer.publicKey}`);
    }
  }
  for (const distribution of distributions) {
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(distribution.publicKey)) {
      throw new Error(`Invalid distribution address: ${distribution.publicKey}`);
    }
    if (!distribution.amount || Number(distribution.amount) <= 0) {
      throw new Error(`Invalid distribution amount for ${distribution.publicKey}`);
    }
  }

  const escrowKeypair = StellarSdk.Keypair.random();

  const channel: PaymentChannel = {
    id,
    escrowAccountId: escrowKeypair.publicKey(),
    status: 'open',
    asset,
    distributions,
    signers,
    networkPassphrase,
    fee,
    signatureThreshold,
  };

  return channel;
}

function resolveAsset(asset: PaymentChannelAsset): StellarSdk.Asset {
  const code = asset.code?.trim();
  const isNative = !code || code === 'native' || code === 'XLM';

  if (isNative) {
    if (asset.issuer) {
      throw new Error('Native asset cannot include an issuer');
    }

    return StellarSdk.Asset.native();
  }

  if (!asset.issuer) {
    throw new Error(`Issuer is required for asset ${code}`);
  }

  return new StellarSdk.Asset(code, asset.issuer);
}

function normalizeFee(fee: string | number | undefined): string {
  const feeValue = fee === undefined ? Number(StellarSdk.BASE_FEE) : Number(fee);

  if (!Number.isFinite(feeValue) || feeValue <= 0) {
    throw new Error(`Invalid fee: ${String(fee)}`);
  }

  return String(Math.trunc(feeValue));
}

function assertChannelReadyToClose(channel: PaymentChannel): void {
  if (channel.status === 'closed') {
    throw new Error(`Payment channel ${channel.id} is already closed`);
  }

  if (!channel.distributions.length) {
    throw new Error('Payment channel close requires at least one distribution');
  }

  if (!channel.signers.length) {
    throw new Error('Payment channel close requires at least one signer');
  }

  for (const distribution of channel.distributions) {
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(distribution.publicKey)) {
      throw new Error(`Invalid distribution address: ${distribution.publicKey}`);
    }

    if (!distribution.amount || Number(distribution.amount) <= 0) {
      throw new Error(`Invalid distribution amount for ${distribution.publicKey}`);
    }
  }
}

function collectSignerKeypairs(channel: PaymentChannel): StellarSdk.Keypair[] {
  const threshold = channel.signatureThreshold ?? channel.signers.length;
  const keypairs = channel.signers
    .map((signer) => signer.keypair)
    .filter((keypair): keypair is StellarSdk.Keypair => Boolean(keypair));

  if (keypairs.length < threshold) {
    throw new Error(
      `Insufficient multi-party signoffs: ${keypairs.length}/${threshold} signatures available`,
    );
  }

  const unmatchedSigner = channel.signers.find(
    (signer) => signer.keypair && signer.keypair.publicKey() !== signer.publicKey,
  );

  if (unmatchedSigner) {
    throw new Error(
      `Signer keypair does not match configured public key: ${unmatchedSigner.publicKey}`,
    );
  }

  return keypairs.slice(0, threshold);
}

export function buildChannelCloseTransaction(
  channel: PaymentChannel,
  sourceAccount: StellarSdk.Account | StellarSdk.Horizon.HorizonApi.AccountResponse,
): StellarSdk.Transaction {
  assertChannelReadyToClose(channel);

  const account =
    sourceAccount instanceof StellarSdk.Account
      ? sourceAccount
      : new StellarSdk.Account(sourceAccount.account_id, sourceAccount.sequence);

  const asset = resolveAsset(channel.asset);
  const fee = normalizeFee(channel.fee);

  let builder = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: channel.networkPassphrase,
  });

  for (const distribution of channel.distributions) {
    builder = builder.addOperation(
      StellarSdk.Operation.payment({
        destination: distribution.publicKey,
        asset,
        amount: distribution.amount,
      }),
    );
  }

  return builder.setTimeout(30).build();
}

/**
 * Closes an existing payment channel, distributes escrowed funds, and submits
 * the settlement transaction after collecting required multi-party signoffs.
 */
export async function closePaymentChannel(
  channel: PaymentChannel,
  server: Horizon,
): Promise<ChannelCloseResult> {
  assertChannelReadyToClose(channel);

  const signerKeypairs = collectSignerKeypairs(channel);
  const escrowAccount = await server.loadAccount(channel.escrowAccountId);
  const transaction = buildChannelCloseTransaction(channel, escrowAccount);

  for (const keypair of signerKeypairs) {
    transaction.sign(keypair);
  }

  const response = await server.submitTransaction(transaction);

  return {
    channelId: channel.id,
    status: 'closed',
    transactionHash: response.hash,
    escrowAccountId: channel.escrowAccountId,
    distributions: channel.distributions.map((distribution) => ({ ...distribution })),
    closedAt: new Date().toISOString(),
  };
}
