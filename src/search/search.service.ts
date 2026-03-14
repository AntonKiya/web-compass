import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { SearchProviderException } from './exceptions/search-provider.exception';
import { SerpApiHttpClient } from './interfaces/serpapi-http-client.interface';
import { SERPAPI_HTTP_CLIENT } from './search.constants';

interface SerpApiOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
}

interface SerpApiSearchResponse {
  error?: string;
  organic_results?: SerpApiOrganicResult[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private static readonly SERPAPI_URL = 'https://serpapi.com/search';

  constructor(
    private readonly configService: ConfigService,
    @Inject(SERPAPI_HTTP_CLIENT)
    private readonly httpClient: SerpApiHttpClient,
  ) {}

  async search(input: SearchQueryDto): Promise<SearchResultDto[]> {
    const apiKey = this.configService.get<string>('SERPAPI_KEY');

    if (!apiKey) {
      this.logger.error('SERPAPI_KEY is not configured');
      throw new InternalServerErrorException('SERPAPI_KEY is not configured');
    }

    const requestUrl = this.buildRequestUrl(input, apiKey);

    try {
      const payload = await this.httpClient.getJson<SerpApiSearchResponse>(
        requestUrl.toString(),
      );

      if (payload.error) {
        this.logger.error(
          `SerpAPI returned an error for query "${input.query}": ${payload.error}`,
        );
        throw new SearchProviderException();
      }

      return this.mapResults(payload.organic_results ?? [], input.topK);
    } catch (error: unknown) {
      if (error instanceof SearchProviderException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown SerpAPI error';
      this.logger.error(
        `SerpAPI request failed for query "${input.query}": ${message}`,
      );

      throw new SearchProviderException();
    }
  }

  private buildRequestUrl(input: SearchQueryDto, apiKey: string): URL {
    const url = new URL(SearchService.SERPAPI_URL);

    url.searchParams.set('engine', 'yandex');
    url.searchParams.set('text', input.query);
    url.searchParams.set('groups_on_page', input.topK.toString());
    url.searchParams.set('output', 'json');
    url.searchParams.set('api_key', apiKey);

    if (typeof input.lr === 'number') {
      url.searchParams.set('lr', input.lr.toString());
    }

    if (typeof input.familyMode === 'number') {
      url.searchParams.set('family_mode', input.familyMode.toString());
    }

    return url;
  }

  private mapResults(
    organicResults: SerpApiOrganicResult[],
    topK: number,
  ): SearchResultDto[] {
    return organicResults.slice(0, topK).flatMap((result, index) => {
      if (typeof result.title !== 'string' || typeof result.link !== 'string') {
        return [];
      }

      return [
        new SearchResultDto(
          result.title.trim(),
          result.link,
          typeof result.snippet === 'string' ? result.snippet.trim() : '',
          typeof result.position === 'number' ? result.position : index + 1,
        ),
      ];
    });
  }
}
