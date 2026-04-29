# StellarPay API Documentation

StellarPay is a payment processing backend built with NestJS that integrates with the Stellar blockchain for stablecoin payments.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Health Check](#health-check)
  - [Treasury](#treasury)
  - [Payments](#payments)
- [Authentication Flows](#authentication-flows)
- [Error Responses](#error-responses)
- [Webhooks](#webhooks)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# Run tests
pnpm run test
```

## Project Structure

```
src/
├── auth/           # JWT authentication module
├── modules/
│   ├── database/  # Database repositories
│   └── worker/   # Background job processors
├── treasury/     # Treasury & proof of reserves
├── health/        # Health check endpoints
└── rate-limiter/ # Rate limiting guards
```

## Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `STELLAR_NETWORK` - TESTNET or PUBLIC
- `JWT_SECRET` - Secret for JWT signing

---

## API Endpoints

### Base URL

```
Development: http://localhost:3000
Production: https://api.stellarpay.io
```

### Swagger Documentation

Interactive API documentation is available at: `/docs`

---

### Authentication

#### POST `/auth/login`

Authenticate a merchant and receive a JWT token.

**Request Body:**
```json
{
  "merchant_id": "string",
  "api_key": "string"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### Health Check

#### GET `/health`

Check the health status of all API dependencies.

**Authentication:** None (Public)

**Response (200):**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "blockchain_rpc": { "status": "up" },
    "treasury_wallet": { "status": "up" }
  },
  "details": {
    "database": { "status": "up", "latency": "5ms" },
    "redis": { "status": "up", "latency": "2ms" },
    "blockchain_rpc": { "status": "up", "latency": "150ms" },
    "treasury_wallet": { "status": "up", "balance": "50000 USDC" }
  }
}
```

**Response (503):**
```json
{
  "status": "error",
  "info": { ... },
  "details": { ... },
  "error": "Service Unavailable"
}
```

---

### Treasury

#### GET `/treasury/reserves`

Get proof of reserves showing total treasury holdings.

**Authentication:** None (Public)

**Response (200):**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "network": "TESTNET",
  "reserves": [
    {
      "asset": "USDC",
      "amount": "100000.00",
      "account": "GACX...",
      "last_synced": "2024-01-15T10:29:00.000Z"
    },
    {
      "asset": "ARS",
      "amount": "50000000.00",
      "account": "GDE...",
      "last_synced": "2024-01-15T10:29:00.000Z"
    }
  ]
}
```

---

### Payments

#### POST `/payments`

Create a new payment request.

**Authentication:** Bearer JWT Token + API Key

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
x-api-key: <MERCHANT_API_KEY>
```

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "USDC",
  "merchant_id": "merchant_123",
  "reference": "order_456"
}
```

**Response (201):**
```json
{
  "payment_id": "pay_abc123",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00.000Z",
  "expires_at": "2024-01-15T11:30:00.000Z"
}
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid amount",
  "error": "Bad Request"
}
```

#### POST `/payments/confirm`

Confirm a payment after receiving on-chain transaction.

**Authentication:** Bearer JWT Token + API Key

**Request Body:**
```json
{
  "payment_id": "pay_abc123",
  "tx_hash": "0xdeadbeef123..."
}
```

**Response (200):**
```json
{
  "payment_id": "pay_abc123",
  "confirmed": true,
  "tx_hash": "0xdeadbeef123...",
  "confirmed_at": "2024-01-15T10:31:00.000Z"
}
```

#### POST `/payments/mint`

Mint stablecoins after payment confirmation.

**Authentication:** Bearer JWT Token + API Key

**Request Body:**
```json
{
  "merchant_id": "merchant_123",
  "payment_id": "pay_abc123",
  "amount": 100
}
```

**Response (200):**
```json
{
  "status": "success",
  "minted_amount": 100,
  "tx_hash": "0xbeefdead..."
}
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Payment not confirmed",
  "error": "Bad Request"
}
```

---

## Authentication Flows

### JWT Authentication

1. **Login Flow:**
   - Client sends POST to `/auth/login` with `merchant_id` and `api_key`
   - Server validates credentials against database
   - Server returns JWT token with 1-hour expiry

2. **Authenticated Requests:**
   - Include JWT token in `Authorization` header: `Bearer <token>`
   - Include API key in `x-api-key` header

### Token Payload

```json
{
  "sub": "merchant_123",
  "merchant_id": "merchant_123",
  "iat": 1705312200,
  "exp": 1705315800
}
```

### Rate Limiting

All authenticated endpoints are rate-limited:
- **Payments:** 100 requests/minute
- **General:** 1000 requests/minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705315800
```

---

## Error Responses

The API uses standard HTTP status codes and returns errors in the following format:

### Error Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error Type"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Invalid/missing auth |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |
| 503  | Service Unavailable |

### Common Errors

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**401 Unauthorized (Expired Token):**
```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Payment not found",
  "error": "Not Found"
}
```

**429 Too Many Requests:**
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "error": "Too Many Requests"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Webhooks

### Payment Webhook

**Endpoint:** Merchant-provided URL

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256=...
```

**Event Types:**

1. `payment.created`
```json
{
  "type": "payment.created",
  "payment_id": "pay_abc123",
  "amount": 100,
  "currency": "USDC",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

2. `payment.confirmed`
```json
{
  "type": "payment.confirmed",
  "payment_id": "pay_abc123",
  "tx_hash": "0xdeadbeef123...",
  "timestamp": "2024-01-15T10:31:00.000Z"
}
```

3. `payment.failed`
```json
{
  "type": "payment.failed",
  "payment_id": "pay_abc123",
  "reason": "insufficient_balance",
  "timestamp": "2024-01-15T10:31:00.000Z"
}
```

### Webhook Security

Webhooks are signed using HMAC-SHA256. Verify the signature using the webhook secret:

```javascript
const crypto = require('crypto');
const isValid = crypto.createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex') === signature;
```

---

## Testing

```bash
# Run unit tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```