/**
 * HaloPSA API Client with OAuth2 authentication.
 */

import { HaloConnectionConfig, TokenResponse, ListParams } from './types';
import { AuthenticationError, APIError, RateLimitError, NotFoundError } from './errors';
import { apiCache, CACHE_TTL, withCache } from './cache';

export interface CacheOptions {
  /** Whether to use caching for this request (default: true for GET) */
  useCache?: boolean;
  /** TTL in seconds (uses endpoint-specific defaults if not specified) */
  ttl?: number;
}

/**
 * HTTP client for HaloPSA API with automatic token management.
 */
export class HaloPSAClient {
  private config: HaloConnectionConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private connectionId: string;

  constructor(config: HaloConnectionConfig, connectionId?: string) {
    this.config = config;
    // Use a unique identifier for caching - connectionId or hash of config
    this.connectionId = connectionId || this.generateConfigHash();
  }

  /**
   * Generate a hash for cache key when no connectionId is provided.
   */
  private generateConfigHash(): string {
    return `${this.config.baseUrl}:${this.config.clientId.substring(0, 8)}`;
  }

  /**
   * Get the API URL (base URL + /api).
   */
  get apiUrl(): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/api`;
  }

  /**
   * Get the authentication URL.
   */
  get authUrl(): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    if (this.config.tenant) {
      return `${base}/auth/token?tenant=${this.config.tenant}`;
    }
    return `${base}/auth/token`;
  }

  /**
   * Check if current token is still valid.
   */
  private isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) {
      return false;
    }
    // Add 60 second buffer before expiry
    const bufferTime = new Date(this.tokenExpiresAt.getTime() - 60000);
    return new Date() < bufferTime;
  }

  /**
   * Authenticate and get access token.
   * @throws AuthenticationError if authentication fails.
   */
  async authenticate(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'all',
      });

      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AuthenticationError(`Authentication failed: ${text}`);
      }

      const data: TokenResponse = await response.json();

      this.accessToken = data.access_token;
      // Token typically expires in 3600 seconds (1 hour)
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      return this.accessToken;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(`Authentication failed: ${error}`);
    }
  }

  /**
   * Get request headers with authentication.
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle API errors.
   */
  private handleError(endpoint: string, method: string, response: Response, text: string): never {
    const message = `${method} ${endpoint} failed: ${text}`;

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(message, retryAfter ? parseInt(retryAfter) : undefined);
    }

    if (response.status === 404) {
      throw new NotFoundError(endpoint);
    }

    throw new APIError(message, response.status, text);
  }

  /**
   * Determine the default TTL for an endpoint.
   */
  private getDefaultTTL(endpoint: string): number {
    const ep = endpoint.toLowerCase();

    // Schema and configuration endpoints - long cache
    if (ep.includes('schema') || ep.includes('column') || ep.includes('field')) {
      return CACHE_TTL.SCHEMA;
    }
    if (ep.includes('config') || ep.includes('status') || ep.includes('type') || ep.includes('priority')) {
      return CACHE_TTL.CONFIG;
    }

    // Report list endpoint - medium cache
    if (ep.includes('report') && !ep.includes('result')) {
      return CACHE_TTL.REPORTS;
    }

    // Lookup endpoints
    if (ep.includes('client') || ep.includes('agent') || ep.includes('user')) {
      return CACHE_TTL.LOOKUP;
    }

    // Ticket data - short cache
    if (ep.includes('ticket')) {
      return CACHE_TTL.TICKETS;
    }

    // Default for other endpoints
    return CACHE_TTL.REALTIME;
  }

  /**
   * Make GET request to API with optional caching.
   * @param endpoint - API endpoint (e.g., "/Ticket")
   * @param params - Query parameters
   * @param cacheOptions - Caching options
   * @returns Response JSON data.
   * @throws APIError if request fails.
   */
  async get<T = unknown>(endpoint: string, params?: ListParams, cacheOptions?: CacheOptions): Promise<T> {
    const useCache = cacheOptions?.useCache !== false;
    const ttl = cacheOptions?.ttl ?? this.getDefaultTTL(endpoint);

    // Use caching wrapper for cacheable requests
    if (useCache) {
      return withCache<T>(
        this.connectionId,
        endpoint,
        () => this.fetchGet<T>(endpoint, params),
        { ttl },
        params as Record<string, unknown>
      );
    }

    return this.fetchGet<T>(endpoint, params);
  }

  /**
   * Internal method to perform the actual GET request.
   */
  private async fetchGet<T = unknown>(endpoint: string, params?: ListParams): Promise<T> {
    const headers = await this.getHeaders();

    let url = `${this.apiUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      this.handleError(endpoint, 'GET', response, text);
    }

    return response.json();
  }

  /**
   * Make POST request to API.
   * @param endpoint - API endpoint
   * @param data - Request body (will be JSON encoded)
   * @param params - Query parameters
   * @returns Response JSON data.
   * @throws APIError if request fails.
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: ListParams
  ): Promise<T> {
    const headers = await this.getHeaders();

    let url = `${this.apiUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      this.handleError(endpoint, 'POST', response, text);
    }

    // Invalidate related cache entries after successful POST (creates/updates data)
    apiCache.invalidatePattern(this.connectionId, endpoint.split('/')[1] || endpoint);

    return response.json();
  }

  /**
   * Make DELETE request to API.
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Response JSON data or null.
   * @throws APIError if request fails.
   */
  async delete<T = unknown>(endpoint: string, params?: ListParams): Promise<T | null> {
    const headers = await this.getHeaders();

    let url = `${this.apiUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      this.handleError(endpoint, 'DELETE', response, text);
    }

    // Invalidate related cache entries after successful DELETE
    apiCache.invalidatePattern(this.connectionId, endpoint.split('/')[1] || endpoint);

    const text = await response.text();
    if (text) {
      return JSON.parse(text);
    }
    return null;
  }

  /**
   * Invalidate cache for this connection.
   */
  invalidateCache(): void {
    apiCache.invalidateConnection(this.connectionId);
  }

  /**
   * Test connection to HaloPSA instance.
   * @returns true if connection is successful.
   * @throws AuthenticationError or APIError if connection fails.
   */
  async testConnection(): Promise<boolean> {
    await this.authenticate();
    // Try to fetch a simple endpoint to verify API access
    await this.get('/Agent', { count: 1 });
    return true;
  }

  /**
   * Clear cached token (useful for reconnection).
   */
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }
}

/**
 * Create a HaloPSA client from connection configuration.
 * @param config - Connection configuration
 * @param connectionId - Optional connection ID for caching (recommended for multi-tenant)
 */
export function createHaloClient(config: HaloConnectionConfig, connectionId?: string): HaloPSAClient {
  return new HaloPSAClient(config, connectionId);
}
