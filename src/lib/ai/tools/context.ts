/**
 * HaloPSA service context for AI tools.
 * Provides service instances for tool execution.
 */

import { createHaloServices } from '@/lib/halopsa';

export interface HaloContext {
  tickets: ReturnType<typeof createHaloServices>['tickets'];
  clients: ReturnType<typeof createHaloServices>['clients'];
  agents: ReturnType<typeof createHaloServices>['agents'];
  assets: ReturnType<typeof createHaloServices>['assets'];
  kb: ReturnType<typeof createHaloServices>['kb'];
  timeEntries: ReturnType<typeof createHaloServices>['timeEntries'];
  invoices: ReturnType<typeof createHaloServices>['invoices'];
  projects: ReturnType<typeof createHaloServices>['projects'];
  expenses: ReturnType<typeof createHaloServices>['expenses'];
  contracts: ReturnType<typeof createHaloServices>['contracts'];
  reports: ReturnType<typeof createHaloServices>['reports'];
}

/**
 * Create a HaloPSA context from connection credentials.
 */
export function createHaloContext(config: {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenant?: string;
}): HaloContext {
  const services = createHaloServices(config);
  return {
    tickets: services.tickets,
    clients: services.clients,
    agents: services.agents,
    assets: services.assets,
    kb: services.kb,
    timeEntries: services.timeEntries,
    invoices: services.invoices,
    projects: services.projects,
    expenses: services.expenses,
    contracts: services.contracts,
    reports: services.reports,
  };
}
