import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SearchProviderException } from './exceptions/search-provider.exception';
import { SerpApiHttpClient } from './interfaces/serpapi-http-client.interface';
import { SERPAPI_HTTP_CLIENT } from './search.constants';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let searchService: SearchService;
  let httpClient: jest.Mocked<SerpApiHttpClient>;
  let getJsonMock: jest.MockedFunction<SerpApiHttpClient['getJson']>;

  beforeEach(async () => {
    getJsonMock = jest.fn();
    httpClient = {
      getJson: getJsonMock,
    };

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SERPAPI_KEY') {
                return 'test-serpapi-key';
              }

              return undefined;
            }),
          },
        },
        {
          provide: SERPAPI_HTTP_CLIENT,
          useValue: httpClient,
        },
      ],
    }).compile();

    searchService = module.get<SearchService>(SearchService);
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

    const results = await searchService.search({
      query: 'nestjs',
      topK: 2,
      lr: 213,
      familyMode: 1,
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
    expect(requestUrl.searchParams.get('lr')).toBe('213');
    expect(requestUrl.searchParams.get('family_mode')).toBe('1');
    expect(requestUrl.searchParams.get('api_key')).toBe('test-serpapi-key');
  });

  it('throws a readable provider exception when SerpAPI returns an error payload', async () => {
    getJsonMock.mockResolvedValue({
      error: 'Invalid API key',
    });

    await expect(
      searchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(SearchProviderException);
  });

  it('throws a readable provider exception when SerpAPI request fails', async () => {
    getJsonMock.mockRejectedValue(new Error('SerpAPI 500'));

    await expect(
      searchService.search({
        query: 'nestjs',
        topK: 3,
      }),
    ).rejects.toBeInstanceOf(SearchProviderException);
  });
});
