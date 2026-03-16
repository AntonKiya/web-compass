import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class YandexSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  topK!: number;

  @IsOptional()
  @IsEnum(['russia', 'cis'])
  region?: 'russia' | 'cis';
}
