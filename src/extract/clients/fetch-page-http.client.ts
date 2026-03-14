import { Injectable } from '@nestjs/common';

import { PageFetchException } from '../exceptions/page-fetch.exception';
import { PageHttpClient } from '../interfaces/page-http-client.interface';

@Injectable()
export class FetchPageHttpClient implements PageHttpClient {
  async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'web-compass/1.0',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new PageFetchException();
    }

    return response.text();
  }
}
