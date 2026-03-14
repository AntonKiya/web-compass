import { Injectable } from '@nestjs/common';

import { SerpApiHttpClient } from '../interfaces/serpapi-http-client.interface';

@Injectable()
export class FetchSerpApiHttpClient implements SerpApiHttpClient {
  async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'web-compass/1.0',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `SerpAPI request failed with status ${response.status}: ${body || 'empty response body'}`,
      );
    }

    const payload: unknown = await response.json();

    return payload as T;
  }
}
