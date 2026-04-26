/**
 * KYC Status interface for SEP-12 customer information responses
 */
export interface KycStatus {
  /** The account ID (Stellar public key) */
  accountId: string;
  /** KYC verification status */
  status: 'pending' | 'approved' | 'rejected';
  /** Optional status message providing additional context */
  message?: string;
  /** Timestamp when the KYC status was last updated */
  lastUpdated?: Date;
  /** Optional additional KYC data from the anchor */
  extra?: Record<string, unknown>;
}

/**
 * SEP-12 Customer Information Request Response
 */
interface Sep12CustomerResponse {
  id: string;
  status: string;
  message?: string;
  provided_fields?: Record<string, unknown>;
  requested_info?: Record<string, unknown>;
}

/**
 * Configuration options for the anchor service
 */
interface AnchorServiceConfig {
  /** SEP-12 KYC endpoint URL */
  kycEndpoint: string;
  /** Optional authentication token for the anchor */
  authToken?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Anchor Service for handling Stellar anchor interactions
 * Implements SEP-12 (Customer Information) for KYC verification
 */
export class AnchorService {
  private config: AnchorServiceConfig;

  constructor(config: AnchorServiceConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };
  }

  /**
   * Check KYC status for a given account via SEP-12
   * @param accountId - The Stellar account ID (public key) to check
   * @returns Promise<KycStatus> - The KYC status of the account
   */
  async checkKycStatus(accountId: string): Promise<KycStatus> {
    try {
      // Validate accountId format (basic validation for Stellar public key)
      if (!accountId || typeof accountId !== 'string') {
        return {
          accountId,
          status: 'rejected',
          message: 'Invalid account ID format',
          lastUpdated: new Date(),
        };
      }

      // Construct the SEP-12 customer info request URL
      const url = new URL('/customer', this.config.kycEndpoint);
      url.searchParams.set('account', accountId);

      // Configure request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      // Make the SEP-12 customer information request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle missing KYC data gracefully
      if (response.status === 404) {
        return {
          accountId,
          status: 'pending',
          message: 'No KYC data found for this account',
          lastUpdated: new Date(),
        };
      }

      if (!response.ok) {
        throw new Error(
          `SEP-12 request failed with status ${response.status}: ${response.statusText}`
        );
      }

      const customerData: Sep12CustomerResponse = await response.json();

      // Map SEP-12 status to our KycStatus
      const kycStatus = this.mapSep12Status(customerData.status);

      return {
        accountId,
        status: kycStatus,
        message: customerData.message,
        lastUpdated: new Date(),
        extra: {
          customerId: customerData.id,
          providedFields: customerData.provided_fields,
          requestedInfo: customerData.requested_info,
        },
      };
    } catch (error) {
      // Handle network errors and missing KYC data gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          accountId,
          status: 'pending',
          message: 'KYC check timed out',
          lastUpdated: new Date(),
        };
      }

      // Log the error for debugging but return a safe default
      console.error(`KYC check failed for account ${accountId}:`, error);

      return {
        accountId,
        status: 'pending',
        message: `KYC check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Map SEP-12 customer status to our KycStatus enum
   * SEP-12 defines various statuses that we normalize to: pending, approved, rejected
   */
  private mapSep12Status(sep12Status: string): 'pending' | 'approved' | 'rejected' {
    const normalizedStatus = sep12Status.toLowerCase();

    // SEP-12 status mappings
    if (normalizedStatus === 'approved' || normalizedStatus === 'accepted') {
      return 'approved';
    }

    if (
      normalizedStatus === 'rejected' ||
      normalizedStatus === 'denied' ||
      normalizedStatus === 'blocked'
    ) {
      return 'rejected';
    }

    // All other statuses (pending, pending_customer, pending_server, etc.) map to pending
    return 'pending';
  }
}
