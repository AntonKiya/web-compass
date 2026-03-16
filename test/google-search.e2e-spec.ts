import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { SERPAPI_HTTP_CLIENT } from '../src/common/constants/serpapi.constants';
import { SerpApiHttpClient } from '../src/common/http/serpapi-http-client.interface';
import { createTestApp } from './helpers/create-test-app.helper';

describe('GoogleSearchController (e2e)', () => {
  let app: INestApplication;
  let serpApiHttpClient: jest.Mocked<SerpApiHttpClient>;

  beforeAll(async () => {
    serpApiHttpClient = {
      getJson: jest.fn(),
    };
    app = await createTestApp([
      {
        token: SERPAPI_HTTP_CLIENT,
        value: serpApiHttpClient,
      },
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /search-google returns 200 and normalized results for valid payload', async () => {
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
      .post('/search-google')
      .send({
        query: 'nestjs',
        topK: 2,
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

  it('POST /search-google returns 400 when query is missing', async () => {
    await request(app.getHttpServer())
      .post('/search-google')
      .send({
        topK: 2,
      })
      .expect(400);
  });

  it('POST /search-google returns 400 when topK is greater than 10', async () => {
    await request(app.getHttpServer())
      .post('/search-google')
      .send({
        query: 'nestjs',
        topK: 11,
      })
      .expect(400);
  });
});
