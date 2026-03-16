import { Logger } from '@nestjs/common';
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

        if (key === 'SERPAPI_TIMEOUT_MS') {
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

  it('logs a warning and throws an informative error for non-ok SerpAPI responses', async () => {
    const loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    } as unknown as Response);
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'APP_USER_AGENT') {
          return 'test-agent/1.0';
        }

        if (key === 'SERPAPI_TIMEOUT_MS') {
          return '1500';
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;
    const client = new FetchSerpApiHttpClient(configService);

    await expect(client.getJson('https://example.com/search')).rejects.toThrow(
      'SerpAPI request failed: HTTP 502 Bad Gateway',
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'SerpAPI responded with 502 for url="https://example.com/search"',
    );
  });
});
