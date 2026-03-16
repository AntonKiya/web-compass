import { Module } from '@nestjs/common';

import { SERPAPI_HTTP_CLIENT } from '../common/constants/serpapi.constants';
import { FetchSerpApiHttpClient } from '../common/http/fetch-serpapi-http.client';

import { GoogleSearchController } from './google-search.controller';
import { GoogleSearchService } from './google-search.service';

@Module({
  controllers: [GoogleSearchController],
  providers: [
    GoogleSearchService,
    {
      provide: SERPAPI_HTTP_CLIENT,
      useClass: FetchSerpApiHttpClient,
    },
  ],
  exports: [GoogleSearchService],
})
export class GoogleSearchModule {}
