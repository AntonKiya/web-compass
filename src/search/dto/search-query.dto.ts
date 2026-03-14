import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  topK!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  lr?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1, 2])
  familyMode?: 0 | 1 | 2;
}
