/**
 * Base service class for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { HaloBaseEntity, ListParams, PaginatedResponse } from '../types';

/**
 * Generic response type that can be a list or paginated object.
 */
type ApiResponse<T> = T[] | PaginatedResponse<T> | Record<string, T[]>;

/**
 * Base service class with common CRUD operations.
 */
export abstract class BaseService<T extends HaloBaseEntity, TRaw = unknown> {
  protected client: HaloPSAClient;
  protected abstract endpoint: string;

  constructor(client: HaloPSAClient) {
    this.client = client;
  }

  /**
   * Transform raw API response to typed entity.
   * Override in subclasses for specific transformations.
   */
  protected abstract transform(data: TRaw): T;

  /**
   * Parse a single item response into model.
   */
  protected parseResponse(data: TRaw): T {
    return this.transform(data);
  }

  /**
   * Parse a list response into models.
   */
  protected parseListResponse(data: ApiResponse<TRaw>): T[] {
    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item));
    }

    // Handle paginated response
    if ('records' in data && Array.isArray(data.records)) {
      return data.records.map((item) => this.transform(item));
    }
    if ('tickets' in data && Array.isArray(data.tickets)) {
      return (data.tickets as TRaw[]).map((item) => this.transform(item));
    }
    if ('clients' in data && Array.isArray(data.clients)) {
      return (data.clients as TRaw[]).map((item) => this.transform(item));
    }

    return [];
  }

  /**
   * Get a single item by ID.
   */
  async get(id: number, params?: ListParams): Promise<T> {
    const data = await this.client.get<TRaw>(`${this.endpoint}/${id}`, params);
    return this.parseResponse(data);
  }

  /**
   * List items with optional filtering.
   */
  async list(params?: ListParams): Promise<T[]> {
    const data = await this.client.get<ApiResponse<TRaw>>(this.endpoint, params);
    return this.parseListResponse(data);
  }

  /**
   * Create one or more items.
   */
  async create(items: Partial<T>[]): Promise<T[]> {
    const data = await this.client.post<ApiResponse<TRaw>>(this.endpoint, items);
    return this.parseListResponse(data);
  }

  /**
   * Update one or more items.
   */
  async update(items: Partial<T>[]): Promise<T[]> {
    const data = await this.client.post<ApiResponse<TRaw>>(this.endpoint, items);
    return this.parseListResponse(data);
  }

  /**
   * Delete an item by ID.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`${this.endpoint}/${id}`);
  }
}
