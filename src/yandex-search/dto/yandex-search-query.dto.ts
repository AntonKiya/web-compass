import { IsEnum, IsOptional } from 'class-validator';

import { SearchQueryBaseDto } from '../../common/dto/search-query-base.dto';

export class YandexSearchQueryDto extends SearchQueryBaseDto {
  @IsOptional()
  @IsEnum(['russia', 'cis'])
  region?: 'russia' | 'cis';
}
