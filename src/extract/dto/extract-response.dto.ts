import { ExtractResultDto } from './extract-result.dto';

export interface ExtractResponseMetaDto {
  requested: number;
  extracted: number;
}

export class ExtractResponseDto {
  constructor(
    public readonly results: ExtractResultDto[],
    public readonly meta: ExtractResponseMetaDto,
  ) {}
}
