import type {
  DirectPaymentParams,
  DirectPaymentResult,
  Sep12KycData,
} from './interfaces/direct-payment.interface';
import type { RefundResult } from './interfaces/refund-result.interface';
import type {
  AnchorTransaction,
  AnchorTransactionStatus,
} from './interfaces/transaction.interface';
import type { PaymentStatusResponse } from './interfaces/payment-status.interface';

interface Sep31PaymentRecord {
  paymentId: string;
  senderId: string;
  receiverId: string;
  amount: string;
  assetCode: string;
  originalTransactionRef: string;
  stellarTransactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class AnchorService {
  private readonly payments = new Map<string, Sep31PaymentRecord>();
  private readonly transactions = new Map<string, AnchorTransaction>();

  // ---------------------------------------------------------------------------
  // SEP-31 Direct Payment
  // ---------------------------------------------------------------------------

  async createSep31DirectPayment(params: DirectPaymentParams): Promise<DirectPaymentResult> {
    const senderValid = this.validateKyc(params.senderKyc);
    const receiverValid = this.validateKyc(params.receiverKyc);

    if (!senderValid) {
      return this.buildError(params, 'Sender KYC validation failed');
    }

    if (!receiverValid) {
      return this.buildError(params, 'Receiver KYC validation failed');
    }

    const paymentId = `sep31_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;

    const record: Sep31PaymentRecord = {
      paymentId,
      senderId: params.senderId,
      receiverId: params.receiverId,
      amount: params.amount,
      assetCode: params.assetCode,
      originalTransactionRef: params.originalTransactionRef,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payments.set(paymentId, record);

    try {
      const txHash = `tx_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;

      record.stellarTransactionHash = txHash;
      record.status = 'completed';
      record.updatedAt = new Date().toISOString();
      this.payments.set(paymentId, record);

      return {
        success: true,
        paymentId,
        stellarTransactionHash: txHash,
        originalTransactionRef: params.originalTransactionRef,
        amount: params.amount,
        assetCode: params.assetCode,
        status: 'completed',
        createdAt: record.createdAt,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      record.status = 'failed';
      record.error = errorMessage;
      record.updatedAt = new Date().toISOString();
      this.payments.set(paymentId, record);

      return {
        success: false,
        paymentId,
        originalTransactionRef: params.originalTransactionRef,
        amount: params.amount,
        assetCode: params.assetCode,
        status: 'failed',
        error: errorMessage,
        createdAt: record.createdAt,
      };
    }
  }

  getPayment(paymentId: string): Sep31PaymentRecord | undefined {
    return this.payments.get(paymentId);
  }

  getAllPayments(): Sep31PaymentRecord[] {
    return Array.from(this.payments.values());
  }

  private validateKyc(_kyc: Record<string, unknown> | Sep12KycData): boolean {
    return true;
  }

  private buildError(params: DirectPaymentParams, error: string): DirectPaymentResult {
    return {
      success: false,
      paymentId: '',
      originalTransactionRef: params.originalTransactionRef,
      amount: params.amount,
      assetCode: params.assetCode,
      status: 'failed',
      error,
      createdAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Anchor Refund
  // ---------------------------------------------------------------------------

  registerTransaction(tx: AnchorTransaction): void {
    this.transactions.set(tx.id, { ...tx, amountRefunded: tx.amountRefunded ?? 0 });
  }

  async processAnchorRefund(transactionId: string): Promise<RefundResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      return {
        transactionId,
        success: false,
        amountRefunded: 0,
        totalAmount: 0,
        isPartialRefund: false,
        status: 'failed',
        error: `Transaction ${transactionId} not found`,
        refundedAt: new Date().toISOString(),
      };
    }

    if (tx.status === 'refunded') {
      return {
        transactionId,
        success: false,
        amountRefunded: tx.amountRefunded,
        totalAmount: tx.amount,
        isPartialRefund: false,
        status: 'failed',
        error: 'Transaction has already been fully refunded',
        refundedAt: new Date().toISOString(),
      };
    }

    if (tx.status !== 'failed') {
      return {
        transactionId,
        success: false,
        amountRefunded: tx.amountRefunded,
        totalAmount: tx.amount,
        isPartialRefund: false,
        status: 'failed',
        error: `Transaction is in status '${tx.status}' and cannot be refunded`,
        refundedAt: new Date().toISOString(),
      };
    }

    const remaining = tx.amount - tx.amountRefunded;
    const isPartial = tx.amountRefunded > 0 && remaining > 0;

    tx.amountRefunded = tx.amount;
    tx.updatedAt = new Date().toISOString();

    let newStatus: AnchorTransactionStatus;
    if (isPartial) {
      newStatus = 'partially_refunded';
    } else {
      newStatus = 'refunded';
    }
    tx.status = newStatus;
    this.transactions.set(tx.id, tx);

    return {
      transactionId,
      success: true,
      amountRefunded: remaining,
      totalAmount: tx.amount,
      isPartialRefund: isPartial,
      status: newStatus,
      refundedAt: new Date().toISOString(),
    };
  }

  getTransaction(id: string): AnchorTransaction | undefined {
    return this.transactions.get(id);
  }

  getAllTransactions(): AnchorTransaction[] {
    return Array.from(this.transactions.values());
  }

  getPaymentStatus(paymentId: string): PaymentStatusResponse | undefined {
    const payment = this.payments.get(paymentId);
    if (payment) {
      return {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        assetCode: payment.assetCode,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        error: payment.error,
      };
    }

    const transaction = this.transactions.get(paymentId);
    if (transaction) {
      return {
        paymentId: transaction.id,
        status: transaction.status,
        amount: String(transaction.amount),
        assetCode: transaction.asset,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        error: transaction.errorMessage,
      };
    }

    return undefined;
  }
}
