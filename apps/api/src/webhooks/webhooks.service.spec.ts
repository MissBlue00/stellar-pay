import { BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(() => {
    service = new WebhooksService();
    process.env.WEBHOOK_TIMEOUT_MS = '5000';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.WEBHOOK_TIMEOUT_MS;
  });

  it('creates a standardized payload', () => {
    const payload = service.createPayload(
      'payment.confirmed',
      { paymentId: 'pay_123', amount: '100.00' },
      new Date('2026-03-25T10:00:00.000Z'),
    );

    expect(payload).toEqual({
      event: 'payment.confirmed',
      data: { paymentId: 'pay_123', amount: '100.00' },
      timestamp: '2026-03-25T10:00:00.000Z',
    });
  });

  it('signs webhook payloads when a secret is provided', () => {
    const signature = service.createSignature('{"hello":"world"}', 'top-secret');

    expect(signature).toHaveLength(64);
    expect(signature).toMatch(/^[a-f0-9]+$/);
  });

  it('dispatches a webhook event to a merchant endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: jest.fn().mockResolvedValue('accepted'),
    });

    global.fetch = fetchMock as typeof fetch;

    const delivery = await service.dispatchEvent(
      { url: 'https://merchant.example/webhooks', secret: 'shared-secret' },
      'payment.detected',
      { paymentId: 'pay_456', merchantId: 'm_123' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://merchant.example/webhooks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-stellar-pay-event': 'payment.detected',
          'x-stellar-pay-signature': expect.any(String),
          'x-stellar-pay-timestamp': expect.any(String),
        }),
      }),
    );
    expect(delivery).toEqual({
      endpoint: 'https://merchant.example/webhooks',
      event: 'payment.detected',
      timestamp: expect.any(String),
      ok: true,
      status: 202,
      responseBody: 'accepted',
    });
  });

  it('rejects empty endpoint lists', async () => {
    await expect(
      service.dispatchToEndpoints([], 'payment.created', { paymentId: 'pay_789' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
