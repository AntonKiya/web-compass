import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SERPAPI_HTTP_CLIENT } from '../common/constants/serpapi.constants';
import { SearchResultDto } from '../common/dto/search-result.dto';
import { SearchProviderException } from '../common/exceptions/search-provider.exception';
import { SerpApiHttpClient } from '../common/http/serpapi-http-client.interface';
import { SearchProvider } from '../common/interfaces/search-provider.interface';

import { YandexSearchQueryDto } from './dto/yandex-search-query.dto';

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
export class YandexSearchService implements SearchProvider {
  private readonly logger = new Logger(YandexSearchService.name);
  private static readonly REGION_MAP: Record<'russia' | 'cis', number> = {
    russia: 225,
    cis: 166,
  };
  private readonly serpApiBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(SERPAPI_HTTP_CLIENT)
    private readonly httpClient: SerpApiHttpClient,
  ) {
    this.serpApiBaseUrl =
      this.configService.getOrThrow<string>('SERPAPI_BASE_URL');
  }

  async search(input: YandexSearchQueryDto): Promise<SearchResultDto[]> {
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

  private buildRequestUrl(input: YandexSearchQueryDto, apiKey: string): URL {
    const url = new URL(this.serpApiBaseUrl);

    url.searchParams.set('engine', 'yandex');
    url.searchParams.set('text', input.query);
    url.searchParams.set('groups_on_page', input.topK.toString());
    url.searchParams.set('output', 'json');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('fix_typo', 'false');
    const regionCode = YandexSearchService.REGION_MAP[input.region ?? 'russia'];
    url.searchParams.set('lr', regionCode.toString());

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
