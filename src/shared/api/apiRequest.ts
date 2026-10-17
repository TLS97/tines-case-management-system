import type { z } from 'zod';

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string) {
    // No response body in the message: it could contain case or personal data.
    super(`API request to ${path} failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }
}

interface ApiRequestOptions<T> extends RequestInit {
  /** Checks the response body; without it the response body is ignored. */
  schema?: z.ZodType<T>;
}

/**
 * Calls the app's API (in v1 the MSW mock API). The URL is made absolute from the page's origin,
 * so the same code works in the browser and in Vitest.
 */
export async function apiRequest<T = void>(
  path: string,
  { schema, ...init }: ApiRequestOptions<T> = {},
): Promise<T> {
  const response = await fetch(new URL(path, window.location.origin), init);
  if (!response.ok) throw new ApiError(response.status, path);
  if (!schema) return undefined as T;
  return schema.parse(await response.json());
}
