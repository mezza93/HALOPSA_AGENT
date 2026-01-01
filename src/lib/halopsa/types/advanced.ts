/**
 * HaloPSA Advanced Feature Types.
 * Phase 6: Advanced Features
 */

import type { HaloBaseEntity } from './common';

// ============================================================================
// CURRENCY TYPES
// ============================================================================

export interface Currency extends HaloBaseEntity {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
  decimalPlaces: number;
  format: string;
  updatedAt?: string;
}

export interface CurrencyAPI {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
  is_active: boolean;
  decimal_places: number;
  format: string;
  updated_at?: string;
}

export function transformCurrency(api: CurrencyAPI): Currency {
  return {
    id: api.id,
    code: api.code,
    name: api.name,
    symbol: api.symbol,
    exchangeRate: api.exchange_rate,
    isDefault: api.is_default,
    isActive: api.is_active,
    decimalPlaces: api.decimal_places,
    format: api.format,
    updatedAt: api.updated_at,
  };
}

// ============================================================================
// TAX TYPES
// ============================================================================

export interface Tax extends HaloBaseEntity {
  name: string;
  code: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  accountCode?: string;
}

export interface TaxAPI {
  id: number;
  name: string;
  code: string;
  rate: number;
  is_default: boolean;
  is_active: boolean;
  description?: string;
  account_code?: string;
}

export function transformTax(api: TaxAPI): Tax {
  return {
    id: api.id,
    name: api.name,
    code: api.code,
    rate: api.rate,
    isDefault: api.is_default,
    isActive: api.is_active,
    description: api.description,
    accountCode: api.account_code,
  };
}

export interface TaxRule extends HaloBaseEntity {
  name: string;
  description?: string;
  taxId: number;
  taxName?: string;
  entityType: string;
  conditions: TaxRuleCondition[];
  priority: number;
  isActive: boolean;
}

export interface TaxRuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface TaxRuleAPI {
  id: number;
  name: string;
  description?: string;
  tax_id: number;
  tax_name?: string;
  entity_type: string;
  conditions: TaxRuleCondition[];
  priority: number;
  is_active: boolean;
}

export function transformTaxRule(api: TaxRuleAPI): TaxRule {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    taxId: api.tax_id,
    taxName: api.tax_name,
    entityType: api.entity_type,
    conditions: api.conditions || [],
    priority: api.priority,
    isActive: api.is_active,
  };
}

// ============================================================================
// HOLIDAY TYPES
// ============================================================================

export interface Holiday extends HaloBaseEntity {
  name: string;
  date: string;
  endDate?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  affectsAllAgents: boolean;
  agentIds?: number[];
  teamIds?: number[];
  countryCode?: string;
  isActive: boolean;
}

export interface HolidayAPI {
  id: number;
  name: string;
  date: string;
  end_date?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  affects_all_agents: boolean;
  agent_ids?: number[];
  team_ids?: number[];
  country_code?: string;
  is_active: boolean;
}

export function transformHoliday(api: HolidayAPI): Holiday {
  return {
    id: api.id,
    name: api.name,
    date: api.date,
    endDate: api.end_date,
    isRecurring: api.is_recurring,
    recurrencePattern: api.recurrence_pattern,
    affectsAllAgents: api.affects_all_agents,
    agentIds: api.agent_ids,
    teamIds: api.team_ids,
    countryCode: api.country_code,
    isActive: api.is_active,
  };
}

// ============================================================================
// COST CENTRE TYPES
// ============================================================================

export interface CostCentre extends HaloBaseEntity {
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  managerId?: number;
  managerName?: string;
  budget?: number;
  budgetPeriod?: string;
  isActive: boolean;
  children?: CostCentre[];
}

export interface CostCentreAPI {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  manager_id?: number;
  manager_name?: string;
  budget?: number;
  budget_period?: string;
  is_active: boolean;
  children?: CostCentreAPI[];
}

export function transformCostCentre(api: CostCentreAPI): CostCentre {
  return {
    id: api.id,
    name: api.name,
    code: api.code,
    description: api.description,
    parentId: api.parent_id,
    parentName: api.parent_name,
    managerId: api.manager_id,
    managerName: api.manager_name,
    budget: api.budget,
    budgetPeriod: api.budget_period,
    isActive: api.is_active,
    children: api.children?.map(transformCostCentre),
  };
}

// ============================================================================
// BUDGET TYPE TYPES
// ============================================================================

export interface BudgetType extends HaloBaseEntity {
  name: string;
  description?: string;
  defaultAmount?: number;
  period: 'monthly' | 'quarterly' | 'yearly' | 'project';
  trackActuals: boolean;
  alertThreshold?: number;
  isActive: boolean;
}

export interface BudgetTypeAPI {
  id: number;
  name: string;
  description?: string;
  default_amount?: number;
  period: 'monthly' | 'quarterly' | 'yearly' | 'project';
  track_actuals: boolean;
  alert_threshold?: number;
  is_active: boolean;
}

export function transformBudgetType(api: BudgetTypeAPI): BudgetType {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    defaultAmount: api.default_amount,
    period: api.period,
    trackActuals: api.track_actuals,
    alertThreshold: api.alert_threshold,
    isActive: api.is_active,
  };
}

// ============================================================================
// QUALIFICATION TYPES
// ============================================================================

export interface Qualification extends HaloBaseEntity {
  name: string;
  description?: string;
  category?: string;
  level?: number;
  expiryMonths?: number;
  requiresRenewal: boolean;
  isActive: boolean;
}

export interface QualificationAPI {
  id: number;
  name: string;
  description?: string;
  category?: string;
  level?: number;
  expiry_months?: number;
  requires_renewal: boolean;
  is_active: boolean;
}

export function transformQualification(api: QualificationAPI): Qualification {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    category: api.category,
    level: api.level,
    expiryMonths: api.expiry_months,
    requiresRenewal: api.requires_renewal,
    isActive: api.is_active,
  };
}

export interface AgentQualification extends HaloBaseEntity {
  agentId: number;
  agentName?: string;
  qualificationId: number;
  qualificationName?: string;
  obtainedDate: string;
  expiryDate?: string;
  certificateNumber?: string;
  notes?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface AgentQualificationAPI {
  id: number;
  agent_id: number;
  agent_name?: string;
  qualification_id: number;
  qualification_name?: string;
  obtained_date: string;
  expiry_date?: string;
  certificate_number?: string;
  notes?: string;
  is_expired: boolean;
  is_expiring_soon: boolean;
}

export function transformAgentQualification(api: AgentQualificationAPI): AgentQualification {
  return {
    id: api.id,
    agentId: api.agent_id,
    agentName: api.agent_name,
    qualificationId: api.qualification_id,
    qualificationName: api.qualification_name,
    obtainedDate: api.obtained_date,
    expiryDate: api.expiry_date,
    certificateNumber: api.certificate_number,
    notes: api.notes,
    isExpired: api.is_expired,
    isExpiringSoon: api.is_expiring_soon,
  };
}

// ============================================================================
// ROADMAP TYPES
// ============================================================================

export interface Roadmap extends HaloBaseEntity {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  ownerId?: number;
  ownerName?: string;
  milestones?: RoadmapMilestone[];
  isPublic: boolean;
}

export interface RoadmapMilestone {
  id: number;
  name: string;
  description?: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  order: number;
}

export interface RoadmapAPI {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  owner_id?: number;
  owner_name?: string;
  milestones?: {
    id: number;
    name: string;
    description?: string;
    target_date: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    progress: number;
    order: number;
  }[];
  is_public: boolean;
}

export function transformRoadmap(api: RoadmapAPI): Roadmap {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    startDate: api.start_date,
    endDate: api.end_date,
    status: api.status,
    ownerId: api.owner_id,
    ownerName: api.owner_name,
    milestones: api.milestones?.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      targetDate: m.target_date,
      status: m.status,
      progress: m.progress,
      order: m.order,
    })),
    isPublic: api.is_public,
  };
}

// ============================================================================
// PASSWORD FIELD TYPES
// ============================================================================

export interface PasswordField extends HaloBaseEntity {
  name: string;
  description?: string;
  entityType: string;
  entityId: number;
  username?: string;
  password: string; // Encrypted/masked
  url?: string;
  notes?: string;
  lastRotated?: string;
  expiryDays?: number;
  isExpired: boolean;
  createdBy: number;
  createdByName?: string;
}

export interface PasswordFieldAPI {
  id: number;
  name: string;
  description?: string;
  entity_type: string;
  entity_id: number;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  last_rotated?: string;
  expiry_days?: number;
  is_expired: boolean;
  created_by: number;
  created_by_name?: string;
}

export function transformPasswordField(api: PasswordFieldAPI): PasswordField {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    entityType: api.entity_type,
    entityId: api.entity_id,
    username: api.username,
    password: api.password,
    url: api.url,
    notes: api.notes,
    lastRotated: api.last_rotated,
    expiryDays: api.expiry_days,
    isExpired: api.is_expired,
    createdBy: api.created_by,
    createdByName: api.created_by_name,
  };
}

// ============================================================================
// BOOKMARK TYPES
// ============================================================================

export interface Bookmark extends HaloBaseEntity {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  category?: string;
  entityType?: string;
  entityId?: number;
  agentId?: number;
  isGlobal: boolean;
  order: number;
}

export interface BookmarkAPI {
  id: number;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  category?: string;
  entity_type?: string;
  entity_id?: number;
  agent_id?: number;
  is_global: boolean;
  order: number;
}

export function transformBookmark(api: BookmarkAPI): Bookmark {
  return {
    id: api.id,
    name: api.name,
    url: api.url,
    description: api.description,
    icon: api.icon,
    category: api.category,
    entityType: api.entity_type,
    entityId: api.entity_id,
    agentId: api.agent_id,
    isGlobal: api.is_global,
    order: api.order,
  };
}

// ============================================================================
// MAIL CAMPAIGN TYPES
// ============================================================================

export interface MailCampaign extends HaloBaseEntity {
  name: string;
  subject: string;
  body: string;
  templateId?: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledAt?: string;
  sentAt?: string;
  recipientType: 'clients' | 'users' | 'agents' | 'custom';
  recipientFilter?: Record<string, unknown>;
  recipientCount: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  createdBy: number;
  createdByName?: string;
}

export interface MailCampaignAPI {
  id: number;
  name: string;
  subject: string;
  body: string;
  template_id?: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  recipient_type: 'clients' | 'users' | 'agents' | 'custom';
  recipient_filter?: Record<string, unknown>;
  recipient_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  created_by: number;
  created_by_name?: string;
}

export function transformMailCampaign(api: MailCampaignAPI): MailCampaign {
  return {
    id: api.id,
    name: api.name,
    subject: api.subject,
    body: api.body,
    templateId: api.template_id,
    status: api.status,
    scheduledAt: api.scheduled_at,
    sentAt: api.sent_at,
    recipientType: api.recipient_type,
    recipientFilter: api.recipient_filter,
    recipientCount: api.recipient_count,
    sentCount: api.sent_count,
    openedCount: api.opened_count,
    clickedCount: api.clicked_count,
    bouncedCount: api.bounced_count,
    unsubscribedCount: api.unsubscribed_count,
    createdBy: api.created_by,
    createdByName: api.created_by_name,
  };
}

// ============================================================================
// DOCUMENT CREATION TYPES
// ============================================================================

export interface DocumentTemplate extends HaloBaseEntity {
  name: string;
  description?: string;
  templateType: 'word' | 'excel' | 'pdf' | 'html';
  entityType: string;
  content: string;
  variables: DocumentVariable[];
  isActive: boolean;
}

export interface DocumentVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'list';
  defaultValue?: string;
  isRequired: boolean;
}

export interface DocumentTemplateAPI {
  id: number;
  name: string;
  description?: string;
  template_type: 'word' | 'excel' | 'pdf' | 'html';
  entity_type: string;
  content: string;
  variables: DocumentVariable[];
  is_active: boolean;
}

export function transformDocumentTemplate(api: DocumentTemplateAPI): DocumentTemplate {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    templateType: api.template_type,
    entityType: api.entity_type,
    content: api.content,
    variables: api.variables || [],
    isActive: api.is_active,
  };
}

export interface GeneratedDocument extends HaloBaseEntity {
  name: string;
  templateId: number;
  templateName?: string;
  entityType: string;
  entityId: number;
  format: string;
  fileUrl: string;
  fileSize: number;
  generatedAt: string;
  generatedBy: number;
  generatedByName?: string;
}

export interface GeneratedDocumentAPI {
  id: number;
  name: string;
  template_id: number;
  template_name?: string;
  entity_type: string;
  entity_id: number;
  format: string;
  file_url: string;
  file_size: number;
  generated_at: string;
  generated_by: number;
  generated_by_name?: string;
}

export function transformGeneratedDocument(api: GeneratedDocumentAPI): GeneratedDocument {
  return {
    id: api.id,
    name: api.name,
    templateId: api.template_id,
    templateName: api.template_name,
    entityType: api.entity_type,
    entityId: api.entity_id,
    format: api.format,
    fileUrl: api.file_url,
    fileSize: api.file_size,
    generatedAt: api.generated_at,
    generatedBy: api.generated_by,
    generatedByName: api.generated_by_name,
  };
}

// ============================================================================
// PDF TEMPLATE TYPES
// ============================================================================

export interface PdfTemplate extends HaloBaseEntity {
  name: string;
  description?: string;
  entityType: string;
  templateContent: string;
  headerContent?: string;
  footerContent?: string;
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  isDefault: boolean;
  isActive: boolean;
}

export interface PdfTemplateAPI {
  id: number;
  name: string;
  description?: string;
  entity_type: string;
  template_content: string;
  header_content?: string;
  footer_content?: string;
  page_size: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  is_default: boolean;
  is_active: boolean;
}

export function transformPdfTemplate(api: PdfTemplateAPI): PdfTemplate {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    entityType: api.entity_type,
    templateContent: api.template_content,
    headerContent: api.header_content,
    footerContent: api.footer_content,
    pageSize: api.page_size,
    orientation: api.orientation,
    margins: api.margins,
    isDefault: api.is_default,
    isActive: api.is_active,
  };
}

// ============================================================================
// EXTERNAL LINK TYPES
// ============================================================================

export interface ExternalLink extends HaloBaseEntity {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  entityType: string;
  entityId: number;
  openInNewTab: boolean;
  isActive: boolean;
  order: number;
}

export interface ExternalLinkAPI {
  id: number;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  entity_type: string;
  entity_id: number;
  open_in_new_tab: boolean;
  is_active: boolean;
  order: number;
}

export function transformExternalLink(api: ExternalLinkAPI): ExternalLink {
  return {
    id: api.id,
    name: api.name,
    url: api.url,
    description: api.description,
    icon: api.icon,
    entityType: api.entity_type,
    entityId: api.entity_id,
    openInNewTab: api.open_in_new_tab,
    isActive: api.is_active,
    order: api.order,
  };
}

// ============================================================================
// POPUP NOTE TYPES
// ============================================================================

export interface PopupNote extends HaloBaseEntity {
  title: string;
  content: string;
  entityType: string;
  entityId: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  showOnLoad: boolean;
  requireAcknowledgement: boolean;
  expiresAt?: string;
  createdBy: number;
  createdByName?: string;
  acknowledgedBy?: number[];
  isActive: boolean;
}

export interface PopupNoteAPI {
  id: number;
  title: string;
  content: string;
  entity_type: string;
  entity_id: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  show_on_load: boolean;
  require_acknowledgement: boolean;
  expires_at?: string;
  created_by: number;
  created_by_name?: string;
  acknowledged_by?: number[];
  is_active: boolean;
}

export function transformPopupNote(api: PopupNoteAPI): PopupNote {
  return {
    id: api.id,
    title: api.title,
    content: api.content,
    entityType: api.entity_type,
    entityId: api.entity_id,
    priority: api.priority,
    showOnLoad: api.show_on_load,
    requireAcknowledgement: api.require_acknowledgement,
    expiresAt: api.expires_at,
    createdBy: api.created_by,
    createdByName: api.created_by_name,
    acknowledgedBy: api.acknowledged_by,
    isActive: api.is_active,
  };
}

// ============================================================================
// LIST PARAMS
// ============================================================================

export interface CurrencyListParams {
  pageSize?: number;
  pageNo?: number;
  isActive?: boolean;
  search?: string;
}

export interface TaxListParams {
  pageSize?: number;
  pageNo?: number;
  isActive?: boolean;
  search?: string;
}

export interface HolidayListParams {
  pageSize?: number;
  pageNo?: number;
  year?: number;
  countryCode?: string;
  isActive?: boolean;
}

export interface CostCentreListParams {
  pageSize?: number;
  pageNo?: number;
  parentId?: number;
  isActive?: boolean;
  search?: string;
  includeChildren?: boolean;
}

export interface QualificationListParams {
  pageSize?: number;
  pageNo?: number;
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface AgentQualificationListParams {
  pageSize?: number;
  pageNo?: number;
  agentId?: number;
  qualificationId?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
}

export interface RoadmapListParams {
  pageSize?: number;
  pageNo?: number;
  status?: string;
  ownerId?: number;
  isPublic?: boolean;
}

export interface PasswordFieldListParams {
  pageSize?: number;
  pageNo?: number;
  entityType?: string;
  entityId?: number;
  isExpired?: boolean;
  search?: string;
}

export interface BookmarkListParams {
  pageSize?: number;
  pageNo?: number;
  agentId?: number;
  category?: string;
  isGlobal?: boolean;
}

export interface MailCampaignListParams {
  pageSize?: number;
  pageNo?: number;
  status?: string;
  recipientType?: string;
  createdBy?: number;
  search?: string;
}

export interface DocumentTemplateListParams {
  pageSize?: number;
  pageNo?: number;
  templateType?: string;
  entityType?: string;
  isActive?: boolean;
  search?: string;
}

export interface PdfTemplateListParams {
  pageSize?: number;
  pageNo?: number;
  entityType?: string;
  isActive?: boolean;
  search?: string;
}

export interface ExternalLinkListParams {
  pageSize?: number;
  pageNo?: number;
  entityType?: string;
  entityId?: number;
  isActive?: boolean;
}

export interface PopupNoteListParams {
  pageSize?: number;
  pageNo?: number;
  entityType?: string;
  entityId?: number;
  priority?: string;
  isActive?: boolean;
}
