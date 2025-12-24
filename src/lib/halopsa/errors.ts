/**
 * Custom error classes for HaloPSA operations.
 */

/**
 * Base error class for HaloPSA operations.
 */
export class HaloError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HaloError';
  }
}

/**
 * Raised when authentication fails.
 */
export class AuthenticationError extends HaloError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Raised when API request fails.
 */
export class APIError extends HaloError {
  statusCode?: number;
  response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Raised when rate limit is exceeded.
 */
export class RateLimitError extends APIError {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Raised when resource is not found.
 */
export class NotFoundError extends APIError {
  constructor(resource: string, id?: number | string) {
    super(`${resource}${id ? ` with ID ${id}` : ''} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Raised when validation fails.
 */
export class ValidationError extends HaloError {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
