import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ExtractQueryDto } from './dto/extract-query.dto';
import { PageHttpClient } from './interfaces/page-http-client.interface';
import { PAGE_HTTP_CLIENT } from './extract.constants';
import { ExtractService } from './extract.service';

interface MockDocument {
  html: string;
}

interface MockParsedArticle {
  title?: string;
  content?: string;
  textContent?: string;
}

const closeMock = jest.fn();
const parseMock = jest.fn<MockParsedArticle | null, [MockDocument]>();

jest.mock('jsdom', () => ({
  JSDOM: class {
    public readonly window: { document: MockDocument; close: typeof closeMock };

    constructor(html: string) {
      this.window = {
        document: { html },
        close: closeMock,
      };
    }
  },
}));

jest.mock('@mozilla/readability', () => ({
  Readability: class {
    constructor(private readonly document: MockDocument) {}

    parse() {
      return parseMock(this.document);
    }
  },
}));

describe('ExtractService', () => {
  let extractService: ExtractService;
  let pageHttpClient: jest.Mocked<PageHttpClient>;
  let fetchHtmlMock: jest.MockedFunction<PageHttpClient['fetchHtml']>;
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let loggerErrorSpy: jest.SpiedFunction<Logger['error']>;

  beforeEach(async () => {
    fetchHtmlMock = jest.fn();
    pageHttpClient = {
      fetchHtml: fetchHtmlMock,
    };

    closeMock.mockClear();
    parseMock.mockReset();
    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractService,
        {
          provide: PAGE_HTTP_CLIENT,
          useValue: pageHttpClient,
        },
      ],
    }).compile();

    extractService = module.get<ExtractService>(ExtractService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extracts content from a single page successfully', async () => {
    fetchHtmlMock.mockResolvedValue('<html><body>Article</body></html>');
    parseMock.mockReturnValue({
      title: 'Example article',
      content: '<article>First paragraph. Second paragraph.</article>',
      textContent: 'First paragraph.\nSecond paragraph.',
    });

    const response = await extractService.extract({
      urls: ['https://example.com/article'],
    });

    expect(fetchHtmlMock).toHaveBeenCalledWith('https://example.com/article');
    expect(response.meta).toEqual({
      requested: 1,
      extracted: 1,
    });
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      url: 'https://example.com/article',
      title: 'Example article',
    });
    expect(response.results[0].content).toContain('First paragraph.');
    expect(response.results[0].content).toContain('Second paragraph.');
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(loggerLogSpy.mock.calls).toEqual(
      expect.arrayContaining([
        ['Extracting content: urls=1'],
        ['Extraction completed: requested=1 extracted=1'],
      ]),
    );
  });

  it('keeps only successful results when one of the URLs fails', async () => {
    fetchHtmlMock.mockImplementation((url: string) => {
      if (url === 'https://example.com/fail') {
        return Promise.reject(new Error('Request timed out'));
      }

      return Promise.resolve('<html><body>Article</body></html>');
    });
    parseMock.mockReturnValue({
      title: 'Example article',
      content: '<article>First paragraph. Second paragraph.</article>',
      textContent: 'First paragraph.\nSecond paragraph.',
    });

    const response = await extractService.extract({
      urls: ['https://example.com/fail', 'https://example.com/article'],
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].url).toBe('https://example.com/article');
    expect(response.meta).toEqual({
      requested: 2,
      extracted: 1,
    });
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Failed to extract "https://example.com/fail": Request timed out',
      expect.any(String),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Extraction completed: requested=2 extracted=1',
    );
  });

  it('returns an empty result list when all URLs fail', async () => {
    fetchHtmlMock.mockRejectedValue(new Error('Network error'));

    const response = await extractService.extract({
      urls: ['https://example.com/1', 'https://example.com/2'],
    });

    expect(response).toEqual({
      results: [],
      meta: {
        requested: 2,
        extracted: 0,
      },
    });
    expect(loggerErrorSpy).toHaveBeenCalledTimes(2);
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Extraction completed: requested=2 extracted=0',
    );
  });
});

describe('ExtractQueryDto validation', () => {
  it('rejects payloads with more than 10 URLs', async () => {
    const validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    const urls = Array.from(
      { length: 11 },
      (_, index) => `https://example.com/${index + 1}`,
    );

    await expect(
      validationPipe.transform(
        { urls },
        {
          type: 'body',
          metatype: ExtractQueryDto,
          data: '',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
