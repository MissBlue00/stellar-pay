export function mockFetch(
  response: Partial<Response> & { json?: () => Promise<unknown> },
): jest.MockedFunction<() => Promise<Response>> {
  return jest.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    statusText: response.statusText ?? 'OK',
    json: response.json ?? (async () => ({})),
  } as Response);
}
