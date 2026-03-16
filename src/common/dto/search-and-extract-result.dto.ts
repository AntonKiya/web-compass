export class SearchAndExtractResultDto {
  constructor(
    public readonly title: string,
    public readonly url: string,
    public readonly snippet: string,
    public readonly position: number,
    public readonly content: string,
  ) {}
}
