/**
 * API Transport & Error Types for Kariuki Kagunda Lawfirm OS Web App
 */

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }

  static fromUnknown(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    if (err instanceof Error) return new ApiError(500, err.message);
    return new ApiError(500, 'An unknown network error occurred');
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  elevationToken?: string;
}

export interface HealthStatusResponse {
  status: 'ok' | 'ready' | 'error';
  service?: string;
  database?: string;
  redis?: string;
  time: string;
}
