import { Module } from '@nestjs/common';

import { ExtractController } from './extract.controller';
import { ExtractService } from './extract.service';
import { PAGE_HTTP_CLIENT } from './extract.constants';
import { FetchPageHttpClient } from './clients/fetch-page-http.client';

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    {
      provide: PAGE_HTTP_CLIENT,
      useClass: FetchPageHttpClient,
    },
  ],
  exports: [ExtractService],
})
export class ExtractModule {}
