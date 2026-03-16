import { SearchResultDto } from '../dto/search-result.dto';

export interface SearchProvider {
  search(input: {
    query: string;
    topK: number;
    region?: 'russia' | 'cis';
  }): Promise<SearchResultDto[]>;
}

export const SEARCH_PROVIDER = 'SEARCH_PROVIDER';
