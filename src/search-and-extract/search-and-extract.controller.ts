import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SearchAndExtractQueryDto } from './dto/search-and-extract-query.dto';
import { SearchAndExtractResponseDto } from './dto/search-and-extract-response.dto';
import { SearchAndExtractService } from './search-and-extract.service';

@Controller('search-and-extract')
export class SearchAndExtractController {
  constructor(
    private readonly searchAndExtractService: SearchAndExtractService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() body: SearchAndExtractQueryDto,
  ): Promise<SearchAndExtractResponseDto> {
    return this.searchAndExtractService.searchAndExtract(body);
  }
}
