import { ConfigService } from '@nestjs/config';

import { FetchPageHttpClient } from './fetch-page-http.client';

describe('FetchPageHttpClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses configured user agent and timeout for page fetch requests', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<html></html>'),
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
    const client = new FetchPageHttpClient(configService);

    await client.fetchHtml('https://example.com/page');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestedUrl, requestInit] = fetchMock.mock.calls[0];

    expect(requestedUrl).toBe('https://example.com/page');
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(requestInit?.headers).toEqual({
      'User-Agent': 'test-agent/1.0',
    });
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal);
  });
});
