import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CreatePaymentIntentDto, PaymentAsset } from './dto/create-payment-intent.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

interface PaymentIntent {
  payment_id: string;
  merchant_id: string;
  payment_reference: string;
  amount: number;
  asset: PaymentAsset;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: string;
  checkout_url: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly supportedAssets: string[];

  // In-memory storage for payment intents
  // TODO: Replace with database storage using TypeORM when database is configured
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private paymentReferences: Set<string> = new Set();

  constructor(private configService: ConfigService) {
    const assetsEnv = this.configService.get<string>('SUPPORTED_ASSETS', 'USDC,ARS');
    this.supportedAssets = assetsEnv.split(',').map((asset: string) => asset.trim());
  }

  /**
   * Create a new payment intent
   *
   * @param merchantId - The merchant ID from JWT token
   * @param dto - Payment intent creation data
   * @returns PaymentIntentResponseDto
   * @throws BadRequestException if asset is not supported or validation fails
   */
  async createPaymentIntent(
    merchantId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    // Validate asset is supported
    if (!this.supportedAssets.includes(dto.asset)) {
      throw new BadRequestException(
        `Asset ${dto.asset} is not supported. Supported assets: ${this.supportedAssets.join(', ')}`,
      );
    }

    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate unique payment IDs
    const paymentId = this.generatePaymentId();
    const paymentReference = this.generatePaymentReference(merchantId);

    // Generate checkout URL
    const checkoutUrl = this.generateCheckoutUrl(paymentId, paymentReference);

    // Create payment intent
    const paymentIntent: PaymentIntent = {
      payment_id: paymentId,
      merchant_id: merchantId,
      payment_reference: paymentReference,
      amount: dto.amount,
      asset: dto.asset,
      status: 'pending',
      description: dto.description,
      metadata: dto.metadata,
      checkout_url: checkoutUrl,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Store payment intent
    this.paymentIntents.set(paymentId, paymentIntent);
    this.paymentReferences.add(paymentReference);

    this.logger.log(`Payment intent created: ${paymentId} for merchant ${merchantId}`);

    return this.mapToResponseDto(paymentIntent);
  }

  /**
   * Get payment intent by ID
   *
   * @param paymentId - Payment intent ID
   * @param merchantId - Merchant ID (for authorization)
   * @returns PaymentIntentResponseDto
   */
  async getPaymentIntent(
    paymentId: string,
    merchantId: string,
  ): Promise<PaymentIntentResponseDto | null> {
    const intent = this.paymentIntents.get(paymentId);

    if (!intent) {
      return null;
    }

    // Ensure merchant can only access their own payment intents
    if (intent.merchant_id !== merchantId) {
      throw new BadRequestException(
        'Unauthorized: Cannot access payment intent belonging to another merchant',
      );
    }

    return this.mapToResponseDto(intent);
  }

  /**
   * Get all payment intents for a merchant
   *
   * @param merchantId - Merchant ID
   * @returns Array of PaymentIntentResponseDto
   */
  async getMerchantPaymentIntents(merchantId: string): Promise<PaymentIntentResponseDto[]> {
    const intents = Array.from(this.paymentIntents.values()).filter(
      (intent) => intent.merchant_id === merchantId,
    );

    return intents.map((intent) => this.mapToResponseDto(intent));
  }

  /**
   * Generate a unique payment ID using UUID v4
   */
  private generatePaymentId(): string {
    return uuidv4();
  }

  /**
   * Generate a collision-safe payment reference
   * Format: MERCHANT_ID-TIMESTAMP-RANDOM_SUFFIX
   * Example: merch_123-1705092000000-abc123
   *
   * @param merchantId - Merchant ID
   * @returns Payment reference string
   */
  private generatePaymentReference(merchantId: string): string {
    let paymentReference: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      paymentReference = `PYMT-${merchantId.substring(0, 8).toUpperCase()}-${timestamp}-${randomSuffix}`;
      attempts++;

      if (attempts >= maxAttempts) {
        throw new BadRequestException(
          'Failed to generate unique payment reference after multiple attempts',
        );
      }
    } while (this.paymentReferences.has(paymentReference));

    return paymentReference;
  }

  /**
   * Generate checkout URL for the payment
   * Format: https://checkout.domain/pay/{paymentId}/{paymentReference}
   *
   * TODO: Make domain configurable via environment variables
   *
   * @param paymentId - Payment ID
   * @param paymentReference - Payment reference
   * @returns Checkout URL
   */
  private generateCheckoutUrl(paymentId: string, paymentReference: string): string {
    const domain = this.configService.get<string>(
      'CHECKOUT_URL_DOMAIN',
      'https://checkout.stellar-pay.local',
    );
    return `${domain}/pay/${paymentId}/${paymentReference}`;
  }

  /**
   * Map PaymentIntent to response DTO
   */
  private mapToResponseDto(intent: PaymentIntent): PaymentIntentResponseDto {
    return {
      payment_id: intent.payment_id,
      payment_reference: intent.payment_reference,
      checkout_url: intent.checkout_url,
      amount: intent.amount,
      asset: intent.asset,
      status: intent.status,
      created_at: intent.created_at,
      merchant_id: intent.merchant_id,
    };
  }
}
