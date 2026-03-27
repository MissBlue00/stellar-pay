export type AnchorTransferKind = 'deposit' | 'withdrawal';

export type AnchorTransactionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'refund_failed';

export interface AnchorTransaction {
  id: string;
  kind: AnchorTransferKind;
  status: AnchorTransactionStatus;
  amount: number;
  refundedAmount: number;
}

export interface RefundResult {
  transactionId: string;
  attemptedAmount: number;
  refundedAmount: number;
  isPartial: boolean;
  status: AnchorTransactionStatus;
  externalRefundId?: string;
  message?: string;
}

export interface AnchorTransactionRepository {
  getById(transactionId: string): Promise<AnchorTransaction | null>;
  update(transaction: AnchorTransaction): Promise<void>;
}

export interface RefundExecutionResult {
  refundedAmount: number;
  externalRefundId?: string;
}

export interface AnchorRefundExecutor {
  executeRefund(transaction: AnchorTransaction, amount: number): Promise<RefundExecutionResult>;
}

export interface AnchorRefundProcessorDeps {
  repository: AnchorTransactionRepository;
  refundExecutor: AnchorRefundExecutor;
}

let configuredDeps: AnchorRefundProcessorDeps | null = null;

export function configureAnchorRefundProcessor(deps: AnchorRefundProcessorDeps): void {
  configuredDeps = deps;
}

export function resetAnchorRefundProcessorConfiguration(): void {
  configuredDeps = null;
}

export async function processAnchorRefund(transactionId: string): Promise<RefundResult> {
  if (!configuredDeps) {
    throw new Error(
      'Anchor refund processor not configured. Call configureAnchorRefundProcessor({ repository, refundExecutor }) first.',
    );
  }

  return processAnchorRefundWithDeps(transactionId, configuredDeps);
}

export async function processAnchorRefundWithDeps(
  transactionId: string,
  deps: AnchorRefundProcessorDeps,
): Promise<RefundResult> {
  const transaction = await deps.repository.getById(transactionId);
  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.kind !== 'deposit' && transaction.kind !== 'withdrawal') {
    return {
      transactionId,
      attemptedAmount: 0,
      refundedAmount: 0,
      isPartial: false,
      status: transaction.status,
      message: `Unsupported transaction kind for refund: ${transaction.kind}`,
    };
  }

  const refundableAmount = Math.max(0, transaction.amount - transaction.refundedAmount);

  if (refundableAmount === 0) {
    return {
      transactionId,
      attemptedAmount: 0,
      refundedAmount: 0,
      isPartial: false,
      status: transaction.status,
      message: 'Nothing to refund.',
    };
  }

  if (transaction.status !== 'failed') {
    return {
      transactionId,
      attemptedAmount: 0,
      refundedAmount: 0,
      isPartial: false,
      status: transaction.status,
      message: `Refund skipped. Transaction status is '${transaction.status}', expected 'failed'.`,
    };
  }

  let executionResult: RefundExecutionResult;
  try {
    executionResult = await deps.refundExecutor.executeRefund(transaction, refundableAmount);
  } catch (e) {
    transaction.status = 'refund_failed';
    await deps.repository.update(transaction);
    throw e;
  }

  const refundedAmount = Math.max(0, Math.min(refundableAmount, executionResult.refundedAmount));
  transaction.refundedAmount = Math.min(transaction.amount, transaction.refundedAmount + refundedAmount);

  const isPartial = refundedAmount < refundableAmount;
  transaction.status = transaction.refundedAmount >= transaction.amount ? 'refunded' : 'partially_refunded';
  await deps.repository.update(transaction);

  return {
    transactionId,
    attemptedAmount: refundableAmount,
    refundedAmount,
    isPartial,
    status: transaction.status,
    externalRefundId: executionResult.externalRefundId,
  };
}