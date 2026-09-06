import { ApiError, RequestOptions } from './types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private buildUrl(path: string, params?: RequestOptions['params']): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      let errorCode: string | undefined;
      let errorDetails: unknown = undefined;

      try {
        if (isJson) {
          const json = await res.json();
          errorMessage = json.message || json.error || errorMessage;
          errorCode = json.statusCode?.toString() || json.code;
          errorDetails = json.details || json.errors;
        } else {
          const text = await res.text();
          if (text) errorMessage = text.slice(0, 500);
        }
      } catch {
        // Fallback to generic status text
      }

      throw new ApiError(res.status, errorMessage, errorCode, errorDetails);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    if (isJson) {
      return (await res.json()) as T;
    }

    return (await res.text()) as unknown as T;
  }

  public async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers = {}, elevationToken, ...customConfig } = options;
    const url = this.buildUrl(path, params);

    const reqHeaders: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-Id': `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...(headers as Record<string, string>),
    };

    if (elevationToken) {
      reqHeaders['X-Elevation-Token'] = elevationToken;
    }

    const init: RequestInit = {
      method,
      headers: reqHeaders,
      credentials: 'include', // Always send and receive session cookies
      ...customConfig,
    };

    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        // Let browser set boundary automatically
        delete reqHeaders['Content-Type'];
        init.body = body;
      } else {
        reqHeaders['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
    }

    try {
      const res = await fetch(url, init);
      return await this.handleResponse<T>(res);
    } catch (err) {
      if (ApiError.isApiError(err)) throw err;
      throw ApiError.fromUnknown(err);
    }
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  public async upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, formData, options);
  }
}

export const apiClient = new ApiClient();
