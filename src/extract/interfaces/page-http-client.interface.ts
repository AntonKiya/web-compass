export interface PageHttpClient {
  fetchHtml(url: string): Promise<string>;
}
