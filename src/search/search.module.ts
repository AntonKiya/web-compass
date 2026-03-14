import { Module } from '@nestjs/common';

import { FetchSerpApiHttpClient } from './clients/fetch-serpapi-http.client';
import { SERPAPI_HTTP_CLIENT } from './search.constants';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    {
      provide: SERPAPI_HTTP_CLIENT,
      useClass: FetchSerpApiHttpClient,
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
