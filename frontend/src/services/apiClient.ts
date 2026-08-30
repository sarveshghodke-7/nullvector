/**
 * Module: src/services/apiClient.ts
 *
 * Purpose:
 * Base HTTP client for all backend communication. Handles error
 * normalization, timeouts, and routing to mock services when in
 * MOCK_MODE. No component should call fetch() directly.
 *
 * Layer: SERVICE
 *
 * Consumed by: All service modules (attackService, runService, etc.)
 */

import { MOCK_MODE, REQUEST_TIMEOUT_MS, DEV_MODE } from '@/src/utils/config';

/** Standardized API error */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public technicalDetails?: string,
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

/** User-friendly error messages keyed by HTTP status or error type */
const ERROR_MESSAGES: Record<string, string> = {
  '400': 'Invalid input — please check your configuration.',
  '404': 'The requested resource was not found.',
  '422': 'Invalid configuration — please review the parameters.',
  '500': 'Backend service error — please try again.',
  '502': 'Backend service unavailable.',
  '503': 'Backend service temporarily unavailable.',
  timeout: 'Request timed out — the operation may still be processing.',
  network: 'Unable to connect to the backend service.',
  unknown: 'An unexpected error occurred.',
};

function getUserMessage(status: number | string): string {
  return ERROR_MESSAGES[String(status)] || ERROR_MESSAGES.unknown;
}

/**
 * Make an API request. In MOCK_MODE, this function is never called
 * (services route directly to mock implementations). When called,
 * it wraps fetch() with timeout, error handling, and response parsing.
 */
export async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  if (MOCK_MODE) {
    throw new ApiError(0, 'fetchApi called in MOCK_MODE — this should not happen.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ApiError(
        response.status,
        getUserMessage(response.status),
        DEV_MODE ? `${response.status} ${response.statusText}: ${body}` : undefined,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, getUserMessage('timeout'), 'Request aborted due to timeout');
    }

    throw new ApiError(0, getUserMessage('network'), DEV_MODE ? String(error) : undefined);
  } finally {
    clearTimeout(timeoutId);
  }
}
