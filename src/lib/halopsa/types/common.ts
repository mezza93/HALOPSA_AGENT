/**
 * Common types shared across HaloPSA entities.
 */

/**
 * Base interface for all HaloPSA entities.
 */
export interface HaloBaseEntity {
  id: number;
  [key: string]: unknown; // Allow extra fields from API
}

/**
 * Category for ticket classification.
 */
export interface Category extends HaloBaseEntity {
  name: string;
  categoryLevel?: number;
  parentId?: number;
}

/**
 * Custom field definition.
 */
export interface CustomField extends HaloBaseEntity {
  name: string;
  type?: string;
  table?: string;
  value?: unknown;
}

/**
 * Paginated API response.
 */
export interface PaginatedResponse<T> {
  record_count: number;
  records: T[];
}

/**
 * API error response.
 */
export interface ApiErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Connection configuration for HaloPSA instance.
 */
export interface HaloConnectionConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenant?: string;
}

/**
 * OAuth2 token response.
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Query parameters for list operations.
 */
export interface ListParams {
  count?: number;
  page?: number;
  page_size?: number;
  search?: string;
  order?: string;
  orderdesc?: boolean;
  [key: string]: string | number | boolean | undefined;
}
