import { ArrayMaxSize, ArrayMinSize, IsArray, IsUrl } from 'class-validator';

export class ExtractQueryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  urls!: string[];
}
