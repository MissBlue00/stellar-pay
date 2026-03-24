# Webhook Signature Verification

Stellar Pay signs webhook payloads using HMAC-SHA256 and includes the result in the `x-stellarpay-signature` header.

## How it works

1. Payload is converted to a string
2. HMAC-SHA256 is generated using the merchant secret
3. Signature is sent in `x-stellarpay-signature` header

## Verification Example

```ts
import { verifyWebhookSignature } from '@stellar-pay/sdk-js';

const isValid = verifyWebhookSignature(rawBody, merchantSecret, signatureHeader);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```
