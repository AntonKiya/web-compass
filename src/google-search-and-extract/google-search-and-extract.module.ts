import { Module } from '@nestjs/common';

import { SEARCH_PROVIDER } from '../common/interfaces/search-provider.interface';
import { SearchAndExtractPipeline } from '../common/services/search-and-extract-pipeline.service';
import { ExtractModule } from '../extract/extract.module';
import { GoogleSearchModule } from '../google-search/google-search.module';
import { GoogleSearchService } from '../google-search/google-search.service';

import { GoogleSearchAndExtractController } from './google-search-and-extract.controller';

export const GOOGLE_SEARCH_AND_EXTRACT_PIPELINE =
  'GOOGLE_SEARCH_AND_EXTRACT_PIPELINE';

@Module({
  imports: [GoogleSearchModule, ExtractModule],
  controllers: [GoogleSearchAndExtractController],
  providers: [
    {
      provide: SEARCH_PROVIDER,
      useExisting: GoogleSearchService,
    },
    SearchAndExtractPipeline,
    {
      provide: GOOGLE_SEARCH_AND_EXTRACT_PIPELINE,
      useExisting: SearchAndExtractPipeline,
    },
  ],
  exports: [GOOGLE_SEARCH_AND_EXTRACT_PIPELINE],
})
export class GoogleSearchAndExtractModule {}
