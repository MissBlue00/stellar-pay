import { AnchorService } from './anchor.service';
import { mockFetch } from './test-utils';

describe('AnchorService.fetchTransactionHistory', () => {
  const service = new AnchorService();
  const anchorUrl = 'https://anchor.example.com';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and transforms transaction history successfully', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        transactions: [
          {
            id: 'tx-1',
            type: 'deposit',
            amount: '100.0',
            amount_refunded: '0',
            status: 'completed',
            asset_code: 'USDC',
            source: 'GAAA',
            destination: 'GBBB',
            memo: 'memo',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:10:00Z',
          },
        ],
        next_cursor: 'abc123',
        limit: 1,
        total: 1,
      }),
    });
    (global.fetch as jest.Mock) = fetchMock;

    const result = await service.fetchTransactionHistory({ anchorUrl, asset: 'USDC', limit: 1 });

    expect(result.transactions).toHaveLength(1);
    expect(result.nextCursor).toBe('abc123');
    expect(result.limit).toBe(1);
    expect(result.transactions[0]).toMatchObject({
      id: 'tx-1',
      type: 'deposit',
      amount: 100,
      asset: 'USDC',
      sourceAddress: 'GAAA',
      destinationAddress: 'GBBB',
      memo: 'memo',
      status: 'completed',
      createdAt: '2025-01-01T00:00:00.000Z',
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('asset_code=USDC');
    expect(url).toContain('limit=1');
    expect(options).toMatchObject({
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('applies status filtering and pagination parameters', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ transactions: [], next_cursor: 'cursor-2' }),
    });
    (global.fetch as jest.Mock) = fetchMock;

    await service.fetchTransactionHistory({
      anchorUrl,
      status: 'pending',
      cursor: 'cursor-1',
      limit: 10,
      order: 'asc',
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('status=pending');
    expect(url).toContain('cursor=cursor-1');
    expect(url).toContain('limit=10');
    expect(url).toContain('order=asc');
  });

  it('supports date-range filtering with startDate and endDate', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ records: [], next_cursor: 'cursor-3' }),
    });
    (global.fetch as jest.Mock) = fetchMock;

    await service.fetchTransactionHistory({
      anchorUrl,
      startDate: '2025-01-01T00:00:00Z',
      endDate: new Date('2025-01-10T00:00:00Z'),
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('start_time=2025-01-01T00%3A00%3A00.000Z');
    expect(url).toContain('end_time=2025-01-10T00%3A00%3A00.000Z');
  });

  it('throws when the anchor responds with an HTTP error', async () => {
    const fetchMock = mockFetch({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => ({}),
    });
    (global.fetch as jest.Mock) = fetchMock;

    await expect(service.fetchTransactionHistory({ anchorUrl })).rejects.toThrow(
      'Anchor SEP-6 transaction history request failed: 502 Bad Gateway',
    );
  });

  it('throws when the response payload is not in the expected format', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ unexpected: true }),
    });
    (global.fetch as jest.Mock) = fetchMock;

    await expect(service.fetchTransactionHistory({ anchorUrl })).rejects.toThrow(
      'Unexpected SEP-6 response format',
    );
  });
});
