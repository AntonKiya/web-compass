import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SearchResultDto } from '../common/dto/search-result.dto';

import { GoogleSearchQueryDto } from './dto/google-search-query.dto';
import { GoogleSearchService } from './google-search.service';

@Controller('search-google')
export class GoogleSearchController {
  constructor(private readonly googleSearchService: GoogleSearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: GoogleSearchQueryDto): Promise<SearchResultDto[]> {
    return this.googleSearchService.search(body);
  }
}
