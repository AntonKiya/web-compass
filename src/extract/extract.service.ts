import { Inject, Injectable, Logger } from '@nestjs/common';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

import { ExtractQueryDto } from './dto/extract-query.dto';
import { ExtractResponseDto } from './dto/extract-response.dto';
import { ExtractResultDto } from './dto/extract-result.dto';
import { PageHttpClient } from './interfaces/page-http-client.interface';
import { PAGE_HTTP_CLIENT } from './extract.constants';

@Injectable()
export class ExtractService {
  private readonly logger = new Logger(ExtractService.name);

  constructor(
    @Inject(PAGE_HTTP_CLIENT)
    private readonly pageHttpClient: PageHttpClient,
  ) {}

  async extract(input: ExtractQueryDto): Promise<ExtractResponseDto> {
    this.logger.log(`Extracting content: urls=${input.urls.length}`);

    const settledResults = await Promise.allSettled(
      input.urls.map((url) => this.extractFromUrl(url)),
    );

    const results: ExtractResultDto[] = [];

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        return;
      }

      const url = input.urls[index];
      this.logger.error(
        `Failed to extract "${url}": ${this.getErrorMessage(result.reason)}`,
        result.reason instanceof Error ? result.reason.stack : undefined,
      );
    });

    this.logger.log(
      `Extraction completed: requested=${input.urls.length} extracted=${results.length}`,
    );

    return new ExtractResponseDto(results, {
      requested: input.urls.length,
      extracted: results.length,
    });
  }

  private async extractFromUrl(url: string): Promise<ExtractResultDto> {
    const html = await this.pageHttpClient.fetchHtml(url);
    const dom = new JSDOM(html, { url });

    try {
      const result = new Readability(dom.window.document).parse();

      if (!result?.textContent?.trim()) {
        throw new Error('Readability did not return content');
      }

      return new ExtractResultDto(
        url,
        result.title ?? '',
        result.textContent.trim(),
      );
    } finally {
      dom.window.close();
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown extraction error';
  }
}
