# Payment Intent Creation Endpoint - Implementation Guide

## Overview

This implementation provides the `POST /payments` endpoint that enables merchants to initiate payments via the Stellar Pay API. The endpoint is fully authenticated, generates unique payment references, and returns a checkout URL for seamless client-side integration.

## Endpoint Specification

### POST /payments

**Authentication**: Required (JWT Bearer Token)
**Status Code**: 201 Created

#### Request Body

```json
{
  "amount": 100.0,
  "asset": "USDC",
  "description": "Order #12345",
  "metadata": "{\"order_id\": \"12345\"}"
}
```

**Parameters:**

- `amount` (number, required): Payment amount in decimal format. Must be positive.
- `asset` (enum, required): Supported assets: `USDC`, `ARS`, `BRL`, `COP`, `MXN`, `XLM`
- `description` (string, optional): Human-readable payment description
- `metadata` (string, optional): Custom JSON metadata for tracking

#### Response (201 Created)

```json
{
  "payment_id": "550e8400-e29b-41d4-a716-446655440000",
  "payment_reference": "PYMT-MERCH-1705092000000-ABC123",
  "checkout_url": "https://checkout.stellar-pay.local/pay/550e8400-e29b-41d4-a716-446655440000/PYMT-MERCH-1705092000000-ABC123",
  "amount": 100,
  "asset": "USDC",
  "status": "pending",
  "created_at": "2024-01-12T15:00:00.000Z",
  "merchant_id": "merchant_123"
}
```

#### Error Responses

**400 Bad Request** - Unsupported Asset

```json
{
  "statusCode": 400,
  "message": "Asset XRP is not supported. Supported assets: USDC, ARS",
  "error": "Bad Request"
}
```

**400 Bad Request** - Invalid Amount

```json
{
  "statusCode": 400,
  "message": "Amount must be greater than 0",
  "error": "Bad Request"
}
```

**401 Unauthorized** - Missing/Invalid JWT

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Architecture & Design Decisions

### 1. Merchant Authentication

- Uses JWT tokens extracted from `Authorization: Bearer <token>` header
- Merchant identity injected via `@CurrentMerchant()` decorator
- JWT payload must contain `merchant_id` field
- Guards prevent unauthorized access automatically

### 2. Payment ID Generation

**Format**: UUID v4
**Rationale**:

- Universally unique across all systems
- Cryptographically secure
- No collision risk even with horizontal scaling
- Standard for distributed payment systems

**Example**: `550e8400-e29b-41d4-a716-446655440000`

### 3. Payment Reference Generation

**Format**: `PYMT-{MERCHANT_PREFIX}-{TIMESTAMP}-{RANDOM_SUFFIX}`

**Example**: `PYMT-MERCH-1705092000000-ABC123`

**Components:**

- `PYMT` - Static prefix for payment intent references
- `MERCHANT_PREFIX` - First 8 chars of merchant ID (uppercase)
- `TIMESTAMP` - Current Unix timestamp in milliseconds
- `RANDOM_SUFFIX` - 6-character alphanumeric random string

**Collision Safety**:

- Implements collision detection with retry mechanism (max 10 attempts)
- Timestamp + random combination provides near-zero collision probability
- Throws exception if collision occurs after 10 attempts (extremely rare)

### 4. Checkout URL Generation

**Format**: `{DOMAIN}/pay/{PAYMENT_ID}/{PAYMENT_REFERENCE}`

**Example**: `https://checkout.stellar-pay.local/pay/550e8400-e29b-41d4-a716-446655440000/PYMT-MERCH-1705092000000-ABC123`

**Configuration**: Domain is configurable via environment variable `CHECKOUT_URL_DOMAIN`

### 5. Status Management

Payment intents start with `pending` status and transition through:

- `pending` → Initial state after creation
- `processing` → When payment is being processed
- `completed` → Successfully captured
- `failed` → Payment failed
- `cancelled` → Merchant or customer cancelled

### 6. Data Storage

**Current**: In-memory Map-based storage (for development/testing)
**Production**: Should be replaced with TypeORM + PostgreSQL database

See [Future Improvements](#future-improvements) section for database integration plan.

## Project Structure

```
src/payments/
├── dto/
│   ├── create-payment-intent.dto.ts    # Input validation & asset enum
│   └── payment-intent-response.dto.ts  # API response structure
├── payments.controller.ts              # HTTP endpoints & request handling
├── payments.service.ts                 # Business logic & payment operations
├── payments.module.ts                  # NestJS module configuration
├── payments.controller.spec.ts         # Controller unit tests
└── payments.service.spec.ts            # Service unit tests
```

## Implementation Details

### PaymentsService

**Key Methods:**

- `createPaymentIntent(merchantId, dto)` - Creates new payment intent
- `getPaymentIntent(paymentId, merchantId)` - Retrieves specific intent (with authorization)
- `getMerchantPaymentIntents(merchantId)` - Lists all intents for merchant

**Security Features:**

- Merchant authorization checks on retrieval
- Input validation on amounts and assets
- Collision detection on reference generation

### PaymentsController

**Routes:**

- `POST /payments` - Create payment intent
- `GET /payments/:paymentId` - Get specific payment intent
- `GET /payments` - List merchant's payment intents

**Guards:**

- `JwtAuthGuard` - Required for all endpoints
- `ThrottlerGuard` - Rate limiting (100 req/min short, 1000/min long)
- `ClassSerializerInterceptor` - DTO serialization

## Error Handling

The implementation includes comprehensive error handling:

1. **Validation Errors**: Caught by NestJS validation pipes (using class-validator)
2. **Business Logic Errors**: Explicit BadRequestException with descriptive messages
3. **Authorization Errors**: Handled by JwtAuthGuard and endpoint checks
4. **Not Found**: NotFoundException for non-existent payment intents

## Testing

The implementation includes comprehensive unit tests:

**PaymentsServiceSpec:**

- ✅ Valid payment intent creation
- ✅ Unique payment reference generation
- ✅ Unsupported asset validation
- ✅ Amount validation (negative, zero)
- ✅ Checkout URL generation
- ✅ Payment intent retrieval
- ✅ Merchant authorization

**PaymentsControllerSpec:**

- ✅ Endpoint creation flow
- ✅ Missing merchant ID error handling
- ✅ Payment intent retrieval
- ✅ Not found error handling
- ✅ Merchant payment intents listing

**Run Tests:**

```bash
npm run test src/payments
npm run test:cov src/payments
```

## Environment Configuration

Required environment variables in `.env`:

```bash
# Support Assets (comma-separated)
SUPPORTED_ASSETS=USDC,ARS,BRL,COP,MXN,XLM

# Checkout URL configuration
CHECKOUT_URL_DOMAIN=https://checkout.stellar-pay.local
```

## Future Improvements

### 1. Database Integration (Priority: HIGH)

```typescript
// Install TypeORM with PostgreSQL
npm install @nestjs/typeorm typeorm pg

// Create PaymentIntent entity
@Entity('payment_intents')
export class PaymentIntentEntity {
  @PrimaryColumn()
  paymentId: string;

  @Column()
  merchantId: string;

  @Column()
  paymentReference: string;

  @Column('decimal', { precision: 19, scale: 8 })
  amount: number;

  @Column()
  asset: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index(['merchantId', 'createdAt'])
  // Composite index for efficient queries
}
```

### 2. Soroban Smart Contract Integration (Priority: HIGH)

- Implement `payment_intent.rs` contract methods
- Call smart contract on payment intent creation
- Store smart contract transaction ID
- Handle contract-level validations and escrow

### 3. Stellar Network Integration (Priority: HIGH)

- Validate assets against Stellar network
- Initialize smart contract with payment parameters
- Handle Stellar transaction submission
- Track transaction status on-chain

### 4. Payment Webhooks (Priority: MEDIUM)

- Implement webhooks for payment status updates
- Enable merchants to receive real-time notifications
- Implement webhook signature verification
- Add webhook retry mechanism

### 5. Enhanced Monitoring (Priority: MEDIUM)

- Add payment metrics and analytics
- Implement distributed tracing
- Add payment status reconciliation job
- Monitor time-to-completion statistics

### 6. Advanced Features (Priority: LOW)

- Payment discounts/promotions
- Subscription payments
- Recurring billing
- Multi-currency conversions
- Payment refunds
- Partial captures

### 7. Security Enhancements (Priority: HIGH)

- Merchant domain verification
- IP allowlisting
- Rate limiting per merchant
- Payment amount limits
- Fraud detection integration
- PCI compliance validation

## Security Considerations

✅ **Implemented:**

- JWT authentication required for all endpoints
- Merchant isolation (merchants can only access their own payments)
- Input validation for all parameters
- Rate limiting to prevent abuse
- Collision-safe reference generation

⚠️ **To Implement:**

- Database encryption for sensitive fields
- Audit logging for all payment operations
- Regular security audits
- OWASP top 10 compliance

## Performance Considerations

**Current (In-Memory):**

- O(1) lookup by payment ID
- O(n) lookup by merchant ID
- Suitable for development/testing only

**With Database:**

- Use composite indexes on `(merchant_id, created_at)`
- Use B-tree index on `payment_id`
- Consider caching frequently accessed intents
- Implement pagination for merchant intent lists

## Deployment Checklist

- [ ] Environment variables configured in `.env`
- [ ] JWT_SECRET set to strong random value
- [ ] Database configured (when implemented)
- [ ] Stellar network endpoint configured
- [ ] Checkout URL domain set correctly
- [ ] Rate limiter limits tuned for production
- [ ] HTTPS enforced for all endpoints
- [ ] Logging configured for audit trail
- [ ] Monitoring and alerting configured
- [ ] Load testing completed

## Support & References

- **NestJS Documentation**: https://docs.nestjs.com
- **Stellar SDK**: https://github.com/stellar/stellar-sdk-js
- **JWT Authentication**: https://github.com/mikenicholson/passport-jwt
- **Soroban Smart Contracts**: https://soroban.stellar.org
