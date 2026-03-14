import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { ExtractService } from '../src/extract/extract.service';
import { SearchService } from '../src/search/search.service';

describe('SearchAndExtractController (e2e)', () => {
  let app: INestApplication;
  let searchService: { search: jest.Mock };
  let extractService: { extract: jest.Mock };

  beforeEach(async () => {
    searchService = {
      search: jest.fn(),
    };
    extractService = {
      extract: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SearchService)
      .useValue(searchService)
      .overrideProvider(ExtractService)
      .useValue(extractService)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  it('POST /search-and-extract returns 200 and merged results for valid payload', async () => {
    searchService.search.mockResolvedValue([
      {
        title: 'Second result',
        url: 'https://example.com/2',
        snippet: 'Snippet 2',
        position: 2,
      },
      {
        title: 'First result',
        url: 'https://example.com/1',
        snippet: 'Snippet 1',
        position: 1,
      },
    ]);
    extractService.extract.mockResolvedValue({
      results: [
        {
          url: 'https://example.com/2',
          title: 'Extracted second result',
          content: 'Content 2',
        },
        {
          url: 'https://example.com/1',
          title: 'Extracted first result',
          content: 'Content 1',
        },
      ],
      meta: {
        requested: 2,
        extracted: 2,
      },
    });

    await request(app.getHttpServer())
      .post('/search-and-extract')
      .send({
        query: 'nestjs',
        topK: 2,
      })
      .expect(200)
      .expect({
        results: [
          {
            title: 'First result',
            url: 'https://example.com/1',
            snippet: 'Snippet 1',
            position: 1,
            content: 'Content 1',
          },
          {
            title: 'Second result',
            url: 'https://example.com/2',
            snippet: 'Snippet 2',
            position: 2,
            content: 'Content 2',
          },
        ],
        meta: {
          requested: 2,
          extracted: 2,
        },
      });
  });

  it('POST /search-and-extract returns 400 when query is missing', async () => {
    await request(app.getHttpServer())
      .post('/search-and-extract')
      .send({
        topK: 2,
      })
      .expect(400);
  });

  it('POST /search-and-extract returns 400 when topK is greater than 10', async () => {
    await request(app.getHttpServer())
      .post('/search-and-extract')
      .send({
        query: 'nestjs',
        topK: 11,
      })
      .expect(400);
  });
});
