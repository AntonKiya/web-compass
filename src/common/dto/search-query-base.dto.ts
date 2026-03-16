import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class SearchQueryBaseDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  topK!: number;
}
