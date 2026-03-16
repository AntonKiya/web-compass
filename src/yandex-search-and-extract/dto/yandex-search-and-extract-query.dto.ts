import { IsEnum, IsOptional } from 'class-validator';

import { SearchQueryBaseDto } from '../../common/dto/search-query-base.dto';

export class YandexSearchAndExtractQueryDto extends SearchQueryBaseDto {
  @IsEnum(['russia', 'cis'])
  @IsOptional()
  region?: 'russia' | 'cis';
}
