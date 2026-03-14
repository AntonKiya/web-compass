import { Module } from '@nestjs/common';

import { ExtractModule } from '../extract/extract.module';
import { SearchModule } from '../search/search.module';

import { SearchAndExtractController } from './search-and-extract.controller';
import { SearchAndExtractService } from './search-and-extract.service';

@Module({
  imports: [SearchModule, ExtractModule],
  controllers: [SearchAndExtractController],
  providers: [SearchAndExtractService],
  exports: [SearchAndExtractService],
})
export class SearchAndExtractModule {}
