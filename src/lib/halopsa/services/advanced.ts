/**
 * HaloPSA Advanced Feature Services.
 * Phase 6: Advanced Features
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  Currency,
  CurrencyAPI,
  CurrencyListParams,
  Tax,
  TaxAPI,
  TaxListParams,
  TaxRule,
  TaxRuleAPI,
  Holiday,
  HolidayAPI,
  HolidayListParams,
  CostCentre,
  CostCentreAPI,
  CostCentreListParams,
  BudgetType,
  BudgetTypeAPI,
  Qualification,
  QualificationAPI,
  QualificationListParams,
  AgentQualification,
  AgentQualificationAPI,
  AgentQualificationListParams,
  Roadmap,
  RoadmapAPI,
  RoadmapListParams,
  PasswordField,
  PasswordFieldAPI,
  PasswordFieldListParams,
  Bookmark,
  BookmarkAPI,
  BookmarkListParams,
  MailCampaign,
  MailCampaignAPI,
  MailCampaignListParams,
  DocumentTemplate,
  DocumentTemplateAPI,
  DocumentTemplateListParams,
  GeneratedDocument,
  GeneratedDocumentAPI,
  PdfTemplate,
  PdfTemplateAPI,
  PdfTemplateListParams,
  ExternalLink,
  ExternalLinkAPI,
  ExternalLinkListParams,
  PopupNote,
  PopupNoteAPI,
  PopupNoteListParams,
  transformCurrency,
  transformTax,
  transformTaxRule,
  transformHoliday,
  transformCostCentre,
  transformBudgetType,
  transformQualification,
  transformAgentQualification,
  transformRoadmap,
  transformPasswordField,
  transformBookmark,
  transformMailCampaign,
  transformDocumentTemplate,
  transformGeneratedDocument,
  transformPdfTemplate,
  transformExternalLink,
  transformPopupNote,
} from '../types';

// ============================================================================
// CURRENCY SERVICE
// ============================================================================

export class CurrencyService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: CurrencyListParams): Promise<Currency[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ currencies: CurrencyAPI[] }>('/Currency', queryParams);
    return (response.currencies || []).map(transformCurrency);
  }

  async get(id: number): Promise<Currency> {
    const response = await this.client.get<CurrencyAPI>(`/Currency/${id}`);
    return transformCurrency(response);
  }

  async getDefault(): Promise<Currency> {
    const currencies = await this.list({ isActive: true });
    const defaultCurrency = currencies.find((c) => c.isDefault);
    if (!defaultCurrency) throw new Error('No default currency found');
    return defaultCurrency;
  }

  async create(currency: Partial<Currency>): Promise<Currency> {
    const payload = this.toAPIFormat(currency);
    const response = await this.client.post<CurrencyAPI>('/Currency', [payload]);
    return transformCurrency(response);
  }

  async update(id: number, currency: Partial<Currency>): Promise<Currency> {
    const payload = { ...this.toAPIFormat(currency), id };
    const response = await this.client.post<CurrencyAPI>('/Currency', [payload]);
    return transformCurrency(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/Currency/${id}`);
  }

  async setDefault(id: number): Promise<Currency> {
    const response = await this.client.post<CurrencyAPI>(`/Currency/${id}/SetDefault`, {});
    return transformCurrency(response);
  }

  async updateExchangeRate(id: number, rate: number): Promise<Currency> {
    const response = await this.client.post<CurrencyAPI>(`/Currency/${id}`, [{ id, exchange_rate: rate }]);
    return transformCurrency(response);
  }

  private toAPIFormat(currency: Partial<Currency>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (currency.code !== undefined) api.code = currency.code;
    if (currency.name !== undefined) api.name = currency.name;
    if (currency.symbol !== undefined) api.symbol = currency.symbol;
    if (currency.exchangeRate !== undefined) api.exchange_rate = currency.exchangeRate;
    if (currency.isDefault !== undefined) api.is_default = currency.isDefault;
    if (currency.isActive !== undefined) api.is_active = currency.isActive;
    if (currency.decimalPlaces !== undefined) api.decimal_places = currency.decimalPlaces;
    if (currency.format !== undefined) api.format = currency.format;
    return api;
  }
}

// ============================================================================
// TAX SERVICE
// ============================================================================

export class TaxService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: TaxListParams): Promise<Tax[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ taxes: TaxAPI[] }>('/Tax', queryParams);
    return (response.taxes || []).map(transformTax);
  }

  async get(id: number): Promise<Tax> {
    const response = await this.client.get<TaxAPI>(`/Tax/${id}`);
    return transformTax(response);
  }

  async getDefault(): Promise<Tax> {
    const taxes = await this.list({ isActive: true });
    const defaultTax = taxes.find((t) => t.isDefault);
    if (!defaultTax) throw new Error('No default tax found');
    return defaultTax;
  }

  async create(tax: Partial<Tax>): Promise<Tax> {
    const payload = this.toAPIFormat(tax);
    const response = await this.client.post<TaxAPI>('/Tax', [payload]);
    return transformTax(response);
  }

  async update(id: number, tax: Partial<Tax>): Promise<Tax> {
    const payload = { ...this.toAPIFormat(tax), id };
    const response = await this.client.post<TaxAPI>('/Tax', [payload]);
    return transformTax(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/Tax/${id}`);
  }

  async setDefault(id: number): Promise<Tax> {
    const response = await this.client.post<TaxAPI>(`/Tax/${id}/SetDefault`, {});
    return transformTax(response);
  }

  private toAPIFormat(tax: Partial<Tax>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (tax.name !== undefined) api.name = tax.name;
    if (tax.code !== undefined) api.code = tax.code;
    if (tax.rate !== undefined) api.rate = tax.rate;
    if (tax.isDefault !== undefined) api.is_default = tax.isDefault;
    if (tax.isActive !== undefined) api.is_active = tax.isActive;
    if (tax.description !== undefined) api.description = tax.description;
    if (tax.accountCode !== undefined) api.account_code = tax.accountCode;
    return api;
  }
}

export class TaxRuleService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: { isActive?: boolean }): Promise<TaxRule[]> {
    const queryParams: ListParams = {};
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

    const response = await this.client.get<{ rules: TaxRuleAPI[] }>('/TaxRule', queryParams);
    return (response.rules || []).map(transformTaxRule);
  }

  async get(id: number): Promise<TaxRule> {
    const response = await this.client.get<TaxRuleAPI>(`/TaxRule/${id}`);
    return transformTaxRule(response);
  }

  async create(rule: Partial<TaxRule>): Promise<TaxRule> {
    const payload = this.toAPIFormat(rule);
    const response = await this.client.post<TaxRuleAPI>('/TaxRule', [payload]);
    return transformTaxRule(response);
  }

  async update(id: number, rule: Partial<TaxRule>): Promise<TaxRule> {
    const payload = { ...this.toAPIFormat(rule), id };
    const response = await this.client.post<TaxRuleAPI>('/TaxRule', [payload]);
    return transformTaxRule(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/TaxRule/${id}`);
  }

  private toAPIFormat(rule: Partial<TaxRule>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (rule.name !== undefined) api.name = rule.name;
    if (rule.description !== undefined) api.description = rule.description;
    if (rule.taxId !== undefined) api.tax_id = rule.taxId;
    if (rule.entityType !== undefined) api.entity_type = rule.entityType;
    if (rule.conditions !== undefined) api.conditions = rule.conditions;
    if (rule.priority !== undefined) api.priority = rule.priority;
    if (rule.isActive !== undefined) api.is_active = rule.isActive;
    return api;
  }
}

// ============================================================================
// HOLIDAY SERVICE
// ============================================================================

export class HolidayService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: HolidayListParams): Promise<Holiday[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.year) queryParams.year = params.year;
    if (params?.countryCode) queryParams.country_code = params.countryCode;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

    const response = await this.client.get<{ holidays: HolidayAPI[] }>('/Holiday', queryParams);
    return (response.holidays || []).map(transformHoliday);
  }

  async get(id: number): Promise<Holiday> {
    const response = await this.client.get<HolidayAPI>(`/Holiday/${id}`);
    return transformHoliday(response);
  }

  async getUpcoming(days: number = 30): Promise<Holiday[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const holidays = await this.list({ isActive: true });
    return holidays.filter((h) => {
      const date = new Date(h.date);
      return date >= now && date <= future;
    });
  }

  async create(holiday: Partial<Holiday>): Promise<Holiday> {
    const payload = this.toAPIFormat(holiday);
    const response = await this.client.post<HolidayAPI>('/Holiday', [payload]);
    return transformHoliday(response);
  }

  async update(id: number, holiday: Partial<Holiday>): Promise<Holiday> {
    const payload = { ...this.toAPIFormat(holiday), id };
    const response = await this.client.post<HolidayAPI>('/Holiday', [payload]);
    return transformHoliday(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/Holiday/${id}`);
  }

  private toAPIFormat(holiday: Partial<Holiday>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (holiday.name !== undefined) api.name = holiday.name;
    if (holiday.date !== undefined) api.date = holiday.date;
    if (holiday.endDate !== undefined) api.end_date = holiday.endDate;
    if (holiday.isRecurring !== undefined) api.is_recurring = holiday.isRecurring;
    if (holiday.recurrencePattern !== undefined) api.recurrence_pattern = holiday.recurrencePattern;
    if (holiday.affectsAllAgents !== undefined) api.affects_all_agents = holiday.affectsAllAgents;
    if (holiday.agentIds !== undefined) api.agent_ids = holiday.agentIds;
    if (holiday.teamIds !== undefined) api.team_ids = holiday.teamIds;
    if (holiday.countryCode !== undefined) api.country_code = holiday.countryCode;
    if (holiday.isActive !== undefined) api.is_active = holiday.isActive;
    return api;
  }
}

// ============================================================================
// COST CENTRE SERVICE
// ============================================================================

export class CostCentreService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: CostCentreListParams): Promise<CostCentre[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.parentId) queryParams.parent_id = params.parentId;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
    if (params?.search) queryParams.search = params.search;
    if (params?.includeChildren) queryParams.include_children = params.includeChildren;

    const response = await this.client.get<{ cost_centres: CostCentreAPI[] }>('/CostCentres', queryParams);
    return (response.cost_centres || []).map(transformCostCentre);
  }

  async get(id: number): Promise<CostCentre> {
    const response = await this.client.get<CostCentreAPI>(`/CostCentres/${id}`);
    return transformCostCentre(response);
  }

  async getTree(): Promise<CostCentre[]> {
    return this.list({ includeChildren: true, parentId: undefined });
  }

  async create(costCentre: Partial<CostCentre>): Promise<CostCentre> {
    const payload = this.toAPIFormat(costCentre);
    const response = await this.client.post<CostCentreAPI>('/CostCentres', [payload]);
    return transformCostCentre(response);
  }

  async update(id: number, costCentre: Partial<CostCentre>): Promise<CostCentre> {
    const payload = { ...this.toAPIFormat(costCentre), id };
    const response = await this.client.post<CostCentreAPI>('/CostCentres', [payload]);
    return transformCostCentre(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/CostCentres/${id}`);
  }

  private toAPIFormat(costCentre: Partial<CostCentre>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (costCentre.name !== undefined) api.name = costCentre.name;
    if (costCentre.code !== undefined) api.code = costCentre.code;
    if (costCentre.description !== undefined) api.description = costCentre.description;
    if (costCentre.parentId !== undefined) api.parent_id = costCentre.parentId;
    if (costCentre.managerId !== undefined) api.manager_id = costCentre.managerId;
    if (costCentre.budget !== undefined) api.budget = costCentre.budget;
    if (costCentre.budgetPeriod !== undefined) api.budget_period = costCentre.budgetPeriod;
    if (costCentre.isActive !== undefined) api.is_active = costCentre.isActive;
    return api;
  }
}

// ============================================================================
// BUDGET TYPE SERVICE
// ============================================================================

export class BudgetTypeService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: { isActive?: boolean }): Promise<BudgetType[]> {
    const queryParams: ListParams = {};
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

    const response = await this.client.get<{ budget_types: BudgetTypeAPI[] }>('/BudgetType', queryParams);
    return (response.budget_types || []).map(transformBudgetType);
  }

  async get(id: number): Promise<BudgetType> {
    const response = await this.client.get<BudgetTypeAPI>(`/BudgetType/${id}`);
    return transformBudgetType(response);
  }

  async create(budgetType: Partial<BudgetType>): Promise<BudgetType> {
    const payload = this.toAPIFormat(budgetType);
    const response = await this.client.post<BudgetTypeAPI>('/BudgetType', [payload]);
    return transformBudgetType(response);
  }

  async update(id: number, budgetType: Partial<BudgetType>): Promise<BudgetType> {
    const payload = { ...this.toAPIFormat(budgetType), id };
    const response = await this.client.post<BudgetTypeAPI>('/BudgetType', [payload]);
    return transformBudgetType(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/BudgetType/${id}`);
  }

  private toAPIFormat(budgetType: Partial<BudgetType>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (budgetType.name !== undefined) api.name = budgetType.name;
    if (budgetType.description !== undefined) api.description = budgetType.description;
    if (budgetType.defaultAmount !== undefined) api.default_amount = budgetType.defaultAmount;
    if (budgetType.period !== undefined) api.period = budgetType.period;
    if (budgetType.trackActuals !== undefined) api.track_actuals = budgetType.trackActuals;
    if (budgetType.alertThreshold !== undefined) api.alert_threshold = budgetType.alertThreshold;
    if (budgetType.isActive !== undefined) api.is_active = budgetType.isActive;
    return api;
  }
}

// ============================================================================
// QUALIFICATION SERVICE
// ============================================================================

export class QualificationService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: QualificationListParams): Promise<Qualification[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.category) queryParams.category = params.category;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ qualifications: QualificationAPI[] }>('/Qualification', queryParams);
    return (response.qualifications || []).map(transformQualification);
  }

  async get(id: number): Promise<Qualification> {
    const response = await this.client.get<QualificationAPI>(`/Qualification/${id}`);
    return transformQualification(response);
  }

  async create(qualification: Partial<Qualification>): Promise<Qualification> {
    const payload = this.toAPIFormat(qualification);
    const response = await this.client.post<QualificationAPI>('/Qualification', [payload]);
    return transformQualification(response);
  }

  async update(id: number, qualification: Partial<Qualification>): Promise<Qualification> {
    const payload = { ...this.toAPIFormat(qualification), id };
    const response = await this.client.post<QualificationAPI>('/Qualification', [payload]);
    return transformQualification(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/Qualification/${id}`);
  }

  private toAPIFormat(qualification: Partial<Qualification>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (qualification.name !== undefined) api.name = qualification.name;
    if (qualification.description !== undefined) api.description = qualification.description;
    if (qualification.category !== undefined) api.category = qualification.category;
    if (qualification.level !== undefined) api.level = qualification.level;
    if (qualification.expiryMonths !== undefined) api.expiry_months = qualification.expiryMonths;
    if (qualification.requiresRenewal !== undefined) api.requires_renewal = qualification.requiresRenewal;
    if (qualification.isActive !== undefined) api.is_active = qualification.isActive;
    return api;
  }
}

export class AgentQualificationService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: AgentQualificationListParams): Promise<AgentQualification[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.agentId) queryParams.agent_id = params.agentId;
    if (params?.qualificationId) queryParams.qualification_id = params.qualificationId;
    if (params?.isExpired !== undefined) queryParams.is_expired = params.isExpired;
    if (params?.isExpiringSoon !== undefined) queryParams.is_expiring_soon = params.isExpiringSoon;

    const response = await this.client.get<{ agent_qualifications: AgentQualificationAPI[] }>(
      '/AgentQualification',
      queryParams
    );
    return (response.agent_qualifications || []).map(transformAgentQualification);
  }

  async getForAgent(agentId: number): Promise<AgentQualification[]> {
    return this.list({ agentId });
  }

  async getExpiring(days: number = 30): Promise<AgentQualification[]> {
    return this.list({ isExpiringSoon: true });
  }

  async getExpired(): Promise<AgentQualification[]> {
    return this.list({ isExpired: true });
  }

  async assign(
    agentId: number,
    qualificationId: number,
    data: { obtainedDate: string; expiryDate?: string; certificateNumber?: string; notes?: string }
  ): Promise<AgentQualification> {
    const response = await this.client.post<AgentQualificationAPI>('/AgentQualification', [
      {
        agent_id: agentId,
        qualification_id: qualificationId,
        obtained_date: data.obtainedDate,
        expiry_date: data.expiryDate,
        certificate_number: data.certificateNumber,
        notes: data.notes,
      },
    ]);
    return transformAgentQualification(response);
  }

  async revoke(id: number): Promise<void> {
    await this.client.delete(`/AgentQualification/${id}`);
  }

  async renew(id: number, newExpiryDate: string): Promise<AgentQualification> {
    const response = await this.client.post<AgentQualificationAPI>('/AgentQualification', [
      { id, expiry_date: newExpiryDate },
    ]);
    return transformAgentQualification(response);
  }
}

// ============================================================================
// ROADMAP SERVICE
// ============================================================================

export class RoadmapService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: RoadmapListParams): Promise<Roadmap[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.status) queryParams.status = params.status;
    if (params?.ownerId) queryParams.owner_id = params.ownerId;
    if (params?.isPublic !== undefined) queryParams.is_public = params.isPublic;

    const response = await this.client.get<{ roadmaps: RoadmapAPI[] }>('/Roadmap', queryParams);
    return (response.roadmaps || []).map(transformRoadmap);
  }

  async get(id: number): Promise<Roadmap> {
    const response = await this.client.get<RoadmapAPI>(`/Roadmap/${id}`);
    return transformRoadmap(response);
  }

  async create(roadmap: Partial<Roadmap>): Promise<Roadmap> {
    const payload = this.toAPIFormat(roadmap);
    const response = await this.client.post<RoadmapAPI>('/Roadmap', [payload]);
    return transformRoadmap(response);
  }

  async update(id: number, roadmap: Partial<Roadmap>): Promise<Roadmap> {
    const payload = { ...this.toAPIFormat(roadmap), id };
    const response = await this.client.post<RoadmapAPI>('/Roadmap', [payload]);
    return transformRoadmap(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/Roadmap/${id}`);
  }

  async addMilestone(
    roadmapId: number,
    milestone: { name: string; description?: string; targetDate: string; order?: number }
  ): Promise<Roadmap> {
    const response = await this.client.post<RoadmapAPI>(`/Roadmap/${roadmapId}/Milestone`, {
      name: milestone.name,
      description: milestone.description,
      target_date: milestone.targetDate,
      order: milestone.order,
    });
    return transformRoadmap(response);
  }

  async updateMilestoneStatus(
    roadmapId: number,
    milestoneId: number,
    status: 'pending' | 'in_progress' | 'completed' | 'delayed',
    progress?: number
  ): Promise<Roadmap> {
    const response = await this.client.post<RoadmapAPI>(`/Roadmap/${roadmapId}/Milestone/${milestoneId}`, {
      status,
      progress,
    });
    return transformRoadmap(response);
  }

  private toAPIFormat(roadmap: Partial<Roadmap>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (roadmap.name !== undefined) api.name = roadmap.name;
    if (roadmap.description !== undefined) api.description = roadmap.description;
    if (roadmap.startDate !== undefined) api.start_date = roadmap.startDate;
    if (roadmap.endDate !== undefined) api.end_date = roadmap.endDate;
    if (roadmap.status !== undefined) api.status = roadmap.status;
    if (roadmap.ownerId !== undefined) api.owner_id = roadmap.ownerId;
    if (roadmap.isPublic !== undefined) api.is_public = roadmap.isPublic;
    return api;
  }
}

// ============================================================================
// PASSWORD FIELD SERVICE
// ============================================================================

export class PasswordFieldService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: PasswordFieldListParams): Promise<PasswordField[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.isExpired !== undefined) queryParams.is_expired = params.isExpired;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ password_fields: PasswordFieldAPI[] }>('/PasswordField', queryParams);
    return (response.password_fields || []).map(transformPasswordField);
  }

  async get(id: number): Promise<PasswordField> {
    const response = await this.client.get<PasswordFieldAPI>(`/PasswordField/${id}`);
    return transformPasswordField(response);
  }

  async getForEntity(entityType: string, entityId: number): Promise<PasswordField[]> {
    return this.list({ entityType, entityId });
  }

  async create(passwordField: Partial<PasswordField>): Promise<PasswordField> {
    const payload = this.toAPIFormat(passwordField);
    const response = await this.client.post<PasswordFieldAPI>('/PasswordField', [payload]);
    return transformPasswordField(response);
  }

  async update(id: number, passwordField: Partial<PasswordField>): Promise<PasswordField> {
    const payload = { ...this.toAPIFormat(passwordField), id };
    const response = await this.client.post<PasswordFieldAPI>('/PasswordField', [payload]);
    return transformPasswordField(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/PasswordField/${id}`);
  }

  async rotate(id: number, newPassword: string): Promise<PasswordField> {
    const response = await this.client.post<PasswordFieldAPI>(`/PasswordField/${id}/Rotate`, { password: newPassword });
    return transformPasswordField(response);
  }

  async getExpiring(days: number = 30): Promise<PasswordField[]> {
    return this.list({ isExpired: false }); // Filter client-side based on expiry
  }

  private toAPIFormat(passwordField: Partial<PasswordField>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (passwordField.name !== undefined) api.name = passwordField.name;
    if (passwordField.description !== undefined) api.description = passwordField.description;
    if (passwordField.entityType !== undefined) api.entity_type = passwordField.entityType;
    if (passwordField.entityId !== undefined) api.entity_id = passwordField.entityId;
    if (passwordField.username !== undefined) api.username = passwordField.username;
    if (passwordField.password !== undefined) api.password = passwordField.password;
    if (passwordField.url !== undefined) api.url = passwordField.url;
    if (passwordField.notes !== undefined) api.notes = passwordField.notes;
    if (passwordField.expiryDays !== undefined) api.expiry_days = passwordField.expiryDays;
    return api;
  }
}

// ============================================================================
// BOOKMARK SERVICE
// ============================================================================

export class BookmarkService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: BookmarkListParams): Promise<Bookmark[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.agentId) queryParams.agent_id = params.agentId;
    if (params?.category) queryParams.category = params.category;
    if (params?.isGlobal !== undefined) queryParams.is_global = params.isGlobal;

    const response = await this.client.get<{ bookmarks: BookmarkAPI[] }>('/Bookmark', queryParams);
    return (response.bookmarks || []).map(transformBookmark);
  }

  async get(id: number): Promise<Bookmark> {
    const response = await this.client.get<BookmarkAPI>(`/Bookmark/${id}`);
    return transformBookmark(response);
  }

  async getGlobal(): Promise<Bookmark[]> {
    return this.list({ isGlobal: true });
  }

  async getForAgent(agentId: number): Promise<Bookmark[]> {
    return this.list({ agentId });
  }

  async create(bookmark: Partial<Bookmark>): Promise<Bookmark> {
    const payload = this.toAPIFormat(bookmark);
    const response = await this.client.post<BookmarkAPI>('/Bookmark', [payload]);
    return transformBookmark(response);
  }

  async update(id: number, bookmark: Partial<Bookmark>): Promise<Bookmark> {
    const payload = { ...this.toAPIFormat(bookmark), id };
    const response = await this.client.post<BookmarkAPI>('/Bookmark', [payload]);
    return transformBookmark(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/Bookmark/${id}`);
  }

  async reorder(bookmarkIds: number[]): Promise<void> {
    await this.client.post('/Bookmark/Reorder', { bookmark_ids: bookmarkIds });
  }

  private toAPIFormat(bookmark: Partial<Bookmark>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (bookmark.name !== undefined) api.name = bookmark.name;
    if (bookmark.url !== undefined) api.url = bookmark.url;
    if (bookmark.description !== undefined) api.description = bookmark.description;
    if (bookmark.icon !== undefined) api.icon = bookmark.icon;
    if (bookmark.category !== undefined) api.category = bookmark.category;
    if (bookmark.entityType !== undefined) api.entity_type = bookmark.entityType;
    if (bookmark.entityId !== undefined) api.entity_id = bookmark.entityId;
    if (bookmark.agentId !== undefined) api.agent_id = bookmark.agentId;
    if (bookmark.isGlobal !== undefined) api.is_global = bookmark.isGlobal;
    if (bookmark.order !== undefined) api.order = bookmark.order;
    return api;
  }
}

// ============================================================================
// MAIL CAMPAIGN SERVICE
// ============================================================================

export class MailCampaignService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: MailCampaignListParams): Promise<MailCampaign[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.status) queryParams.status = params.status;
    if (params?.recipientType) queryParams.recipient_type = params.recipientType;
    if (params?.createdBy) queryParams.created_by = params.createdBy;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ campaigns: MailCampaignAPI[] }>('/MailCampaign', queryParams);
    return (response.campaigns || []).map(transformMailCampaign);
  }

  async get(id: number): Promise<MailCampaign> {
    const response = await this.client.get<MailCampaignAPI>(`/MailCampaign/${id}`);
    return transformMailCampaign(response);
  }

  async create(campaign: Partial<MailCampaign>): Promise<MailCampaign> {
    const payload = this.toAPIFormat(campaign);
    const response = await this.client.post<MailCampaignAPI>('/MailCampaign', [payload]);
    return transformMailCampaign(response);
  }

  async update(id: number, campaign: Partial<MailCampaign>): Promise<MailCampaign> {
    const payload = { ...this.toAPIFormat(campaign), id };
    const response = await this.client.post<MailCampaignAPI>('/MailCampaign', [payload]);
    return transformMailCampaign(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/MailCampaign/${id}`);
  }

  async schedule(id: number, scheduledAt: string): Promise<MailCampaign> {
    const response = await this.client.post<MailCampaignAPI>(`/MailCampaign/${id}/Schedule`, {
      scheduled_at: scheduledAt,
    });
    return transformMailCampaign(response);
  }

  async send(id: number): Promise<MailCampaign> {
    const response = await this.client.post<MailCampaignAPI>(`/MailCampaign/${id}/Send`, {});
    return transformMailCampaign(response);
  }

  async cancel(id: number): Promise<MailCampaign> {
    const response = await this.client.post<MailCampaignAPI>(`/MailCampaign/${id}/Cancel`, {});
    return transformMailCampaign(response);
  }

  async getStats(id: number): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
  }> {
    const campaign = await this.get(id);
    const openRate = campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0;
    const clickRate = campaign.openedCount > 0 ? (campaign.clickedCount / campaign.openedCount) * 100 : 0;
    return {
      sent: campaign.sentCount,
      opened: campaign.openedCount,
      clicked: campaign.clickedCount,
      bounced: campaign.bouncedCount,
      unsubscribed: campaign.unsubscribedCount,
      openRate,
      clickRate,
    };
  }

  private toAPIFormat(campaign: Partial<MailCampaign>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (campaign.name !== undefined) api.name = campaign.name;
    if (campaign.subject !== undefined) api.subject = campaign.subject;
    if (campaign.body !== undefined) api.body = campaign.body;
    if (campaign.templateId !== undefined) api.template_id = campaign.templateId;
    if (campaign.recipientType !== undefined) api.recipient_type = campaign.recipientType;
    if (campaign.recipientFilter !== undefined) api.recipient_filter = campaign.recipientFilter;
    return api;
  }
}

// ============================================================================
// DOCUMENT CREATION SERVICE
// ============================================================================

export class DocumentCreationService {
  constructor(private client: HaloPSAClient) {}

  async listTemplates(params?: DocumentTemplateListParams): Promise<DocumentTemplate[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.templateType) queryParams.template_type = params.templateType;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ templates: DocumentTemplateAPI[] }>('/DocumentCreation', queryParams);
    return (response.templates || []).map(transformDocumentTemplate);
  }

  async getTemplate(id: number): Promise<DocumentTemplate> {
    const response = await this.client.get<DocumentTemplateAPI>(`/DocumentCreation/${id}`);
    return transformDocumentTemplate(response);
  }

  async createTemplate(template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const payload = this.templateToAPIFormat(template);
    const response = await this.client.post<DocumentTemplateAPI>('/DocumentCreation', [payload]);
    return transformDocumentTemplate(response);
  }

  async updateTemplate(id: number, template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const payload = { ...this.templateToAPIFormat(template), id };
    const response = await this.client.post<DocumentTemplateAPI>('/DocumentCreation', [payload]);
    return transformDocumentTemplate(response);
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.client.delete(`/DocumentCreation/${id}`);
  }

  async generate(
    templateId: number,
    entityType: string,
    entityId: number,
    variables?: Record<string, unknown>
  ): Promise<GeneratedDocument> {
    const response = await this.client.post<GeneratedDocumentAPI>(`/DocumentCreation/${templateId}/Generate`, {
      entity_type: entityType,
      entity_id: entityId,
      variables,
    });
    return transformGeneratedDocument(response);
  }

  async listGenerated(entityType: string, entityId: number): Promise<GeneratedDocument[]> {
    const response = await this.client.get<{ documents: GeneratedDocumentAPI[] }>(
      `/DocumentCreation/Generated`,
      { entity_type: entityType, entity_id: entityId }
    );
    return (response.documents || []).map(transformGeneratedDocument);
  }

  private templateToAPIFormat(template: Partial<DocumentTemplate>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (template.name !== undefined) api.name = template.name;
    if (template.description !== undefined) api.description = template.description;
    if (template.templateType !== undefined) api.template_type = template.templateType;
    if (template.entityType !== undefined) api.entity_type = template.entityType;
    if (template.content !== undefined) api.content = template.content;
    if (template.variables !== undefined) api.variables = template.variables;
    if (template.isActive !== undefined) api.is_active = template.isActive;
    return api;
  }
}

// ============================================================================
// PDF TEMPLATE SERVICE
// ============================================================================

export class PdfTemplateService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: PdfTemplateListParams): Promise<PdfTemplate[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;
    if (params?.search) queryParams.search = params.search;

    const response = await this.client.get<{ templates: PdfTemplateAPI[] }>('/PdfTemplate', queryParams);
    return (response.templates || []).map(transformPdfTemplate);
  }

  async get(id: number): Promise<PdfTemplate> {
    const response = await this.client.get<PdfTemplateAPI>(`/PdfTemplate/${id}`);
    return transformPdfTemplate(response);
  }

  async getDefault(entityType: string): Promise<PdfTemplate | null> {
    const templates = await this.list({ entityType, isActive: true });
    return templates.find((t) => t.isDefault) || null;
  }

  async create(template: Partial<PdfTemplate>): Promise<PdfTemplate> {
    const payload = this.toAPIFormat(template);
    const response = await this.client.post<PdfTemplateAPI>('/PdfTemplate', [payload]);
    return transformPdfTemplate(response);
  }

  async update(id: number, template: Partial<PdfTemplate>): Promise<PdfTemplate> {
    const payload = { ...this.toAPIFormat(template), id };
    const response = await this.client.post<PdfTemplateAPI>('/PdfTemplate', [payload]);
    return transformPdfTemplate(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/PdfTemplate/${id}`);
  }

  async setDefault(id: number): Promise<PdfTemplate> {
    const response = await this.client.post<PdfTemplateAPI>(`/PdfTemplate/${id}/SetDefault`, {});
    return transformPdfTemplate(response);
  }

  async preview(id: number, entityType: string, entityId: number): Promise<{ url: string }> {
    const response = await this.client.post<{ url: string }>(`/PdfTemplate/${id}/Preview`, {
      entity_type: entityType,
      entity_id: entityId,
    });
    return response;
  }

  private toAPIFormat(template: Partial<PdfTemplate>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (template.name !== undefined) api.name = template.name;
    if (template.description !== undefined) api.description = template.description;
    if (template.entityType !== undefined) api.entity_type = template.entityType;
    if (template.templateContent !== undefined) api.template_content = template.templateContent;
    if (template.headerContent !== undefined) api.header_content = template.headerContent;
    if (template.footerContent !== undefined) api.footer_content = template.footerContent;
    if (template.pageSize !== undefined) api.page_size = template.pageSize;
    if (template.orientation !== undefined) api.orientation = template.orientation;
    if (template.margins !== undefined) api.margins = template.margins;
    if (template.isDefault !== undefined) api.is_default = template.isDefault;
    if (template.isActive !== undefined) api.is_active = template.isActive;
    return api;
  }
}

// ============================================================================
// EXTERNAL LINK SERVICE
// ============================================================================

export class ExternalLinkService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: ExternalLinkListParams): Promise<ExternalLink[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

    const response = await this.client.get<{ links: ExternalLinkAPI[] }>('/ExternalLink', queryParams);
    return (response.links || []).map(transformExternalLink);
  }

  async get(id: number): Promise<ExternalLink> {
    const response = await this.client.get<ExternalLinkAPI>(`/ExternalLink/${id}`);
    return transformExternalLink(response);
  }

  async getForEntity(entityType: string, entityId: number): Promise<ExternalLink[]> {
    return this.list({ entityType, entityId });
  }

  async create(link: Partial<ExternalLink>): Promise<ExternalLink> {
    const payload = this.toAPIFormat(link);
    const response = await this.client.post<ExternalLinkAPI>('/ExternalLink', [payload]);
    return transformExternalLink(response);
  }

  async update(id: number, link: Partial<ExternalLink>): Promise<ExternalLink> {
    const payload = { ...this.toAPIFormat(link), id };
    const response = await this.client.post<ExternalLinkAPI>('/ExternalLink', [payload]);
    return transformExternalLink(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/ExternalLink/${id}`);
  }

  private toAPIFormat(link: Partial<ExternalLink>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (link.name !== undefined) api.name = link.name;
    if (link.url !== undefined) api.url = link.url;
    if (link.description !== undefined) api.description = link.description;
    if (link.icon !== undefined) api.icon = link.icon;
    if (link.entityType !== undefined) api.entity_type = link.entityType;
    if (link.entityId !== undefined) api.entity_id = link.entityId;
    if (link.openInNewTab !== undefined) api.open_in_new_tab = link.openInNewTab;
    if (link.isActive !== undefined) api.is_active = link.isActive;
    if (link.order !== undefined) api.order = link.order;
    return api;
  }
}

// ============================================================================
// POPUP NOTE SERVICE
// ============================================================================

export class PopupNoteService {
  constructor(private client: HaloPSAClient) {}

  async list(params?: PopupNoteListParams): Promise<PopupNote[]> {
    const queryParams: ListParams = {};
    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.priority) queryParams.priority = params.priority;
    if (params?.isActive !== undefined) queryParams.is_active = params.isActive;

    const response = await this.client.get<{ notes: PopupNoteAPI[] }>('/PopupNote', queryParams);
    return (response.notes || []).map(transformPopupNote);
  }

  async get(id: number): Promise<PopupNote> {
    const response = await this.client.get<PopupNoteAPI>(`/PopupNote/${id}`);
    return transformPopupNote(response);
  }

  async getForEntity(entityType: string, entityId: number): Promise<PopupNote[]> {
    return this.list({ entityType, entityId, isActive: true });
  }

  async getCritical(): Promise<PopupNote[]> {
    return this.list({ priority: 'critical', isActive: true });
  }

  async create(note: Partial<PopupNote>): Promise<PopupNote> {
    const payload = this.toAPIFormat(note);
    const response = await this.client.post<PopupNoteAPI>('/PopupNote', [payload]);
    return transformPopupNote(response);
  }

  async update(id: number, note: Partial<PopupNote>): Promise<PopupNote> {
    const payload = { ...this.toAPIFormat(note), id };
    const response = await this.client.post<PopupNoteAPI>('/PopupNote', [payload]);
    return transformPopupNote(response);
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/PopupNote/${id}`);
  }

  async acknowledge(id: number, agentId: number): Promise<PopupNote> {
    const response = await this.client.post<PopupNoteAPI>(`/PopupNote/${id}/Acknowledge`, { agent_id: agentId });
    return transformPopupNote(response);
  }

  private toAPIFormat(note: Partial<PopupNote>): Record<string, unknown> {
    const api: Record<string, unknown> = {};
    if (note.title !== undefined) api.title = note.title;
    if (note.content !== undefined) api.content = note.content;
    if (note.entityType !== undefined) api.entity_type = note.entityType;
    if (note.entityId !== undefined) api.entity_id = note.entityId;
    if (note.priority !== undefined) api.priority = note.priority;
    if (note.showOnLoad !== undefined) api.show_on_load = note.showOnLoad;
    if (note.requireAcknowledgement !== undefined) api.require_acknowledgement = note.requireAcknowledgement;
    if (note.expiresAt !== undefined) api.expires_at = note.expiresAt;
    if (note.isActive !== undefined) api.is_active = note.isActive;
    return api;
  }
}
