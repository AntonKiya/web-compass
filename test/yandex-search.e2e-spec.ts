import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { SERPAPI_HTTP_CLIENT } from '../src/common/constants/serpapi.constants';
import { SerpApiHttpClient } from '../src/common/http/serpapi-http-client.interface';
import { setupApp } from '../src/app.setup';

describe('YandexSearchController (e2e)', () => {
  let app: INestApplication;
  let serpApiHttpClient: jest.Mocked<SerpApiHttpClient>;
  const originalSerpApiKey = process.env.SERPAPI_KEY;

  beforeEach(async () => {
    process.env.SERPAPI_KEY = 'test-serpapi-key';
    serpApiHttpClient = {
      getJson: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SERPAPI_HTTP_CLIENT)
      .useValue(serpApiHttpClient)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  afterAll(() => {
    if (typeof originalSerpApiKey === 'string') {
      process.env.SERPAPI_KEY = originalSerpApiKey;
      return;
    }

    delete process.env.SERPAPI_KEY;
  });

  it('POST /search-yandex returns 200 and normalized results for valid payload', async () => {
    serpApiHttpClient.getJson.mockResolvedValue({
      organic_results: [
        {
          title: 'First result',
          link: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
        },
        {
          title: 'Second result',
          link: 'https://example.com/2',
          snippet: 'Snippet 2',
          position: 2,
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/search-yandex')
      .send({
        query: 'nestjs',
        topK: 2,
        region: 'cis',
      })
      .expect(200)
      .expect([
        {
          title: 'First result',
          url: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
        },
        {
          title: 'Second result',
          url: 'https://example.com/2',
          snippet: 'Snippet 2',
          position: 2,
        },
      ]);
  });

  it('POST /search-yandex returns 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/search-yandex')
      .send({
        query: '',
        topK: 11,
      })
      .expect(400);
  });
});
