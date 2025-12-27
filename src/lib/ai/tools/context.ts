/**
 * HaloPSA service context for AI tools.
 * Provides service instances for tool execution.
 */

import { createHaloServices, HaloPSAClient } from '@/lib/halopsa';
import { ReportRepositoryService } from '@/lib/halopsa/services/reports';

export interface HaloContext {
  client: HaloPSAClient;
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
  configuration: ReturnType<typeof createHaloServices>['configuration'];
  attachments: ReturnType<typeof createHaloServices>['attachments'];
  reportRepository: ReportRepositoryService;
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
    client: services.client,
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
    configuration: services.configuration,
    attachments: services.attachments,
    reportRepository: new ReportRepositoryService(services.client),
  };
}
