import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SearchResultDto } from '../common/dto/search-result.dto';

import { YandexSearchQueryDto } from './dto/yandex-search-query.dto';
import { YandexSearchService } from './yandex-search.service';

@Controller('search-yandex')
export class YandexSearchController {
  constructor(private readonly yandexSearchService: YandexSearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: YandexSearchQueryDto): Promise<SearchResultDto[]> {
    return this.yandexSearchService.search(body);
  }
}
