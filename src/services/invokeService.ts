/**
 * API invocation layer — 5 functions mirroring Angular's InvokeService.
 *
 * Functions:
 *   invokeService()        — Standard JSON GET/POST/PUT/DELETE
 *   uploadService()        — File/image upload → JSON response
 *   getImageService()      — Fetch image as blob URL
 *   getImageBase64Service() — Fetch image as base64 data URL
 *   downloadFileService()  — Download file + save to disk
 *
 * Shared buildUrl() helper handles URL building + param replacement.
 * Headers are handled by apiClient interceptor — not repeated here.
 * Config is never mutated — params passed as arguments.
 */

import { apiClient, edgeApiClient } from '@/lib/axios';
import { environment } from '@/config/environment';
import type { ApiEndpoint, UrlParams } from '@/constants/apiConfig.types';

// ── Shared URL builder ─────────────────────────────────────────────────────

/**
 * Build the full request URL from an endpoint config + optional params.
 *
 * 1. Resolves base URL: externalUrl > baseUrl key > environment.apiUrl
 * 2. Replaces `{param}` placeholders with values from `params`
 *
 * Config is never mutated — safe for concurrent use.
 */
export function buildUrl(endpoint: ApiEndpoint, params?: UrlParams): string {
  // Resolve base URL
  let base: string;
  if (endpoint.externalUrl) {
    base = endpoint.externalUrl;
  } else if (endpoint.baseUrl) {
    base = ((environment as Record<string, unknown>)[endpoint.baseUrl] as string) || environment.apiUrl;
  } else {
    base = environment.apiUrl;
  }

  // Ensure base ends with /
  if (!base.endsWith('/')) base += '/';

  // Replace {param} placeholders in URL.
  // Uses String(value) so undefined becomes "undefined" — matches Angular InvokeService
  // behaviour where JS string coercion is applied directly to paramList values.
  let url = endpoint.url;
  if (params && endpoint.paramList) {
    for (const key of endpoint.paramList) {
      const value = params[key];
      url = url.replace(`{${key}}`, String(value));
    }
  }

  return `${base}${url}`;
}

// ── 1. Standard JSON requests ──────────────────────────────────────────────

/**
 * Standard API call for JSON GET/POST/PUT/DELETE.
 *
 * @param endpoint  API_CONFIG endpoint definition
 * @param params    URL path parameters (e.g., `{ uuid: 'abc123' }`)
 * @param payload   Request body (for POST/PUT/PATCH)
 * @param query     Query string parameters (appended as ?key=value)
 * @param signal    Optional AbortSignal for cancellation
 * @returns         Response data (unwrapped from AxiosResponse)
 */
export async function invokeService<T = unknown>(
  endpoint: ApiEndpoint,
  params?: UrlParams,
  payload?: unknown,
  query?: Record<string, string | number | boolean>,
  signal?: AbortSignal
): Promise<T> {
  const url = buildUrl(endpoint, params);
  // Edge API returns Access-Control-Allow-Origin: * so withCredentials must be false
  const client = endpoint.baseUrl === 'edgeApiUrl' ? edgeApiClient : apiClient;

  switch (endpoint.type) {
    case 'GET': {
      const { data } = await client.get<T>(url, { params: query, signal });
      return data;
    }
    case 'POST': {
      const { data } = await client.post<T>(url, payload, { params: query, signal });
      return data;
    }
    case 'PUT': {
      const { data } = await client.put<T>(url, payload, { params: query, signal });
      return data;
    }
    case 'DELETE': {
      const { data } = await client.delete<T>(url, { params: query, data: payload, signal });
      return data;
    }
    case 'PATCH': {
      const { data } = await client.patch<T>(url, payload, { params: query, signal });
      return data;
    }
    default:
      throw new Error(`Unsupported HTTP method: ${endpoint.type}`);
  }
}

// ── 2. File/image upload ───────────────────────────────────────────────────

/**
 * Upload files (FormData) and receive JSON response.
 * Merges Angular's uploadAttachments + addDocumentWithJsonResponse + uploadImage.
 *
 * @param endpoint  API_CONFIG endpoint
 * @param params    URL path parameters
 * @param formData  FormData with files
 * @param method    Override HTTP method (default: endpoint.type or POST)
 * @param query     Query string parameters (appended as ?key=value)
 * @param signal    Optional AbortSignal for cancellation
 * @returns         JSON response
 */
export async function uploadService<T = unknown>(
  endpoint: ApiEndpoint,
  params: UrlParams | undefined,
  formData: FormData,
  method?: 'POST' | 'PUT',
  query?: Record<string, string | number | boolean>,
  signal?: AbortSignal
): Promise<T> {
  const url = buildUrl(endpoint, params);
  const httpMethod = method ?? (endpoint.type as 'POST' | 'PUT') ?? 'POST';

  const { data } = await apiClient.request<T>({
    url,
    method: httpMethod,
    data: formData,
    params: query,
    signal,
    // Do NOT set Content-Type — let the browser/XHR set multipart/form-data with the
    // correct boundary automatically. An explicit header without a boundary causes
    // the server to fail parsing the multipart body (500 Internal Server Error).
    headers: { 'Content-Type': undefined },
  });
  return data;
}

// ── 3. Fetch image as blob URL ─────────────────────────────────────────────

/**
 * Fetch image as a blob and return an object URL for <img src>.
 * Merges Angular's getImage + getImageBlob.
 *
 * @param endpoint  API_CONFIG endpoint
 * @param params    URL path parameters
 * @returns         Object URL (call URL.revokeObjectURL when done)
 */
export async function getImageService(endpoint: ApiEndpoint, params?: UrlParams): Promise<string> {
  const url = buildUrl(endpoint, params);
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' });
  return URL.createObjectURL(data);
}

// ── 4. Fetch image as base64 data URL ──────────────────────────────────────

/**
 * Fetch image and return as base64 data URL.
 * Merges Angular's getImageBase64 + getPreviewImageBase64.
 *
 * @param endpoint  API_CONFIG endpoint
 * @param params    URL path parameters
 * @returns         base64 data URL (e.g., `data:image/png;base64,...`)
 */
export async function getImageBase64Service(endpoint: ApiEndpoint, params?: UrlParams): Promise<string> {
  const url = buildUrl(endpoint, params);
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });
}

// ── 5. Download file + save to disk ────────────────────────────────────────

/**
 * Download a file as a blob and trigger browser save dialog.
 * Mirrors Angular's downloadFile (uses file-saver pattern without dependency).
 *
 * @param endpoint  API_CONFIG endpoint
 * @param params    URL path parameters
 * @param filename  Suggested filename for the download
 */
export async function downloadFileService(endpoint: ApiEndpoint, params?: UrlParams, filename?: string): Promise<void> {
  const url = buildUrl(endpoint, params);
  const { data, headers } = await apiClient.get<Blob>(url, { responseType: 'blob' });

  // Derive filename from Content-Disposition header or use provided name
  const disposition = headers['content-disposition'];
  const serverFilename = disposition?.match(/filename="?([^";\n]+)"?/)?.[1];
  const finalFilename = filename ?? serverFilename ?? 'download';

  // Trigger browser download
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
