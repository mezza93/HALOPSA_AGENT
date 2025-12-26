/**
 * Utility functions for AI tools.
 */

/**
 * Wraps a tool execute function with error handling.
 * Returns a structured error response instead of throwing.
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  toolName: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[Tool:${toolName}] Error:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for specific error types
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return {
          success: false,
          error: 'Authentication failed with HaloPSA. Please check your connection credentials.',
        };
      }
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        return {
          success: false,
          error: 'Access denied. Your HaloPSA account may not have permission for this operation.',
        };
      }
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return {
          success: false,
          error: 'The requested resource was not found in HaloPSA.',
        };
      }
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        return {
          success: false,
          error: 'Connection to HaloPSA timed out. Please try again.',
        };
      }
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
        return {
          success: false,
          error: 'Could not connect to HaloPSA. Please check the connection URL.',
        };
      }

      return {
        success: false,
        error: `Operation failed: ${errorMessage}`,
      };
    }
  }) as T;
}

/**
 * Safe tool executor - wraps execute function with error handling.
 */
export function safeExecute<TParams, TResult>(
  toolName: string,
  executeFn: (params: TParams) => Promise<TResult>
): (params: TParams) => Promise<TResult | { success: false; error: string }> {
  return async (params: TParams) => {
    try {
      return await executeFn(params);
    } catch (error) {
      console.error(`[Tool:${toolName}] Execution error:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Return structured error
      return {
        success: false,
        error: `Failed to execute ${toolName}: ${errorMessage}`,
      };
    }
  };
}
