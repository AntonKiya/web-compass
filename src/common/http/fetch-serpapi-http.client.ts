import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SerpApiHttpClient } from './serpapi-http-client.interface';

@Injectable()
export class FetchSerpApiHttpClient implements SerpApiHttpClient {
  private readonly logger = new Logger(FetchSerpApiHttpClient.name);
  private readonly requestTimeoutMs: number;
  private readonly userAgent: string;

  constructor(private readonly configService: ConfigService) {
    this.requestTimeoutMs = Number(
      this.configService.getOrThrow<string>('SERPAPI_TIMEOUT_MS'),
    );
    this.userAgent = this.configService.getOrThrow<string>('APP_USER_AGENT');
  }

  async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': this.userAgent,
      },
      signal: AbortSignal.timeout(this.requestTimeoutMs),
    });

    if (!response.ok) {
      this.logger.warn(
        `SerpAPI responded with ${response.status} for url="${url}"`,
      );

      throw new Error(
        `SerpAPI request failed: HTTP ${response.status} ${response.statusText || 'unknown status'}`,
      );
    }

    const payload: unknown = await response.json();

    return payload as T;
  }
}
