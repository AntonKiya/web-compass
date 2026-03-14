import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async search(@Body() body: SearchQueryDto): Promise<SearchResultDto[]> {
    return this.searchService.search(body);
  }
}
