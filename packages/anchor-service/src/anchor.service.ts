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
import type {
  CustomerData,
  CustomerPutResponse,
  CustomerStatus,
  IdentityDocument,
} from './interfaces/customer.interface';
import type { KycStatusResponse } from './interfaces/kyc.interface';
import type { FeeQuote, TransactionType } from './interfaces/fee.interface';

interface CustomerRecord {
  customerId: string;
  data: CustomerData;
  status: CustomerStatus;
  message?: string;
  fieldsRequired?: string[];
  createdAt: string;
  updatedAt: string;
}

interface KycValidationError {
  isValid: boolean;
  invalidFields?: string[];
  errors?: Record<string, string>;
}

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
  private readonly customers = new Map<string, CustomerRecord>();
  private readonly accountLinks = new Map<string, string>();

  // ---------------------------------------------------------------------------
  // SEP-31 Direct Payment
  // ---------------------------------------------------------------------------

  async createSep31DirectPayment(params: DirectPaymentParams): Promise<DirectPaymentResult> {
    const senderValidation = this.validateKyc(params.senderKyc);
    const receiverValidation = this.validateKyc(params.receiverKyc);

    if (!senderValidation.isValid) {
      const errorMsg = senderValidation.errors
        ? `Sender KYC validation failed: ${Object.entries(senderValidation.errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}`
        : 'Sender KYC validation failed';
      return this.buildError(params, errorMsg);
    }

    if (!receiverValidation.isValid) {
      const errorMsg = receiverValidation.errors
        ? `Receiver KYC validation failed: ${Object.entries(receiverValidation.errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}`
        : 'Receiver KYC validation failed';
      return this.buildError(params, errorMsg);
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

  private validateKyc(kyc: Record<string, unknown> | Sep12KycData): KycValidationError {
    const errors: Record<string, string> = {};
    const invalidFields: string[] = [];

    // Type guard to ensure we have the right structure
    const kycData = kyc as Sep12KycData & Record<string, unknown>;

    // =========================================================================
    // Check required fields
    // =========================================================================
    if (!kycData.firstName || typeof kycData.firstName !== 'string' || !kycData.firstName.trim()) {
      errors['firstName'] = 'First name is required and must be a non-empty string';
      invalidFields.push('firstName');
    }

    if (!kycData.lastName || typeof kycData.lastName !== 'string' || !kycData.lastName.trim()) {
      errors['lastName'] = 'Last name is required and must be a non-empty string';
      invalidFields.push('lastName');
    }

    if (!kycData.email || typeof kycData.email !== 'string' || !kycData.email.trim()) {
      errors['email'] = 'Email is required and must be a non-empty string';
      invalidFields.push('email');
    }

    if (
      !kycData.countryCode ||
      typeof kycData.countryCode !== 'string' ||
      !kycData.countryCode.trim()
    ) {
      errors['countryCode'] = 'Country code is required and must be a non-empty string';
      invalidFields.push('countryCode');
    }

    // =========================================================================
    // Field format validation
    // =========================================================================

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (kycData.email && typeof kycData.email === 'string' && !emailRegex.test(kycData.email)) {
      errors['email'] = 'Email format is invalid';
      if (!invalidFields.includes('email')) {
        invalidFields.push('email');
      }
    }

    // Phone number validation: basic international format
    if (kycData.phoneNumber && typeof kycData.phoneNumber === 'string') {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
      if (!phoneRegex.test(kycData.phoneNumber.replace(/[\s\-()]/g, ''))) {
        errors['phoneNumber'] = 'Phone number must be in valid international format';
        invalidFields.push('phoneNumber');
      }
    }

    // =========================================================================
    // Country-specific field requirements
    // =========================================================================
    const countryCode = (kycData.countryCode as string)?.toUpperCase();

    // US: Requires SSN (stored in bankAccountNumber for this implementation)
    if (countryCode === 'US') {
      if (!kycData.bankAccountNumber) {
        errors['bankAccountNumber'] = 'SSN is required for US residents';
        invalidFields.push('bankAccountNumber');
      } else if (typeof kycData.bankAccountNumber === 'string') {
        // Basic SSN validation: XXX-XX-XXXX or XXXXXXXXX
        const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
        if (!ssnRegex.test(kycData.bankAccountNumber)) {
          errors['bankAccountNumber'] = 'SSN must be in format XXX-XX-XXXX or XXXXXXXXX';
          invalidFields.push('bankAccountNumber');
        }
      }
    }

    // EU countries: Require date of birth
    const euCountries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];
    if (euCountries.includes(countryCode)) {
      if (!kycData.dateOfBirth) {
        errors['dateOfBirth'] = 'Date of birth is required for EU residents';
        invalidFields.push('dateOfBirth');
      } else if (typeof kycData.dateOfBirth === 'string') {
        // Validate ISO date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(kycData.dateOfBirth)) {
          errors['dateOfBirth'] = 'Date of birth must be in YYYY-MM-DD format';
          invalidFields.push('dateOfBirth');
        } else {
          const dob = new Date(kycData.dateOfBirth);
          if (isNaN(dob.getTime())) {
            errors['dateOfBirth'] = 'Date of birth is not a valid date';
            invalidFields.push('dateOfBirth');
          } else {
            // Check if person is at least 18 years old
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              if (age < 18) {
                errors['dateOfBirth'] = 'Must be at least 18 years old';
                invalidFields.push('dateOfBirth');
              }
            }
          }
        }
      }
    }

    // Return structured validation result
    return {
      isValid: invalidFields.length === 0,
      invalidFields: invalidFields.length > 0 ? invalidFields : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
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

  // ---------------------------------------------------------------------------
  // SEP-12 Customer Info
  // ---------------------------------------------------------------------------

  async submitCustomerInfo(customerData: CustomerData): Promise<CustomerPutResponse> {
    const existingId = customerData.id ?? '';
    const isUpdate = !!customerData.id && this.customers.has(existingId);
    const customerId = isUpdate
      ? existingId
      : `cust_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;

    const missingFields = this.validateRequiredFields(customerData, isUpdate);
    if (missingFields.length > 0) {
      return {
        success: false,
        customerId,
        status: 'NEEDS_INFO',
        message: 'Some required fields are missing',
        fieldsRequired: missingFields,
      };
    }

    if (customerData.identityDocument) {
      const uploaded = await this.handleDocumentUpload(customerData.identityDocument);
      if (!uploaded) {
        return {
          success: false,
          customerId,
          status: 'NEEDS_INFO',
          message: 'Identity document upload failed',
          fieldsRequired: ['identityDocument'],
        };
      }
    }

    let status: CustomerStatus;
    if (isUpdate) {
      const existing = this.customers.get(existingId);
      if (!existing) {
        return {
          success: false,
          customerId,
          status: 'NEEDS_INFO',
          message: 'Customer record not found',
        };
      }
      existing.data = { ...existing.data, ...customerData };
      existing.status = 'APPROVED';
      existing.updatedAt = new Date().toISOString();
      this.customers.set(existingId, existing);
      status = existing.status;
    } else {
      const record: CustomerRecord = {
        customerId,
        data: customerData,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.customers.set(customerId, record);
      status = record.status;
    }

    return {
      success: true,
      customerId,
      status,
      message: isUpdate
        ? 'Customer info updated successfully'
        : 'Customer info submitted successfully',
    };
  }

  getCustomer(customerId: string): CustomerRecord | undefined {
    return this.customers.get(customerId);
  }

  getAllCustomers(): CustomerRecord[] {
    return Array.from(this.customers.values());
  }

  // ---------------------------------------------------------------------------
  // SEP-12 KYC Status
  // ---------------------------------------------------------------------------

  linkAccount(accountId: string, customerId: string): void {
    this.accountLinks.set(accountId, customerId);
  }

  async checkKycStatus(accountId: string): Promise<KycStatusResponse> {
    const customerId = this.accountLinks.get(accountId);

    if (!customerId) {
      return {
        accountId,
        status: 'pending',
        message: 'No KYC data found for this account. Please submit customer info first.',
        checkedAt: new Date().toISOString(),
      };
    }

    const customer = this.customers.get(customerId);

    if (!customer) {
      this.accountLinks.delete(accountId);
      return {
        accountId,
        status: 'pending',
        message: 'Customer record not found. Please resubmit customer info.',
        checkedAt: new Date().toISOString(),
      };
    }

    let status: KycStatusResponse['status'];
    switch (customer.status) {
      case 'APPROVED':
        status = 'approved';
        break;
      case 'REJECTED':
        status = 'rejected';
        break;
      default:
        status = 'pending';
        break;
    }

    return {
      accountId,
      status,
      customerId: customer.customerId,
      message:
        status === 'approved'
          ? 'KYC approved'
          : status === 'rejected'
            ? 'KYC rejected'
            : 'KYC is still being processed',
      checkedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Fee Calculation
  // ---------------------------------------------------------------------------

  private readonly feeSchedule: Record<string, { flat: string; percentage: string }> = {
    USDC: { flat: '1.00', percentage: '0' },
    USDT: { flat: '1.00', percentage: '0' },
    BTC: { flat: '0.0001', percentage: '0.5' },
    ETH: { flat: '0.001', percentage: '0.3' },
    XLM: { flat: '0.01', percentage: '0' },
  };

  async calculateAnchorFee(
    amount: string,
    asset: string,
    type: TransactionType,
  ): Promise<FeeQuote> {
    const schedule = this.feeSchedule[asset] ?? { flat: '0', percentage: '1' };
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    const breakdown: FeeQuote['feeBreakdown'] = [];

    let totalFee = 0;

    if (schedule.flat !== '0') {
      const flatFee = parseFloat(schedule.flat);
      totalFee += flatFee;
      breakdown.push({
        type: 'flat',
        description: `Flat fee for ${asset}`,
        amount: schedule.flat,
      });
    }

    if (schedule.percentage !== '0') {
      const percentageFee = parsedAmount * (parseFloat(schedule.percentage) / 100);
      totalFee += percentageFee;
      breakdown.push({
        type: 'percentage',
        description: `${schedule.percentage}% fee on ${asset}`,
        amount: percentageFee.toFixed(7),
      });
    }

    const effectiveRate = parsedAmount > 0 ? ((totalFee / parsedAmount) * 100).toFixed(4) : '0';

    return {
      totalFee: totalFee.toFixed(7),
      asset,
      type,
      amount,
      feeBreakdown: breakdown,
      effectiveRate: `${effectiveRate}%`,
      quoteId: `fee_${crypto.randomUUID().split('-').join('').slice(0, 16)}`,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  private validateRequiredFields(data: CustomerData, isUpdate: boolean): string[] {
    const missing: string[] = [];

    if (isUpdate) return missing;

    if (!data.firstName) missing.push('firstName');
    if (!data.lastName) missing.push('lastName');
    if (!data.email) missing.push('email');
    if (!data.countryCode) missing.push('countryCode');

    return missing;
  }

  private async handleDocumentUpload(
    _document: Record<string, unknown> | IdentityDocument,
  ): Promise<boolean> {
    // TODO: Implement actual file upload to anchor's SEP-12 endpoint
    // const formData = new FormData();
    // formData.append('file', document.file);
    // const response = await fetch('https://anchor.example.com/sep12/customer', {
    //   method: 'PUT',
    //   body: formData,
    // });
    // return response.ok;
    return true;
  }
}
