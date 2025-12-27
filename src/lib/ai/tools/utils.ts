/**
 * Shared utility functions for AI tools.
 */

/**
 * Standard error response type for all tools.
 */
export interface ToolErrorResponse {
  success: false;
  error: string;
}

/**
 * Format an error into a user-friendly response.
 * Consolidates error handling logic for all AI tools.
 */
export function formatError(error: unknown, toolName: string): ToolErrorResponse {
  console.error(`[Tool:${toolName}] Error:`, error);

  const message = error instanceof Error ? error.message : String(error);

  // Authentication errors
  if (message.includes('401') || message.includes('Unauthorized')) {
    return {
      success: false,
      error: 'Authentication failed with HaloPSA. Please check your connection credentials.',
    };
  }

  // Permission errors
  if (message.includes('403') || message.includes('Forbidden')) {
    return {
      success: false,
      error: 'Access denied. Your HaloPSA account may not have permission for this operation.',
    };
  }

  // Not found errors
  if (message.includes('404') || message.includes('Not Found') || message.includes('not found')) {
    return {
      success: false,
      error: 'The requested resource was not found in HaloPSA.',
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ESOCKETTIMEDOUT')) {
    return {
      success: false,
      error: 'Connection to HaloPSA timed out. Please try again.',
    };
  }

  // Connection errors
  if (message.includes('ECONNREFUSED') || message.includes('network') || message.includes('ENOTFOUND')) {
    return {
      success: false,
      error: 'Could not connect to HaloPSA. Please check the connection URL.',
    };
  }

  // Rate limiting
  if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
    return {
      success: false,
      error: 'Too many requests. Please wait a moment and try again.',
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      success: false,
      error: `Validation error: ${message}`,
    };
  }

  // Database/SQL errors
  if (message.includes('Invalid object name') || message.includes('SQL') || message.includes('syntax')) {
    return {
      success: false,
      error: `Database query error: ${message}`,
    };
  }

  // Generic error
  return {
    success: false,
    error: `Operation failed: ${message}`,
  };
}

/**
 * Default pagination constants for tools.
 */
export const TOOL_DEFAULTS = {
  /** Default number of items to return in list operations */
  DEFAULT_COUNT: 20,
  /** Maximum number of items per page */
  MAX_PAGE_SIZE: 100,
  /** Default days for expiring items lookups */
  DEFAULT_EXPIRING_DAYS: 30,
  /** Default days for warranty expiration lookups */
  DEFAULT_WARRANTY_DAYS: 30,
  /** Default limit for bulk operations */
  DEFAULT_BULK_LIMIT: 10,
} as const;
