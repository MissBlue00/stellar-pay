# Checkout Session Management

This module implements secure, time-bound checkout sessions for the StellarPay frontend payment experience.

## Overview

The checkout session system allows merchants to generate secure, expiring tokens that customers use to access time-limited payment interfaces without requiring authentication.

## Features

- **Secure Session Tokens**: UUID-based unique tokens for each checkout session
- **Time-Bound Sessions**: Configurable expiration (default: 15 minutes)
- **Public Access**: Unauthenticated endpoint for frontend UI to retrieve payment details
- **Flexible Metadata**: Store additional application-specific data with sessions
- **Status Tracking**: Monitor session lifecycle (pending, completed, expired, cancelled)
- **Merchant Isolation**: Sessions are scoped to merchants for security

## Architecture

### Entity: CheckoutSessionEntity

The database entity that stores checkout session information:

```typescript
{
  id: string;                          // UUID primary key
  merchant_id: string;                 // UUID reference to merchant
  session_token: string;               // Unique session identifier for customer
  payment_method: string;              // 'card', 'bank', 'crypto', etc.
  amount: decimal;                     // Payment amount with up to 8 decimals
  currency: string;                    // ISO 4217 currency code
  description: string;                 // Payment description
  merchant_name: string;               // Display name for merchant
  return_url?: string;                 // URL to redirect after payment
  webhook_url?: string;                // URL for server-side updates
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  expires_at: Date;                    // Expiration timestamp
  metadata?: Record<string, any>;      // Custom application data
  created_at: Date;                    // Creation timestamp
  updated_at: Date;                    // Last update timestamp
}
```

### API Endpoints

#### GET /checkout/session/:token [PUBLIC]

Retrieve checkout session details by session token.

**Parameters:**

- `token` (path parameter): Session token provided to the customer

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "session_token": "550e8400-e29b-41d4-a716-446655440001",
  "payment_method": "card",
  "amount": 99.99,
  "currency": "USD",
  "description": "Premium Subscription - Annual",
  "merchant_name": "ACME Corp",
  "return_url": "https://example.com/return",
  "status": "pending",
  "expires_at": "2026-03-26T18:15:30.000Z",
  "created_at": "2026-03-26T18:00:30.000Z"
}
```

**Error Responses:**

- `404 Not Found`: Session token not found
- `400 Bad Request`: Session has expired or token is empty

## Usage Examples

### Creating a Checkout Session (Backend)

```typescript
// In your payment creation flow
const checkoutSession = await checkoutSessionService.createSession({
  merchant_id: currentMerchant.id,
  payment_method: 'card',
  amount: 99.99,
  currency: 'USD',
  description: 'Annual Subscription',
  merchant_name: 'ACME Corp',
  return_url: 'https://acme.com/subscription/success',
  webhook_url: 'https://acme.com/api/webhooks/payment',
  expires_in_minutes: 15,
  metadata: {
    subscription_id: 'sub_123',
    customer_email: 'customer@example.com',
    order_id: 'order_456',
  },
});

// Share session_token with customer
// Redirect customer to: https://stellarpay.example.com/checkout?token={session_token}
```

### Retrieving Session from Frontend

```typescript
// Frontend code (unauthenticated)
async function loadCheckoutDetails(sessionToken: string) {
  const response = await fetch(`/checkout/session/${sessionToken}`);
  const session = await response.json();

  // Display payment UI
  return session;
}
```

## Security Considerations

1. **Token Uniqueness**: Session tokens are UUIDs and cryptographically unique
2. **Expiration**: Sessions automatically expire after configured duration
3. **Public Endpoint**: The GET endpoint is intentionally public (marked with @Public) to allow unauthenticated access - no sensitive data is exposed
4. **Merchant Isolation**: Sessions are logically isolated per merchant
5. **Status Tracking**: Monitor session lifecycle to prevent replay attacks
6. **Metadata Isolation**: Custom metadata is not returned in public responses

## Database Configuration

The module requires PostgreSQL with the following environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=stellar_pay
```

TypeORM will automatically create the `checkout_sessions` table with proper indexing.

## Integration

The module is integrated into the main API through `AppModule`:

```typescript
import { CheckoutSessionModule } from './checkout/checkout-session.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({...}),
    CheckoutSessionModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Testing

Run unit tests with:

```bash
npm run test
```

Key test cases covered:

- Session creation with auto-expiration
- Token retrieval and validation
- Expiration detection
- Status updates
- Response DTO serialization

## Future Enhancements

- [ ] Session invalidation endpoint (POST /checkout/session/:token/invalidate)
- [ ] Webhook callbacks when session expires
- [ ] Redis caching for high-frequency lookups
- [ ] Rate limiting per session token
- [ ] Session analytics and fraud detection
- [ ] Multi-currency support with real-time rates
