export interface DirectPaymentParams {
  /** The amount to be sent, including decimal places */
  amount: string;
  /** The asset code being sent (e.g., 'USDC', 'XLM') */
  assetCode: string;
  /** The asset issuer (optional for native assets) */
  assetIssuer?: string;
  /** The destination account or payment pointer */
  destination: string;
  /** Source account ID */
  sourceAccount: string;
  /** Optional memo for the transaction */
  memo?: string;
  /** Memo type (text, id, hash, or return) */
  memoType?: 'text' | 'id' | 'hash' | 'return';
  /** Sender KYC information (SEP-12) */
  senderKyc?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    bankAccount?: string;
    bankNumber?: string;
  };
  /** Receiver KYC information (SEP-12) */
  receiverKyc?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    bankAccount?: string;
    bankNumber?: string;
  };
  /** Original transaction reference for reconciliation */
  originalTransactionRef?: string;
  /** Callback URL for payment status updates */
  callbackUrl?: string;
  /** Language preference for notifications */
  lang?: string;
}

export interface DirectPaymentResult {
  /** Unique identifier for the direct payment request */
  id: string;
  /** Current status of the payment */
  status:
    | 'pending'
    | 'completed'
    | 'rejected'
    | 'pending_approval'
    | 'pending_sender_info'
    | 'pending_receiver_info';
  /** Stellar transaction ID (when applicable) */
  transactionId?: string;
  /** Amount that will be delivered (after fees) */
  amountDelivered: string;
  /** Fee charged by the anchor */
  fee: string;
  /** Estimated completion time (ISO 8601) */
  eta?: string;
  /** Message from the anchor */
  message?: string;
  /** Instructions for next steps */
  instructions?: {
    action: string;
    url?: string;
    data?: Record<string, any>;
  }[];
  /** When the payment was created */
  createdAt: string;
  /** When the payment was last updated */
  updatedAt: string;
}

export interface Sep31Error {
  code: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Creates a SEP-31 direct payment request with the anchor
 *
 * @param params - Direct payment parameters including KYC information
 * @returns Promise resolving to the direct payment result
 * @throws Sep31Error if the payment request fails
 */
export async function createSep31DirectPayment(
  params: DirectPaymentParams,
): Promise<DirectPaymentResult> {
  try {
    // Validate required parameters
    if (!params.amount || !params.assetCode || !params.destination || !params.sourceAccount) {
      throw new Error('Missing required parameters: amount, assetCode, destination, sourceAccount');
    }

    // Validate KYC requirements (both sender and receiver must have KYC for most assets)
    if (!params.senderKyc?.id || !params.receiverKyc?.id) {
      throw new Error('KYC information is required for both sender and receiver');
    }

    // Validate memo type if memo is provided
    if (params.memo && !params.memoType) {
      throw new Error('memoType is required when memo is provided');
    }

    // Prepare the request payload according to SEP-31 specification
    const payload: Record<string, any> = {
      amount: params.amount,
      asset_code: params.assetCode,
      asset_issuer: params.assetIssuer,
      destination: params.destination,
      source_account: params.sourceAccount,
      memo: params.memo,
      memo_type: params.memoType,
      sender_info: {
        id: params.senderKyc.id,
        first_name: params.senderKyc.firstName,
        last_name: params.senderKyc.lastName,
        email: params.senderKyc.email,
        bank_account: params.senderKyc.bankAccount,
        bank_number: params.senderKyc.bankNumber,
      },
      receiver_info: {
        id: params.receiverKyc.id,
        first_name: params.receiverKyc.firstName,
        last_name: params.receiverKyc.lastName,
        email: params.receiverKyc.email,
        bank_account: params.receiverKyc.bankAccount,
        bank_number: params.receiverKyc.bankNumber,
      },
      original_transaction_ref: params.originalTransactionRef,
      callback_url: params.callbackUrl,
      lang: params.lang || 'en',
    };

    // Remove undefined fields from the payload
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    // In a real implementation, this would make an HTTP request to the anchor's SEP-31 endpoint
    // For now, we'll simulate the response
    const response = await simulateSep31Request(payload);

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: 'DIRECT_PAYMENT_FAILED',
        message: error.message,
        data: { params },
      } as Sep31Error;
    }
    throw error;
  }
}

/**
 * Simulates a SEP-31 API request to an anchor
 * In production, this would be an actual HTTP request to the anchor's SEP-31 endpoint
 */
async function simulateSep31Request(payload: any): Promise<DirectPaymentResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate a successful response
  return {
    id: `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending_approval',
    amountDelivered: payload.amount,
    fee: '0.50', // Simulated fee
    eta: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    message: 'Payment is pending approval from the anchor',
    instructions: [
      {
        action: 'wait_for_approval',
        url: payload.callback_url,
        data: { payment_id: `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves the status of an existing direct payment
 *
 * @param paymentId - The ID of the direct payment to check
 * @returns Promise resolving to the current payment status
 */
export async function getDirectPaymentStatus(paymentId: string): Promise<DirectPaymentResult> {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    // In production, this would make an HTTP GET request to the anchor's SEP-31 endpoint
    // For now, we'll simulate the response
    const response = await simulateStatusCheck(paymentId);

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: 'STATUS_CHECK_FAILED',
        message: error.message,
        data: { paymentId },
      } as Sep31Error;
    }
    throw error;
  }
}

/**
 * Simulates a status check request
 */
async function simulateStatusCheck(paymentId: string): Promise<DirectPaymentResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return a mock status
  return {
    id: paymentId,
    status: 'completed',
    transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
    amountDelivered: '100.00',
    fee: '0.50',
    message: 'Payment completed successfully',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
