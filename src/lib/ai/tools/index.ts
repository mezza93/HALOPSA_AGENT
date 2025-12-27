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
import { createDashboardBuilderTools } from './dashboard-builder';
import { createDashboardValidatorTools } from './dashboard-validator';
import { createReportRepositoryTools } from './report-repository';
import { createWebResourceTools } from './web-resources';
import { createSchemaTools } from './schema';

export { createHaloContext, type HaloContext } from './context';
export { createWebResourceTools } from './web-resources';
export { createSchemaTools } from './schema';

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
    ...createDashboardBuilderTools(ctx),
    ...createDashboardValidatorTools(ctx),
    ...createReportRepositoryTools(ctx),
    ...createSchemaTools(ctx),
    // Web resource tools (no HaloContext required)
    ...createWebResourceTools(),
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
    'getAgentAvailability',
    'listAgentCalendar',
    'getTeamAvailability',
    'createAgentCalendarEvent',
    'findAvailableAgents',
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
    'createSla',
    'createSlaTarget',
    'listRecurringServices',
    'createRecurringService',
    // Report tools
    'listReports',
    'getReport',
    'runReport',
    'exportReport',
    'createReport',
    'updateReport',
    'deleteReport',
    'runSavedReport',
    'listScheduledReports',
    'createScheduledReport',
    'listDashboards',
    'getDashboard',
    'createDashboard',
    'addDashboardWidget',
    // Configuration tools
    'listCustomFields',
    'getCustomField',
    'createCustomField',
    'listTicketStatuses',
    'listTicketTypes',
    'listPriorities',
    'listCategories',
    'listWorkflows',
    'getWorkflow',
    'toggleWorkflow',
    'createWorkflow',
    'listEmailTemplates',
    'getEmailTemplate',
    'createEmailTemplate',
    'updateEmailTemplate',
    'listTicketTemplates',
    'getTicketTemplate',
    'createTicketFromTemplate',
    'createTicketTemplate',
    'listEscalationRules',
    'createEscalationRule',
    'listSystemSettings',
    'getSystemSetting',
    'updateSystemSetting',
    'getApiInfo',
    'getLookupValues',
    'getFieldInfo',
    'getSlaPolicies',
    // Attachment tools
    'listTicketAttachments',
    'getAttachment',
    'deleteAttachment',
    'copyAttachments',
    'uploadAttachment',
    // Dashboard builder tools
    'smartBuildDashboard',
    'smartBuildCustomDashboard',
    'suggestDashboardWidgets',
    'listDashboardTemplates',
    'findReportForWidget',
    // Dashboard validator tools
    'validateDashboard',
    'validateReport',
    'fixReport',
    'createValidatedReport',
    'listValidatedTemplates',
    'getValidatedSql',
    // Report repository tools
    'listRepositoryReports',
    'searchRepositoryReports',
    'getRepositoryReport',
    'importRepositoryReport',
    'getRepositoryCategories',
    'findAndImportReport',
    // Schema tools
    'getSqlSchemaContext',
    'getLookupTables',
    'getLookupValues',
    'getTicketStatuses',
    'getPriorities',
    'getCustomFields',
    'validateSqlQuery',
    // Web resource tools
    'fetchHaloPSADocs',
    'searchHaloPSAReddit',
    'fetchContext7Docs',
    'fetchWebPage',
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
    'getAgentAvailability',
    'listAgentCalendar',
    'getTeamAvailability',
    'createAgentCalendarEvent',
    'findAvailableAgents',
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
    'createSla',
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
    'updateReport',
    'deleteReport',
    'runSavedReport',
    'listScheduledReports',
    'createScheduledReport',
    'listDashboards',
    'getDashboard',
    'createDashboard',
    'addDashboardWidget',
    // Smart dashboard builder
    'smartBuildDashboard',
    'smartBuildCustomDashboard',
    'suggestDashboardWidgets',
    'listDashboardTemplates',
    'findReportForWidget',
    // Dashboard validation
    'validateDashboard',
    'validateReport',
    'fixReport',
    'createValidatedReport',
    'listValidatedTemplates',
    'getValidatedSql',
    // Report repository
    'listRepositoryReports',
    'searchRepositoryReports',
    'getRepositoryReport',
    'importRepositoryReport',
    'getRepositoryCategories',
    'findAndImportReport',
  ],
  configuration: [
    'listCustomFields',
    'getCustomField',
    'createCustomField',
    'listTicketStatuses',
    'listTicketTypes',
    'listPriorities',
    'listCategories',
    'listWorkflows',
    'getWorkflow',
    'toggleWorkflow',
    'createWorkflow',
    'listEmailTemplates',
    'getEmailTemplate',
    'createEmailTemplate',
    'updateEmailTemplate',
    'listTicketTemplates',
    'getTicketTemplate',
    'createTicketFromTemplate',
    'createTicketTemplate',
    'listEscalationRules',
    'createEscalationRule',
    'listSystemSettings',
    'getSystemSetting',
    'updateSystemSetting',
    'getApiInfo',
    'getLookupValues',
    'getFieldInfo',
    'getSlaPolicies',
  ],
  attachments: [
    'listTicketAttachments',
    'getAttachment',
    'deleteAttachment',
    'copyAttachments',
    'uploadAttachment',
  ],
  schema: [
    'getSqlSchemaContext',
    'getLookupTables',
    'getLookupValues',
    'getTicketStatuses',
    'getPriorities',
    'getCustomFields',
    'validateSqlQuery',
  ],
  webResources: [
    'fetchHaloPSADocs',
    'searchHaloPSAReddit',
    'fetchContext7Docs',
    'fetchWebPage',
  ],
} as const;
