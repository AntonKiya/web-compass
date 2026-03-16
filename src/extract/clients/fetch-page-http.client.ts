import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PageHttpClient } from '../interfaces/page-http-client.interface';

@Injectable()
export class FetchPageHttpClient implements PageHttpClient {
  private readonly logger = new Logger(FetchPageHttpClient.name);
  private readonly requestTimeoutMs: number;
  private readonly userAgent: string;

  constructor(private readonly configService: ConfigService) {
    this.requestTimeoutMs = Number(
      this.configService.getOrThrow<string>('PAGE_FETCH_TIMEOUT_MS'),
    );
    this.userAgent = this.configService.getOrThrow<string>('APP_USER_AGENT');
  }

  async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
      signal: AbortSignal.timeout(this.requestTimeoutMs),
    });

    if (!response.ok) {
      this.logger.warn(
        `Page fetch failed: HTTP ${response.status} url="${url}"`,
      );
      throw new Error(
        `Failed to fetch "${url}": HTTP ${response.status} ${response.statusText || 'unknown status'}`,
      );
    }

    return response.text();
  }
}
