import { Inject, Injectable } from '@nestjs/common';

import {
  SEARCH_PROVIDER,
  SearchProvider,
} from '../interfaces/search-provider.interface';
import { SearchAndExtractResponseDto } from '../dto/search-and-extract-response.dto';
import { SearchAndExtractResultDto } from '../dto/search-and-extract-result.dto';
import { ExtractService } from '../../extract/extract.service';

@Injectable()
export class SearchAndExtractPipeline {
  constructor(
    @Inject(SEARCH_PROVIDER)
    private readonly searchProvider: SearchProvider,
    private readonly extractService: ExtractService,
  ) {}

  async run(input: {
    query: string;
    topK: number;
    region?: 'russia' | 'cis';
  }): Promise<SearchAndExtractResponseDto> {
    const searchResults = await this.searchProvider.search({
      query: input.query,
      topK: input.topK,
      region: input.region,
    });

    if (searchResults.length === 0) {
      return new SearchAndExtractResponseDto([], {
        requested: 0,
        extracted: 0,
      });
    }

    const urls = searchResults.map((result) => result.url);
    const extractResponse = await this.extractService.extract({ urls });
    const searchResultsByUrl = new Map(
      searchResults.map((result) => [result.url, result]),
    );

    const results = extractResponse.results
      .flatMap((extractResult) => {
        const searchResult = searchResultsByUrl.get(extractResult.url);

        if (!searchResult) {
          return [];
        }

        return [
          new SearchAndExtractResultDto(
            searchResult.title,
            searchResult.url,
            searchResult.snippet,
            searchResult.position,
            extractResult.content,
          ),
        ];
      })
      .sort((left, right) => left.position - right.position);

    return new SearchAndExtractResponseDto(results, {
      requested: urls.length,
      extracted: results.length,
    });
  }
}
