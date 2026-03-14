import { Test, TestingModule } from '@nestjs/testing';

import { ExtractService } from '../extract/extract.service';
import { SearchService } from '../search/search.service';

import { SearchAndExtractService } from './search-and-extract.service';

describe('SearchAndExtractService', () => {
  let searchAndExtractService: SearchAndExtractService;
  let searchService: { search: jest.Mock };
  let extractService: { extract: jest.Mock };

  beforeEach(async () => {
    searchService = {
      search: jest.fn(),
    };
    extractService = {
      extract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAndExtractService,
        {
          provide: SearchService,
          useValue: searchService,
        },
        {
          provide: ExtractService,
          useValue: extractService,
        },
      ],
    }).compile();

    searchAndExtractService = module.get<SearchAndExtractService>(
      SearchAndExtractService,
    );
  });

  it('returns merged search and extract results sorted by position for a successful pipeline', async () => {
    searchService.search.mockResolvedValue([
      {
        title: 'Second result',
        url: 'https://example.com/2',
        snippet: 'Snippet 2',
        position: 2,
      },
      {
        title: 'First result',
        url: 'https://example.com/1',
        snippet: 'Snippet 1',
        position: 1,
      },
    ]);
    extractService.extract.mockResolvedValue({
      results: [
        {
          url: 'https://example.com/2',
          title: 'Extracted second result',
          content: 'Content 2',
        },
        {
          url: 'https://example.com/1',
          title: 'Extracted first result',
          content: 'Content 1',
        },
      ],
      meta: {
        requested: 2,
        extracted: 2,
      },
    });

    const response = await searchAndExtractService.searchAndExtract({
      query: 'nestjs',
      topK: 2,
    });

    expect(searchService.search).toHaveBeenCalledWith({
      query: 'nestjs',
      topK: 2,
    });
    expect(extractService.extract).toHaveBeenCalledWith({
      urls: ['https://example.com/2', 'https://example.com/1'],
    });
    expect(response).toEqual({
      results: [
        {
          title: 'First result',
          url: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
          content: 'Content 1',
        },
        {
          title: 'Second result',
          url: 'https://example.com/2',
          snippet: 'Snippet 2',
          position: 2,
          content: 'Content 2',
        },
      ],
      meta: {
        requested: 2,
        extracted: 2,
      },
    });
  });

  it('returns only results that have extracted content when extract is partial', async () => {
    searchService.search.mockResolvedValue([
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
    extractService.extract.mockResolvedValue({
      results: [
        {
          url: 'https://example.com/2',
          title: 'Extracted second result',
          content: 'Content 2',
        },
      ],
      meta: {
        requested: 2,
        extracted: 1,
      },
    });

    const response = await searchAndExtractService.searchAndExtract({
      query: 'nestjs',
      topK: 2,
    });

    expect(response).toEqual({
      results: [
        {
          title: 'Second result',
          url: 'https://example.com/2',
          snippet: 'Snippet 2',
          position: 2,
          content: 'Content 2',
        },
      ],
      meta: {
        requested: 2,
        extracted: 1,
      },
    });
  });

  it('returns an empty response when search returns no results', async () => {
    searchService.search.mockResolvedValue([]);

    const response = await searchAndExtractService.searchAndExtract({
      query: 'nestjs',
      topK: 2,
    });

    expect(response).toEqual({
      results: [],
      meta: {
        requested: 0,
        extracted: 0,
      },
    });
    expect(extractService.extract).not.toHaveBeenCalled();
  });

  it('calls ExtractService with the URLs from the search results', async () => {
    searchService.search.mockResolvedValue([
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
    extractService.extract.mockResolvedValue({
      results: [],
      meta: {
        requested: 2,
        extracted: 0,
      },
    });

    await searchAndExtractService.searchAndExtract({
      query: 'nestjs',
      topK: 2,
    });

    expect(extractService.extract).toHaveBeenCalledWith({
      urls: ['https://example.com/1', 'https://example.com/2'],
    });
  });
});
