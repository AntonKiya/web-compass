export class ExtractResultDto {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly content: string,
  ) {}
}
