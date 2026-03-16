import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ExtractService } from '../../extract/extract.service';
import {
  SEARCH_PROVIDER,
  SearchProvider,
} from '../interfaces/search-provider.interface';

import { SearchAndExtractPipeline } from './search-and-extract-pipeline.service';

describe('SearchAndExtractPipeline', () => {
  let searchAndExtractPipeline: SearchAndExtractPipeline;
  let searchProvider: jest.Mocked<SearchProvider>;
  let extractService: { extract: jest.Mock };
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let loggerWarnSpy: jest.SpiedFunction<Logger['warn']>;

  beforeEach(async () => {
    searchProvider = {
      search: jest.fn(),
    };
    extractService = {
      extract: jest.fn(),
    };
    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAndExtractPipeline,
        {
          provide: SEARCH_PROVIDER,
          useValue: searchProvider,
        },
        {
          provide: ExtractService,
          useValue: extractService,
        },
      ],
    }).compile();

    searchAndExtractPipeline = module.get<SearchAndExtractPipeline>(
      SearchAndExtractPipeline,
    );
  });

  it('returns merged search and extract results sorted by position for a successful pipeline', async () => {
    searchProvider.search.mockResolvedValue([
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

    const response = await searchAndExtractPipeline.run({
      query: 'nestjs',
      topK: 2,
    });

    expect(searchProvider.search.mock.calls).toEqual([
      [
        {
          query: 'nestjs',
          topK: 2,
        },
      ],
    ]);
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
    expect(loggerLogSpy.mock.calls).toEqual(
      expect.arrayContaining([
        ['Pipeline started: query="nestjs" topK=2'],
        ['Pipeline completed: query="nestjs" searched=2 extracted=2'],
      ]),
    );
  });

  it('returns only results that have extracted content when extract is partial', async () => {
    searchProvider.search.mockResolvedValue([
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

    const response = await searchAndExtractPipeline.run({
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
    searchProvider.search.mockResolvedValue([]);

    const response = await searchAndExtractPipeline.run({
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
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Pipeline: search returned no results for query="nestjs"',
    );
  });

  it('calls ExtractService with the URLs from the search results', async () => {
    searchProvider.search.mockResolvedValue([
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

    await searchAndExtractPipeline.run({
      query: 'nestjs',
      topK: 2,
    });

    expect(extractService.extract).toHaveBeenCalledWith({
      urls: ['https://example.com/1', 'https://example.com/2'],
    });
  });

  it('passes region through to the search provider when region is provided', async () => {
    searchProvider.search.mockResolvedValue([]);

    await searchAndExtractPipeline.run({
      query: 'nestjs',
      topK: 2,
      region: 'cis',
    });

    expect(searchProvider.search.mock.calls).toEqual([
      [
        {
          query: 'nestjs',
          topK: 2,
          region: 'cis',
        },
      ],
    ]);
  });
});
