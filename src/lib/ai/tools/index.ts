/**
 * HaloPSA AI Tool definitions for Vercel AI SDK.
 *
 * This module provides comprehensive AI-powered tools for interacting
 * with HaloPSA PSA/ITSM systems, covering:
 * - Ticket management (create, update, close, merge, bulk operations)
 * - Client/customer management
 * - Agent/technician management and workload
 * - Asset/device tracking
 * - Time tracking and billing
 * - Knowledge base articles and FAQs
 * - Contracts and SLAs
 * - Reports and dashboards
 */

import type { CoreTool } from 'ai';
import { createHaloContext, type HaloContext } from './context';
import { createTicketTools } from './tickets';
import { createClientTools } from './clients';
import { createAgentTools } from './agents';
import { createAssetTools } from './assets';
import { createBillingTools } from './billing';
import { createKnowledgeBaseTools } from './knowledgebase';
import { createContractTools } from './contracts';
import { createReportTools } from './reports';
import { createConfigurationTools } from './configuration';
import { createAttachmentTools } from './attachments';

export { createHaloContext, type HaloContext } from './context';

/**
 * Create all HaloPSA tools for the AI agent.
 */
export function createHaloTools(ctx: HaloContext): Record<string, CoreTool> {
  return {
    ...createTicketTools(ctx),
    ...createClientTools(ctx),
    ...createAgentTools(ctx),
    ...createAssetTools(ctx),
    ...createBillingTools(ctx),
    ...createKnowledgeBaseTools(ctx),
    ...createContractTools(ctx),
    ...createReportTools(ctx),
    ...createConfigurationTools(ctx),
    ...createAttachmentTools(ctx),
  };
}

/**
 * Create all HaloPSA tools from connection credentials.
 */
export function createHaloToolsFromConfig(config: {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenant?: string;
}): Record<string, CoreTool> {
  const ctx = createHaloContext(config);
  return createHaloTools(ctx);
}

/**
 * Get a list of all available tool names.
 */
export function getToolNames(): string[] {
  return [
    // Ticket tools
    'listTickets',
    'getTicket',
    'getTicketStats',
    'listSlaBreachedTickets',
    'listUnassignedTickets',
    'addTicketNote',
    'createTicket',
    'updateTicket',
    'assignTicket',
    'closeTicket',
    'changeTicketStatus',
    'changeTicketPriority',
    'bulkUpdateTickets',
    'bulkCloseTickets',
    'mergeTickets',
    'findDuplicateTickets',
    // Client tools
    'listClients',
    'getClient',
    'createClient',
    'updateClient',
    'getClientStats',
    'listSites',
    'getSite',
    'createSite',
    'updateSite',
    'listUsers',
    'getUser',
    'createUser',
    'updateUser',
    // Agent tools
    'listAgents',
    'getAgent',
    'getAgentWorkload',
    'listTeams',
    'getTeam',
    // Asset tools
    'listAssets',
    'getAsset',
    'getAssetStats',
    'listWarrantyExpiring',
    'listWarrantyExpired',
    'createAsset',
    'updateAsset',
    'listAssetTypes',
    // Billing tools
    'listTimeEntries',
    'createTimeEntry',
    'getTimeSummary',
    'listInvoices',
    'getInvoice',
    'createInvoice',
    'createInvoiceFromTime',
    'sendInvoice',
    'markInvoicePaid',
    'getInvoiceSummary',
    'listProjects',
    'getProject',
    'createProject',
    'updateProject',
    'listExpenses',
    'createExpense',
    // Knowledge base tools
    'listKbArticles',
    'getKbArticle',
    'searchKbArticles',
    'getKbSuggestions',
    'createKbArticle',
    'updateKbArticle',
    'getKbStats',
    'listFaqs',
    'createFaq',
    // Contract tools
    'listContracts',
    'getContract',
    'createContract',
    'updateContract',
    'renewContract',
    'getExpiringContracts',
    'getContractSummary',
    'listSlas',
    'getSla',
    'createSlaTarget',
    'listRecurringServices',
    'createRecurringService',
    // Report tools
    'listReports',
    'getReport',
    'runReport',
    'exportReport',
    'createReport',
    'listScheduledReports',
    'createScheduledReport',
    'listDashboards',
    'getDashboard',
    'createDashboard',
    'addDashboardWidget',
    // Configuration tools
    'listCustomFields',
    'getCustomField',
    'listTicketStatuses',
    'listTicketTypes',
    'listPriorities',
    'listCategories',
    'listWorkflows',
    'getWorkflow',
    'toggleWorkflow',
    'listEmailTemplates',
    'getEmailTemplate',
    'createEmailTemplate',
    'listTicketTemplates',
    'getTicketTemplate',
    'createTicketFromTemplate',
    'createTicketTemplate',
    // Attachment tools
    'listTicketAttachments',
    'getAttachment',
    'deleteAttachment',
    'copyAttachments',
  ];
}

/**
 * Get tool categories for documentation.
 */
export const toolCategories = {
  tickets: [
    'listTickets',
    'getTicket',
    'getTicketStats',
    'listSlaBreachedTickets',
    'listUnassignedTickets',
    'addTicketNote',
    'createTicket',
    'updateTicket',
    'assignTicket',
    'closeTicket',
    'changeTicketStatus',
    'changeTicketPriority',
    'bulkUpdateTickets',
    'bulkCloseTickets',
    'mergeTickets',
    'findDuplicateTickets',
  ],
  clients: [
    'listClients',
    'getClient',
    'createClient',
    'updateClient',
    'getClientStats',
    'listSites',
    'getSite',
    'createSite',
    'updateSite',
    'listUsers',
    'getUser',
    'createUser',
    'updateUser',
  ],
  agents: [
    'listAgents',
    'getAgent',
    'getAgentWorkload',
    'listTeams',
    'getTeam',
  ],
  assets: [
    'listAssets',
    'getAsset',
    'getAssetStats',
    'listWarrantyExpiring',
    'listWarrantyExpired',
    'createAsset',
    'updateAsset',
    'listAssetTypes',
  ],
  billing: [
    'listTimeEntries',
    'createTimeEntry',
    'getTimeSummary',
    'listInvoices',
    'getInvoice',
    'createInvoice',
    'createInvoiceFromTime',
    'sendInvoice',
    'markInvoicePaid',
    'getInvoiceSummary',
    'listProjects',
    'getProject',
    'createProject',
    'updateProject',
    'listExpenses',
    'createExpense',
  ],
  knowledgeBase: [
    'listKbArticles',
    'getKbArticle',
    'searchKbArticles',
    'getKbSuggestions',
    'createKbArticle',
    'updateKbArticle',
    'getKbStats',
    'listFaqs',
    'createFaq',
  ],
  contracts: [
    'listContracts',
    'getContract',
    'createContract',
    'updateContract',
    'renewContract',
    'getExpiringContracts',
    'getContractSummary',
    'listSlas',
    'getSla',
    'createSlaTarget',
    'listRecurringServices',
    'createRecurringService',
  ],
  reports: [
    'listReports',
    'getReport',
    'runReport',
    'exportReport',
    'createReport',
    'listScheduledReports',
    'createScheduledReport',
    'listDashboards',
    'getDashboard',
    'createDashboard',
    'addDashboardWidget',
  ],
  configuration: [
    'listCustomFields',
    'getCustomField',
    'listTicketStatuses',
    'listTicketTypes',
    'listPriorities',
    'listCategories',
    'listWorkflows',
    'getWorkflow',
    'toggleWorkflow',
    'listEmailTemplates',
    'getEmailTemplate',
    'createEmailTemplate',
    'listTicketTemplates',
    'getTicketTemplate',
    'createTicketFromTemplate',
    'createTicketTemplate',
  ],
  attachments: [
    'listTicketAttachments',
    'getAttachment',
    'deleteAttachment',
    'copyAttachments',
  ],
} as const;
