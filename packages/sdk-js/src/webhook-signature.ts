import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

/**
 * Verify webhook signature securely
 */
export function verifyWebhookSignature(
  payload: string,
  secret: string,
  signature: string,
): boolean {
  if (!signature) return false;

  const expected = signWebhookPayload(payload, secret);

  if (expected.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
}
