import { Module } from '@nestjs/common';

import { SEARCH_PROVIDER } from '../common/interfaces/search-provider.interface';
import { SearchAndExtractPipeline } from '../common/services/search-and-extract-pipeline.service';
import { ExtractModule } from '../extract/extract.module';
import { YandexSearchModule } from '../yandex-search/yandex-search.module';
import { YandexSearchService } from '../yandex-search/yandex-search.service';

import { YandexSearchAndExtractController } from './yandex-search-and-extract.controller';

@Module({
  imports: [YandexSearchModule, ExtractModule],
  controllers: [YandexSearchAndExtractController],
  providers: [
    {
      provide: SEARCH_PROVIDER,
      useExisting: YandexSearchService,
    },
    SearchAndExtractPipeline,
  ],
  exports: [SearchAndExtractPipeline],
})
export class YandexSearchAndExtractModule {}
