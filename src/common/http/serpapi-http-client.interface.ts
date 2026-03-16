export interface SerpApiHttpClient {
  getJson<T>(url: string): Promise<T>;
}
