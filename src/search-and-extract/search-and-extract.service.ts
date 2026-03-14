import { Injectable } from '@nestjs/common';

import { ExtractService } from '../extract/extract.service';
import { SearchService } from '../search/search.service';

import { SearchAndExtractQueryDto } from './dto/search-and-extract-query.dto';
import { SearchAndExtractResponseDto } from './dto/search-and-extract-response.dto';
import { SearchAndExtractResultDto } from './dto/search-and-extract-result.dto';

@Injectable()
export class SearchAndExtractService {
  constructor(
    private readonly searchService: SearchService,
    private readonly extractService: ExtractService,
  ) {}

  async searchAndExtract(
    input: SearchAndExtractQueryDto,
  ): Promise<SearchAndExtractResponseDto> {
    const searchResults = await this.searchService.search({
      query: input.query,
      topK: input.topK,
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
