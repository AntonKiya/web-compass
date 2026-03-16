import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SERPAPI_HTTP_CLIENT } from '../common/constants/serpapi.constants';
import { SearchProviderException } from '../common/exceptions/search-provider.exception';
import { SerpApiHttpClient } from '../common/http/serpapi-http-client.interface';

import { GoogleSearchService } from './google-search.service';

describe('GoogleSearchService', () => {
  let googleSearchService: GoogleSearchService;
  let httpClient: jest.Mocked<SerpApiHttpClient>;
  let getJsonMock: jest.MockedFunction<SerpApiHttpClient['getJson']>;
  let configService: { getOrThrow: jest.Mock };
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let loggerDebugSpy: jest.SpiedFunction<Logger['debug']>;
  let loggerErrorSpy: jest.SpiedFunction<Logger['error']>;

  beforeEach(async () => {
    getJsonMock = jest.fn();
    httpClient = {
      getJson: getJsonMock,
    };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SERPAPI_KEY') {
          return 'test-serpapi-key';
        }

        if (key === 'SERPAPI_BASE_URL') {
          return 'https://serpapi.com/search';
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    };

    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    loggerDebugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleSearchService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: SERPAPI_HTTP_CLIENT,
          useValue: httpClient,
        },
      ],
    }).compile();

    googleSearchService = module.get<GoogleSearchService>(GoogleSearchService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns normalized Google search results for a successful SerpAPI request', async () => {
    getJsonMock.mockResolvedValue({
      organic_results: [
        {
          title: ' First result ',
          link: 'https://example.com/1',
          snippet: ' Snippet 1 ',
          position: 1,
        },
        {
          title: 'Second result',
          link: 'https://example.com/2',
          snippet: 'Snippet 2',
          position: 2,
        },
      ],
    });

    const results = await googleSearchService.search({
      query: 'nestjs',
      topK: 2,
    });

    expect(results).toEqual([
      {
        title: 'First result',
        url: 'https://example.com/1',
        snippet: 'Snippet 1',
        position: 1,
      },
      {
        title: 'Second result',
        url: 'https://example.com/2',
        snippet: 'Snippet 2',
        position: 2,
      },
    ]);

    const requestUrl = new URL(getJsonMock.mock.calls[0][0]);
    expect(requestUrl.origin + requestUrl.pathname).toBe(
      'https://serpapi.com/search',
    );
    expect(requestUrl.searchParams.get('engine')).toBe('google');
    expect(requestUrl.searchParams.get('q')).toBe('nestjs');
    expect(requestUrl.searchParams.get('num')).toBe('2');
    expect(requestUrl.searchParams.get('output')).toBe('json');
    expect(requestUrl.searchParams.get('api_key')).toBe('test-serpapi-key');
    expect(requestUrl.searchParams.get('gl')).toBe('us');
    expect(requestUrl.searchParams.get('hl')).toBe('en');
    expect(loggerLogSpy.mock.calls).toEqual(
      expect.arrayContaining([
        ['Searching Google: query="nestjs" topK=2'],
        ['Google search completed: query="nestjs" returned 2 results'],
      ]),
    );
    expect(loggerDebugSpy).toHaveBeenCalledWith(
      'Google raw organic_results count: 2',
    );
  });

  it('throws a readable provider exception when SerpAPI returns an error payload', async () => {
    getJsonMock.mockResolvedValue({
      error: 'Invalid API key',
    });

    await expect(
      googleSearchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(SearchProviderException);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Google SerpAPI error: query="nestjs" error="Invalid API key"',
    );
  });

  it('propagates the config error when SERPAPI_KEY is missing', async () => {
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'SERPAPI_KEY') {
        throw new Error('SERPAPI_KEY is not configured');
      }

      if (key === 'SERPAPI_BASE_URL') {
        return 'https://serpapi.com/search';
      }

      throw new Error(`Unexpected config key: ${key}`);
    });

    await expect(
      googleSearchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toThrow('SERPAPI_KEY is not configured');
  });

  it('returns no more than topK results even if SerpAPI responds with more items', async () => {
    getJsonMock.mockResolvedValue({
      organic_results: [
        {
          title: 'First result',
          link: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
        },
        {
          title: 'Second result',
          link: 'https://example.com/2',
          snippet: 'Snippet 2',
          position: 2,
        },
        {
          title: 'Third result',
          link: 'https://example.com/3',
          snippet: 'Snippet 3',
          position: 3,
        },
      ],
    });

    const results = await googleSearchService.search({
      query: 'nestjs',
      topK: 2,
    });

    expect(results).toEqual([
      {
        title: 'First result',
        url: 'https://example.com/1',
        snippet: 'Snippet 1',
        position: 1,
      },
      {
        title: 'Second result',
        url: 'https://example.com/2',
        snippet: 'Snippet 2',
        position: 2,
      },
    ]);
  });

  it('logs a readable provider error when the SerpAPI request fails', async () => {
    getJsonMock.mockRejectedValue(new Error('SerpAPI 500'));

    await expect(
      googleSearchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(SearchProviderException);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Google SerpAPI request failed: query="nestjs" cause="SerpAPI 500"',
    );
  });
});
