import { ConfigService } from '@nestjs/config';

import { FetchSerpApiHttpClient } from './fetch-serpapi-http.client';

describe('FetchSerpApiHttpClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses configured user agent and timeout for SerpAPI requests', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true }),
    } as unknown as Response);
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'APP_USER_AGENT') {
          return 'test-agent/1.0';
        }

        if (key === 'PAGE_FETCH_TIMEOUT_MS') {
          return '1500';
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;
    const client = new FetchSerpApiHttpClient(configService);

    await client.getJson('https://example.com/search');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestedUrl, requestInit] = fetchMock.mock.calls[0];

    expect(requestedUrl).toBe('https://example.com/search');
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(requestInit?.headers).toEqual({
      Accept: 'application/json',
      'User-Agent': 'test-agent/1.0',
    });
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal);
  });
});
