import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { PAGE_HTTP_CLIENT } from '../src/extract/extract.constants';
import { PageHttpClient } from '../src/extract/interfaces/page-http-client.interface';

const ARTICLE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Example article</title>
  </head>
  <body>
    <main>
      <article>
        <h1>Example article</h1>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
      </article>
    </main>
  </body>
</html>`;

interface ExtractResponseBody {
  results: {
    url: string;
    title: string;
    content: string;
  }[];
  meta: {
    requested: number;
    extracted: number;
  };
}

function isExtractResponseBody(value: unknown): value is ExtractResponseBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    results?: unknown;
    meta?: unknown;
  };

  if (!Array.isArray(candidate.results)) {
    return false;
  }

  if (typeof candidate.meta !== 'object' || candidate.meta === null) {
    return false;
  }

  return candidate.results.every((result) => {
    if (typeof result !== 'object' || result === null) {
      return false;
    }

    const entry = result as {
      url?: unknown;
      title?: unknown;
      content?: unknown;
    };

    return (
      typeof entry.url === 'string' &&
      typeof entry.title === 'string' &&
      typeof entry.content === 'string'
    );
  });
}

describe('ExtractController (e2e)', () => {
  let app: INestApplication;
  let pageHttpClient: jest.Mocked<PageHttpClient>;

  beforeEach(async () => {
    pageHttpClient = {
      fetchHtml: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAGE_HTTP_CLIENT)
      .useValue(pageHttpClient)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  it('POST /extract returns 200 and extracted content for valid URLs', async () => {
    pageHttpClient.fetchHtml.mockResolvedValue(ARTICLE_HTML);

    await request(app.getHttpServer())
      .post('/extract')
      .send({
        urls: ['https://example.com/article'],
      })
      .expect(200)
      .expect((response) => {
        const responseBody: unknown = response.body;

        expect(isExtractResponseBody(responseBody)).toBe(true);

        if (!isExtractResponseBody(responseBody)) {
          throw new Error('Response body does not match ExtractResponseDto');
        }

        const body = responseBody;

        expect(body.meta).toEqual({
          requested: 1,
          extracted: 1,
        });
        expect(body.results).toHaveLength(1);
        expect(body.results[0].url).toBe('https://example.com/article');
        expect(body.results[0].title).toBe('Example article');
        expect(body.results[0].content).toContain('First paragraph.');
        expect(body.results[0].content).toContain('Second paragraph.');
      });
  });

  it('POST /extract returns 400 for an empty URL array', async () => {
    await request(app.getHttpServer())
      .post('/extract')
      .send({
        urls: [],
      })
      .expect(400);
  });

  it('POST /extract returns 400 for more than 10 URLs', async () => {
    await request(app.getHttpServer())
      .post('/extract')
      .send({
        urls: Array.from(
          { length: 11 },
          (_, index) => `https://example.com/${index + 1}`,
        ),
      })
      .expect(400);
  });

  it('POST /extract returns 400 when the URL list contains an invalid URL', async () => {
    await request(app.getHttpServer())
      .post('/extract')
      .send({
        urls: ['https://example.com/article', 'not-a-url'],
      })
      .expect(400);
  });
});
