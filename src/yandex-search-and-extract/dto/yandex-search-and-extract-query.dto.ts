import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class YandexSearchAndExtractQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  topK!: number;

  @IsEnum(['russia', 'cis'])
  @IsOptional()
  region?: 'russia' | 'cis';
}
