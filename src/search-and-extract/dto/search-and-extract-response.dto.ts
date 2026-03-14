import { SearchAndExtractResultDto } from './search-and-extract-result.dto';

export interface SearchAndExtractResponseMetaDto {
  requested: number;
  extracted: number;
}

export class SearchAndExtractResponseDto {
  constructor(
    public readonly results: SearchAndExtractResultDto[],
    public readonly meta: SearchAndExtractResponseMetaDto,
  ) {}
}
