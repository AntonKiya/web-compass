import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SearchAndExtractResponseDto } from '../common/dto/search-and-extract-response.dto';
import { SearchAndExtractPipeline } from '../common/services/search-and-extract-pipeline.service';

import { GoogleSearchAndExtractQueryDto } from './dto/google-search-and-extract-query.dto';

@Controller('search-and-extract-google')
export class GoogleSearchAndExtractController {
  constructor(
    private readonly searchAndExtractPipeline: SearchAndExtractPipeline,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() body: GoogleSearchAndExtractQueryDto,
  ): Promise<SearchAndExtractResponseDto> {
    return this.searchAndExtractPipeline.run({ ...body });
  }
}
