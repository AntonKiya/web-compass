import { Module } from '@nestjs/common';

import { SERPAPI_HTTP_CLIENT } from '../common/constants/serpapi.constants';
import { FetchSerpApiHttpClient } from '../common/http/fetch-serpapi-http.client';
import { YandexSearchController } from './yandex-search.controller';
import { YandexSearchService } from './yandex-search.service';

@Module({
  controllers: [YandexSearchController],
  providers: [
    YandexSearchService,
    {
      provide: SERPAPI_HTTP_CLIENT,
      useClass: FetchSerpApiHttpClient,
    },
  ],
  exports: [YandexSearchService],
})
export class YandexSearchModule {}
