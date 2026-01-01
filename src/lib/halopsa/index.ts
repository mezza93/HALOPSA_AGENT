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
  const { AssetService } = require('./services/assets');
  const { KnowledgeBaseService } = require('./services/knowledgebase');
  const { TimeEntryService, InvoiceService, ProjectService } = require('./services/billing');
  const { ContractService } = require('./services/contracts');
  const { ReportService } = require('./services/reports');
  const { ConfigurationService } = require('./services/configuration');
  const { AttachmentService } = require('./services/attachments');
  const { OpportunityService, PipelineStageService } = require('./services/opportunities');
  const { QuotationService } = require('./services/quotations');
  const { SalesOrderService, SupplierService, PurchaseOrderService, ProductService } = require('./services/sales');
  // Phase 2: Operations & Scheduling
  const { AppointmentService } = require('./services/appointments');
  const { TimesheetService, TimesheetEventService, ActivityTypeService } = require('./services/timesheets');
  const { ToDoService, ToDoGroupService } = require('./services/todos');
  const { CannedTextService, CannedTextCategoryService } = require('./services/canned-text');
  // Phase 3: ITIL & Service Management
  const { ApprovalProcessService, ApprovalProcessRuleService, TicketApprovalService } = require('./services/approvals');
  const { ReleaseService, ReleaseTypeService, ReleasePipelineService, ReleasePipelineStageService } = require('./services/releases');
  const { CABService, CABMemberService, CABRoleService, CABMeetingService, CABReviewItemService } = require('./services/cab');
  const { ServiceCatalogService, ServiceCategoryService, ServiceStatusService, ServiceAvailabilityService, ScheduledMaintenanceService, ServiceSubscriberService } = require('./services/service-catalog');
  // Phase 4: Productivity & Automation
  const { TicketRuleService } = require('./services/ticket-rules');
  const { WebhookService, WebhookEventService, IncomingWebhookService } = require('./services/webhooks');
  const { SearchService, SavedSearchService, RecentSearchService } = require('./services/search');
  const { AuditService, AuditPolicyService, EntityHistoryService, SecurityEventService } = require('./services/audit');
  const { NotificationService, NotificationTemplateService, NotificationPreferenceService, NotificationSubscriptionService, NotificationStatsService } = require('./services/notifications');
  // Phase 5: Integrations & Webhooks
  const { IntegrationService, IntegrationMappingService, IntegrationSyncService, IntegrationLogService, ExternalEntityService, AzureADIntegrationService, IntuneIntegrationService, ChatIntegrationService, RMMIntegrationService } = require('./services/integrations');
  // Phase 6: Advanced Features
  const { CurrencyService, TaxService, TaxRuleService, HolidayService, CostCentreService, BudgetTypeService, QualificationService, AgentQualificationService, RoadmapService, PasswordFieldService, BookmarkService, MailCampaignService, DocumentCreationService, PdfTemplateService, ExternalLinkService, PopupNoteService } = require('./services/advanced');

  const client = new HaloPSAClient(config);

  return {
    client,
    // Core services
    tickets: new TicketService(client),
    clients: new ClientService(client),
    agents: new AgentService(client),
    assets: new AssetService(client),
    // Knowledge Base
    kb: new KnowledgeBaseService(client),
    // Billing
    timeEntries: new TimeEntryService(client),
    invoices: new InvoiceService(client),
    projects: new ProjectService(client),
    // Contracts & SLAs
    contracts: new ContractService(client),
    // Reports & Dashboards
    reports: new ReportService(client),
    // Configuration
    configuration: new ConfigurationService(client),
    // Attachments
    attachments: new AttachmentService(client),
    // Sales & Revenue (Phase 1)
    opportunities: new OpportunityService(client),
    pipelineStages: new PipelineStageService(client),
    quotations: new QuotationService(client),
    salesOrders: new SalesOrderService(client),
    suppliers: new SupplierService(client),
    purchaseOrders: new PurchaseOrderService(client),
    products: new ProductService(client),
    // Operations & Scheduling (Phase 2)
    appointments: new AppointmentService(client),
    timesheets: new TimesheetService(client),
    timesheetEvents: new TimesheetEventService(client),
    activityTypes: new ActivityTypeService(client),
    todos: new ToDoService(client),
    todoGroups: new ToDoGroupService(client),
    cannedTexts: new CannedTextService(client),
    cannedTextCategories: new CannedTextCategoryService(client),
    // ITIL & Service Management (Phase 3)
    approvalProcesses: new ApprovalProcessService(client),
    approvalProcessRules: new ApprovalProcessRuleService(client),
    ticketApprovals: new TicketApprovalService(client),
    releases: new ReleaseService(client),
    releaseTypes: new ReleaseTypeService(client),
    releasePipelines: new ReleasePipelineService(client),
    releasePipelineStages: new ReleasePipelineStageService(client),
    cabs: new CABService(client),
    cabMembers: new CABMemberService(client),
    cabRoles: new CABRoleService(client),
    cabMeetings: new CABMeetingService(client),
    cabReviewItems: new CABReviewItemService(client),
    serviceCatalog: new ServiceCatalogService(client),
    serviceCategories: new ServiceCategoryService(client),
    serviceStatuses: new ServiceStatusService(client),
    serviceAvailability: new ServiceAvailabilityService(client),
    scheduledMaintenance: new ScheduledMaintenanceService(client),
    serviceSubscribers: new ServiceSubscriberService(client),
    // Productivity & Automation (Phase 4)
    ticketRules: new TicketRuleService(client),
    webhooks: new WebhookService(client),
    webhookEvents: new WebhookEventService(client),
    incomingWebhooks: new IncomingWebhookService(client),
    search: new SearchService(client),
    savedSearches: new SavedSearchService(client),
    recentSearches: new RecentSearchService(client),
    audit: new AuditService(client),
    auditPolicies: new AuditPolicyService(client),
    entityHistory: new EntityHistoryService(client),
    securityEvents: new SecurityEventService(client),
    notifications: new NotificationService(client),
    notificationTemplates: new NotificationTemplateService(client),
    notificationPreferences: new NotificationPreferenceService(client),
    notificationSubscriptions: new NotificationSubscriptionService(client),
    notificationStats: new NotificationStatsService(client),
    // Integrations & Webhooks (Phase 5)
    integrations: new IntegrationService(client),
    integrationMappings: new IntegrationMappingService(client),
    integrationSync: new IntegrationSyncService(client),
    integrationLogs: new IntegrationLogService(client),
    externalEntities: new ExternalEntityService(client),
    azureAD: new AzureADIntegrationService(client),
    intune: new IntuneIntegrationService(client),
    slack: new ChatIntegrationService(client, 'Slack'),
    teams: new ChatIntegrationService(client, 'Teams'),
    ninjaRMM: new RMMIntegrationService(client, 'NinjaRMM'),
    datto: new RMMIntegrationService(client, 'Datto'),
    nAble: new RMMIntegrationService(client, 'NAble'),
    // Advanced Features (Phase 6)
    currencies: new CurrencyService(client),
    taxes: new TaxService(client),
    taxRules: new TaxRuleService(client),
    holidays: new HolidayService(client),
    costCentres: new CostCentreService(client),
    budgetTypes: new BudgetTypeService(client),
    qualifications: new QualificationService(client),
    agentQualifications: new AgentQualificationService(client),
    roadmaps: new RoadmapService(client),
    passwordFields: new PasswordFieldService(client),
    bookmarks: new BookmarkService(client),
    mailCampaigns: new MailCampaignService(client),
    documentCreation: new DocumentCreationService(client),
    pdfTemplates: new PdfTemplateService(client),
    externalLinks: new ExternalLinkService(client),
    popupNotes: new PopupNoteService(client),
  };
}
