export class SearchResultDto {
  constructor(
    public readonly title: string,
    public readonly url: string,
    public readonly snippet: string,
    public readonly position: number,
  ) {}
}
