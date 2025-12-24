/**
 * HaloPSA TypeScript client library.
 *
 * This module provides a fully typed TypeScript client for interacting
 * with the HaloPSA API, including:
 * - OAuth2 authentication with automatic token refresh
 * - Ticket management (create, update, close, merge)
 * - Client/customer management
 * - Agent/technician management
 * - Site and user management
 * - Workload statistics and reporting
 *
 * @example
 * ```typescript
 * import { createHaloClient, TicketService } from '@/lib/halopsa';
 *
 * const client = createHaloClient({
 *   baseUrl: 'https://company.halopsa.com',
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const ticketService = new TicketService(client);
 * const openTickets = await ticketService.listOpen({ count: 50 });
 * ```
 */

// Client
export { HaloPSAClient, createHaloClient } from './client';

// Errors
export {
  HaloError,
  AuthenticationError,
  APIError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from './errors';

// Types
export * from './types';

// Services
export * from './services';

/**
 * Create a fully configured HaloPSA client with all services.
 * This is a convenience function that creates the client and all
 * service instances in one call.
 */
export function createHaloServices(config: {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenant?: string;
}) {
  const { HaloPSAClient } = require('./client');
  const { TicketService } = require('./services/tickets');
  const { ClientService } = require('./services/clients');
  const { AgentService } = require('./services/agents');

  const client = new HaloPSAClient(config);

  return {
    client,
    tickets: new TicketService(client),
    clients: new ClientService(client),
    agents: new AgentService(client),
  };
}
