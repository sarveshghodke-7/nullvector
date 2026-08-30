/**
 * Module: src/utils/config.ts
 *
 * Purpose:
 * Centralized application configuration. Controls whether the app
 * runs against mock data or a real backend, and defines the base
 * API URL. Read from environment variables at build time.
 *
 * Layer: UTILS
 *
 * Consumed by:
 * - src/services/apiClient.ts
 * - src/services/* (all service modules)
 */

/**
 * Default to the live backend so the app opens in a clean, real-state mode.
 * Set NEXT_PUBLIC_MOCK_MODE=true only when intentionally demoing mock data.
 */
export const MOCK_MODE: boolean =
  process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

/** Base URL for the backend API */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

/** API version prefix */
export const API_VERSION = 'v1';

/** Full API prefix */
export const API_PREFIX = `${API_BASE_URL}/api/${API_VERSION}`;

/** Request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Whether to show detailed error info (development mode) */
export const DEV_MODE: boolean =
  process.env.NODE_ENV === 'development';
