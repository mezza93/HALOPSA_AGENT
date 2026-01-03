/**
 * In-memory cache for HaloPSA API responses.
 * Reduces latency for repeated requests during conversation sessions.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheOptions {
  /** Time-to-live in seconds (default: 60) */
  ttl?: number;
  /** Stale-while-revalidate time in seconds (default: 0 = disabled) */
  swr?: number;
}

// Default TTLs for different data types (in seconds)
export const CACHE_TTL = {
  /** Static configuration data (rarely changes) */
  CONFIG: 300, // 5 minutes
  /** Schema/columns data (very rarely changes) */
  SCHEMA: 600, // 10 minutes
  /** Client/agent lookup data */
  LOOKUP: 120, // 2 minutes
  /** Report list (changes occasionally) */
  REPORTS: 180, // 3 minutes
  /** Ticket data (changes frequently) */
  TICKETS: 30, // 30 seconds
  /** Real-time data (very fresh) */
  REALTIME: 10, // 10 seconds
} as const;

/**
 * Simple in-memory cache with TTL support.
 * Note: This is per-serverless-function instance.
 * For production at scale, consider Redis/Upstash.
 */
class APICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 1000; // Prevent memory leaks

  /**
   * Generate a cache key from endpoint and params.
   */
  private generateKey(connectionId: string, endpoint: string, params?: Record<string, unknown>): string {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${connectionId}:${endpoint}:${paramStr}`;
  }

  /**
   * Get a cached value if still valid.
   */
  get<T>(connectionId: string, endpoint: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(connectionId, endpoint, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a cached value with TTL.
   */
  set<T>(
    connectionId: string,
    endpoint: string,
    data: T,
    options: CacheOptions = {},
    params?: Record<string, unknown>
  ): void {
    // Enforce size limit by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const key = this.generateKey(connectionId, endpoint, params);
    const ttl = options.ttl ?? 60;

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * Invalidate a specific cache entry.
   */
  invalidate(connectionId: string, endpoint: string, params?: Record<string, unknown>): void {
    const key = this.generateKey(connectionId, endpoint, params);
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries for a connection.
   */
  invalidateConnection(connectionId: string): void {
    const prefix = `${connectionId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all entries matching an endpoint pattern.
   */
  invalidatePattern(connectionId: string, endpointPattern: string): void {
    const pattern = `${connectionId}:${endpointPattern}`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Helper function to wrap an API call with caching.
 */
export async function withCache<T>(
  connectionId: string,
  endpoint: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
  params?: Record<string, unknown>
): Promise<T> {
  // Try to get from cache first
  const cached = apiCache.get<T>(connectionId, endpoint, params);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  apiCache.set(connectionId, endpoint, data, options, params);

  return data;
}
