import { SearchResultDto } from '../dto/search-result.dto';

export interface SearchProvider {
  search(input: {
    query: string;
    topK: number;
    [key: string]: unknown;
  }): Promise<SearchResultDto[]>;
}

export const SEARCH_PROVIDER = 'SEARCH_PROVIDER';
