/**
 * HaloPSA service exports.
 */

// Base service
export { BaseService } from './base';

// Ticket service
export { TicketService } from './tickets';
export type { ListOpenParams, ListClosedParams } from './tickets';

// Client services
export { ClientService, SiteService, UserService } from './clients';

// Agent services
export { AgentService, TeamService } from './agents';

// Asset services
export { AssetService, AssetTypeService } from './assets';

// Knowledge Base services
export { KnowledgeBaseService, FAQService } from './knowledgebase';

// Billing services
// Note: ExpenseService removed - HaloPSA API does not have a dedicated /Expense endpoint
export { TimeEntryService, InvoiceService, ProjectService } from './billing';

// Contract services
export { ContractService, SLAService, RecurringServiceService } from './contracts';

// Report services
export { ReportService, ScheduledReportService, DashboardService } from './reports';

// Configuration services
export { ConfigurationService } from './configuration';
// Note: CustomField, TicketStatus, TicketType, Priority, Category, Team are exported from ../types
export type {
  Workflow,
  EmailTemplate,
  TicketTemplate,
} from './configuration';

// Attachment services
export { AttachmentService } from './attachments';
export type { Attachment } from './attachments';

// Opportunity services
export { OpportunityService, PipelineStageService } from './opportunities';

// Quotation services
export { QuotationService } from './quotations';

// Sales services (SalesOrder, Supplier, PurchaseOrder, Product)
export { SalesOrderService, SupplierService, PurchaseOrderService, ProductService } from './sales';

// Phase 2: Operations & Scheduling services
// Appointment services
export { AppointmentService } from './appointments';

// Timesheet services
export { TimesheetService, TimesheetEventService, ActivityTypeService } from './timesheets';

// ToDo services
export { ToDoService, ToDoGroupService } from './todos';

// Canned Text services
export { CannedTextService, CannedTextCategoryService } from './canned-text';

// Phase 3: ITIL & Service Management services
// Approval Process services
export {
  ApprovalProcessService,
  ApprovalProcessRuleService,
  TicketApprovalService,
  createApprovalServices,
} from './approvals';

// Release Management services
export {
  ReleaseService,
  ReleaseTypeService,
  ReleasePipelineService,
  ReleasePipelineStageService,
  createReleaseServices,
} from './releases';

// CAB (Change Advisory Board) services
export {
  CABService,
  CABMemberService,
  CABRoleService,
  CABMeetingService,
  CABReviewItemService,
  createCABServices,
} from './cab';

// Service Catalog services
export {
  ServiceCatalogService,
  ServiceCategoryService,
  ServiceStatusService,
  ServiceAvailabilityService,
  ScheduledMaintenanceService,
  ServiceSubscriberService,
  createServiceCatalogServices,
} from './service-catalog';

// Phase 4: Productivity & Automation services
// Ticket Rules services
export { TicketRuleService } from './ticket-rules';

// Webhook services
export { WebhookService, WebhookEventService, IncomingWebhookService } from './webhooks';

// Global Search services
export { SearchService, SavedSearchService, RecentSearchService } from './search';

// Audit services
export { AuditService, AuditPolicyService, EntityHistoryService, SecurityEventService } from './audit';

// Notification services
export {
  NotificationService,
  NotificationTemplateService,
  NotificationPreferenceService,
  NotificationSubscriptionService,
  NotificationStatsService,
} from './notifications';

// Phase 5: Integrations & Webhooks services
// Integration services
export {
  IntegrationService,
  IntegrationMappingService,
  IntegrationSyncService,
  IntegrationLogService,
  ExternalEntityService,
  AzureADIntegrationService,
  IntuneIntegrationService,
  ChatIntegrationService,
  RMMIntegrationService,
} from './integrations';

// Phase 6: Advanced Features services
export {
  CurrencyService,
  TaxService,
  TaxRuleService,
  HolidayService,
  CostCentreService,
  BudgetTypeService,
  QualificationService,
  AgentQualificationService,
  RoadmapService,
  PasswordFieldService,
  BookmarkService,
  MailCampaignService,
  DocumentCreationService,
  PdfTemplateService,
  ExternalLinkService,
  PopupNoteService,
} from './advanced';
