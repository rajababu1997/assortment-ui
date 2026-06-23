export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiEndpoint {
  url: string;
  type: HttpMethod;
  paramList?: string[];
  baseUrl?: string;
  externalUrl?: string;
}

export type UrlParams = Record<string, string | number | undefined>;
