import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ExtractQueryDto } from './dto/extract-query.dto';
import { ExtractResponseDto } from './dto/extract-response.dto';
import { ExtractService } from './extract.service';

@Controller('extract')
export class ExtractController {
  constructor(private readonly extractService: ExtractService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: ExtractQueryDto): Promise<ExtractResponseDto> {
    return this.extractService.extract(body);
  }
}
