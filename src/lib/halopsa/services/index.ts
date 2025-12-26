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
export { TimeEntryService, InvoiceService, ProjectService, ExpenseService } from './billing';

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
