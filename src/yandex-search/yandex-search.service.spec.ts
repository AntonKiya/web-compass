import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SERPAPI_HTTP_CLIENT } from '../common/constants/serpapi.constants';
import { SearchProviderException } from '../common/exceptions/search-provider.exception';
import { SerpApiHttpClient } from '../common/http/serpapi-http-client.interface';
import { YandexSearchService } from './yandex-search.service';

describe('YandexSearchService', () => {
  let yandexSearchService: YandexSearchService;
  let httpClient: jest.Mocked<SerpApiHttpClient>;
  let getJsonMock: jest.MockedFunction<SerpApiHttpClient['getJson']>;
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let loggerErrorSpy: jest.SpiedFunction<Logger['error']>;

  beforeEach(async () => {
    getJsonMock = jest.fn();
    httpClient = {
      getJson: getJsonMock,
    };

    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexSearchService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'SERPAPI_KEY') {
                return 'test-serpapi-key';
              }

              if (key === 'SERPAPI_BASE_URL') {
                return 'https://serpapi.com/search';
              }

              throw new Error(`Unexpected config key: ${key}`);
            }),
          },
        },
        {
          provide: SERPAPI_HTTP_CLIENT,
          useValue: httpClient,
        },
      ],
    }).compile();

    yandexSearchService = module.get<YandexSearchService>(YandexSearchService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns normalized search results for a successful SerpAPI request', async () => {
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

    const results = await yandexSearchService.search({
      query: 'nestjs',
      topK: 2,
      region: 'cis',
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

    expect(getJsonMock).toHaveBeenCalledTimes(1);

    const requestUrl = new URL(getJsonMock.mock.calls[0][0]);
    expect(requestUrl.origin + requestUrl.pathname).toBe(
      'https://serpapi.com/search',
    );
    expect(requestUrl.searchParams.get('engine')).toBe('yandex');
    expect(requestUrl.searchParams.get('text')).toBe('nestjs');
    expect(requestUrl.searchParams.get('groups_on_page')).toBe('2');
    expect(requestUrl.searchParams.get('lr')).toBe('166');
    expect(requestUrl.searchParams.get('api_key')).toBe('test-serpapi-key');
    expect(requestUrl.searchParams.get('fix_typo')).toBe('false');
    expect(loggerLogSpy.mock.calls).toEqual(
      expect.arrayContaining([
        ['Searching Yandex: query="nestjs" topK=2 region=cis'],
        ['Yandex search completed: query="nestjs" returned 2 results'],
      ]),
    );
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

    const results = await yandexSearchService.search({
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

  it('throws a readable provider exception when SerpAPI returns an error payload', async () => {
    getJsonMock.mockResolvedValue({
      error: 'Invalid API key',
    });

    await expect(
      yandexSearchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(SearchProviderException);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Yandex SerpAPI error: query="nestjs" error="Invalid API key"',
    );
  });

  it('throws a readable provider exception when SerpAPI request fails', async () => {
    getJsonMock.mockRejectedValue(new Error('SerpAPI 500'));

    await expect(
      yandexSearchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(SearchProviderException);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Yandex SerpAPI request failed: query="nestjs" cause="SerpAPI 500"',
    );
  });
});
