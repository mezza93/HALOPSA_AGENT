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
  contracts: ReturnType<typeof createHaloServices>['contracts'];
  reports: ReturnType<typeof createHaloServices>['reports'];
  configuration: ReturnType<typeof createHaloServices>['configuration'];
  attachments: ReturnType<typeof createHaloServices>['attachments'];
  // Phase 1: Sales & Revenue
  opportunities: ReturnType<typeof createHaloServices>['opportunities'];
  pipelineStages: ReturnType<typeof createHaloServices>['pipelineStages'];
  quotations: ReturnType<typeof createHaloServices>['quotations'];
  salesOrders: ReturnType<typeof createHaloServices>['salesOrders'];
  suppliers: ReturnType<typeof createHaloServices>['suppliers'];
  purchaseOrders: ReturnType<typeof createHaloServices>['purchaseOrders'];
  products: ReturnType<typeof createHaloServices>['products'];
  // Phase 2: Operations & Scheduling
  appointments: ReturnType<typeof createHaloServices>['appointments'];
  timesheets: ReturnType<typeof createHaloServices>['timesheets'];
  timesheetEvents: ReturnType<typeof createHaloServices>['timesheetEvents'];
  activityTypes: ReturnType<typeof createHaloServices>['activityTypes'];
  todos: ReturnType<typeof createHaloServices>['todos'];
  todoGroups: ReturnType<typeof createHaloServices>['todoGroups'];
  cannedTexts: ReturnType<typeof createHaloServices>['cannedTexts'];
  cannedTextCategories: ReturnType<typeof createHaloServices>['cannedTextCategories'];
  // Phase 3: ITIL & Service Management
  approvalProcesses: ReturnType<typeof createHaloServices>['approvalProcesses'];
  approvalProcessRules: ReturnType<typeof createHaloServices>['approvalProcessRules'];
  ticketApprovals: ReturnType<typeof createHaloServices>['ticketApprovals'];
  releases: ReturnType<typeof createHaloServices>['releases'];
  releaseTypes: ReturnType<typeof createHaloServices>['releaseTypes'];
  releasePipelines: ReturnType<typeof createHaloServices>['releasePipelines'];
  releasePipelineStages: ReturnType<typeof createHaloServices>['releasePipelineStages'];
  cabs: ReturnType<typeof createHaloServices>['cabs'];
  cabMembers: ReturnType<typeof createHaloServices>['cabMembers'];
  cabRoles: ReturnType<typeof createHaloServices>['cabRoles'];
  cabMeetings: ReturnType<typeof createHaloServices>['cabMeetings'];
  cabReviewItems: ReturnType<typeof createHaloServices>['cabReviewItems'];
  serviceCatalog: ReturnType<typeof createHaloServices>['serviceCatalog'];
  serviceCategories: ReturnType<typeof createHaloServices>['serviceCategories'];
  serviceStatuses: ReturnType<typeof createHaloServices>['serviceStatuses'];
  serviceAvailability: ReturnType<typeof createHaloServices>['serviceAvailability'];
  scheduledMaintenance: ReturnType<typeof createHaloServices>['scheduledMaintenance'];
  serviceSubscribers: ReturnType<typeof createHaloServices>['serviceSubscribers'];
  // Phase 4: Productivity & Automation
  ticketRules: ReturnType<typeof createHaloServices>['ticketRules'];
  webhooks: ReturnType<typeof createHaloServices>['webhooks'];
  webhookEvents: ReturnType<typeof createHaloServices>['webhookEvents'];
  incomingWebhooks: ReturnType<typeof createHaloServices>['incomingWebhooks'];
  search: ReturnType<typeof createHaloServices>['search'];
  savedSearches: ReturnType<typeof createHaloServices>['savedSearches'];
  recentSearches: ReturnType<typeof createHaloServices>['recentSearches'];
  audit: ReturnType<typeof createHaloServices>['audit'];
  auditPolicies: ReturnType<typeof createHaloServices>['auditPolicies'];
  entityHistory: ReturnType<typeof createHaloServices>['entityHistory'];
  securityEvents: ReturnType<typeof createHaloServices>['securityEvents'];
  notifications: ReturnType<typeof createHaloServices>['notifications'];
  notificationTemplates: ReturnType<typeof createHaloServices>['notificationTemplates'];
  notificationPreferences: ReturnType<typeof createHaloServices>['notificationPreferences'];
  notificationSubscriptions: ReturnType<typeof createHaloServices>['notificationSubscriptions'];
  notificationStats: ReturnType<typeof createHaloServices>['notificationStats'];
  // Phase 5: Integrations & Webhooks
  integrations: ReturnType<typeof createHaloServices>['integrations'];
  integrationMappings: ReturnType<typeof createHaloServices>['integrationMappings'];
  integrationSync: ReturnType<typeof createHaloServices>['integrationSync'];
  integrationLogs: ReturnType<typeof createHaloServices>['integrationLogs'];
  externalEntities: ReturnType<typeof createHaloServices>['externalEntities'];
  azureAD: ReturnType<typeof createHaloServices>['azureAD'];
  intune: ReturnType<typeof createHaloServices>['intune'];
  slack: ReturnType<typeof createHaloServices>['slack'];
  teams: ReturnType<typeof createHaloServices>['teams'];
  ninjaRMM: ReturnType<typeof createHaloServices>['ninjaRMM'];
  datto: ReturnType<typeof createHaloServices>['datto'];
  nAble: ReturnType<typeof createHaloServices>['nAble'];
  // Phase 6: Advanced Features
  currencies: ReturnType<typeof createHaloServices>['currencies'];
  taxes: ReturnType<typeof createHaloServices>['taxes'];
  taxRules: ReturnType<typeof createHaloServices>['taxRules'];
  holidays: ReturnType<typeof createHaloServices>['holidays'];
  costCentres: ReturnType<typeof createHaloServices>['costCentres'];
  budgetTypes: ReturnType<typeof createHaloServices>['budgetTypes'];
  qualifications: ReturnType<typeof createHaloServices>['qualifications'];
  agentQualifications: ReturnType<typeof createHaloServices>['agentQualifications'];
  roadmaps: ReturnType<typeof createHaloServices>['roadmaps'];
  passwordFields: ReturnType<typeof createHaloServices>['passwordFields'];
  bookmarks: ReturnType<typeof createHaloServices>['bookmarks'];
  mailCampaigns: ReturnType<typeof createHaloServices>['mailCampaigns'];
  documentCreation: ReturnType<typeof createHaloServices>['documentCreation'];
  pdfTemplates: ReturnType<typeof createHaloServices>['pdfTemplates'];
  externalLinks: ReturnType<typeof createHaloServices>['externalLinks'];
  popupNotes: ReturnType<typeof createHaloServices>['popupNotes'];
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
    contracts: services.contracts,
    reports: services.reports,
    configuration: services.configuration,
    attachments: services.attachments,
    // Phase 1: Sales & Revenue
    opportunities: services.opportunities,
    pipelineStages: services.pipelineStages,
    quotations: services.quotations,
    salesOrders: services.salesOrders,
    suppliers: services.suppliers,
    purchaseOrders: services.purchaseOrders,
    products: services.products,
    // Phase 2: Operations & Scheduling
    appointments: services.appointments,
    timesheets: services.timesheets,
    timesheetEvents: services.timesheetEvents,
    activityTypes: services.activityTypes,
    todos: services.todos,
    todoGroups: services.todoGroups,
    cannedTexts: services.cannedTexts,
    cannedTextCategories: services.cannedTextCategories,
    // Phase 3: ITIL & Service Management
    approvalProcesses: services.approvalProcesses,
    approvalProcessRules: services.approvalProcessRules,
    ticketApprovals: services.ticketApprovals,
    releases: services.releases,
    releaseTypes: services.releaseTypes,
    releasePipelines: services.releasePipelines,
    releasePipelineStages: services.releasePipelineStages,
    cabs: services.cabs,
    cabMembers: services.cabMembers,
    cabRoles: services.cabRoles,
    cabMeetings: services.cabMeetings,
    cabReviewItems: services.cabReviewItems,
    serviceCatalog: services.serviceCatalog,
    serviceCategories: services.serviceCategories,
    serviceStatuses: services.serviceStatuses,
    serviceAvailability: services.serviceAvailability,
    scheduledMaintenance: services.scheduledMaintenance,
    serviceSubscribers: services.serviceSubscribers,
    // Phase 4: Productivity & Automation
    ticketRules: services.ticketRules,
    webhooks: services.webhooks,
    webhookEvents: services.webhookEvents,
    incomingWebhooks: services.incomingWebhooks,
    search: services.search,
    savedSearches: services.savedSearches,
    recentSearches: services.recentSearches,
    audit: services.audit,
    auditPolicies: services.auditPolicies,
    entityHistory: services.entityHistory,
    securityEvents: services.securityEvents,
    notifications: services.notifications,
    notificationTemplates: services.notificationTemplates,
    notificationPreferences: services.notificationPreferences,
    notificationSubscriptions: services.notificationSubscriptions,
    notificationStats: services.notificationStats,
    // Phase 5: Integrations & Webhooks
    integrations: services.integrations,
    integrationMappings: services.integrationMappings,
    integrationSync: services.integrationSync,
    integrationLogs: services.integrationLogs,
    externalEntities: services.externalEntities,
    azureAD: services.azureAD,
    intune: services.intune,
    slack: services.slack,
    teams: services.teams,
    ninjaRMM: services.ninjaRMM,
    datto: services.datto,
    nAble: services.nAble,
    // Phase 6: Advanced Features
    currencies: services.currencies,
    taxes: services.taxes,
    taxRules: services.taxRules,
    holidays: services.holidays,
    costCentres: services.costCentres,
    budgetTypes: services.budgetTypes,
    qualifications: services.qualifications,
    agentQualifications: services.agentQualifications,
    roadmaps: services.roadmaps,
    passwordFields: services.passwordFields,
    bookmarks: services.bookmarks,
    mailCampaigns: services.mailCampaigns,
    documentCreation: services.documentCreation,
    pdfTemplates: services.pdfTemplates,
    externalLinks: services.externalLinks,
    popupNotes: services.popupNotes,
    reportRepository: new ReportRepositoryService(services.client),
  };
}
