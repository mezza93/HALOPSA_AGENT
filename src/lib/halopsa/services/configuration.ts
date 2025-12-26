/**
 * Configuration service for HaloPSA system settings.
 */

import { HaloPSAClient } from '../client';
import { ListParams, PaginatedResponse } from '../types/common';

// Configuration types
export interface CustomField {
  id: number;
  name: string;
  label?: string;
  type?: string;
  table?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  options?: string[];
}

export interface TicketStatus {
  id: number;
  name: string;
  isOpen?: boolean;
  isClosed?: boolean;
  isDefault?: boolean;
  colour?: string;
}

export interface TicketType {
  id: number;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface Priority {
  id: number;
  name: string;
  colour?: string;
  isDefault?: boolean;
  slaId?: number;
}

export interface Category {
  id: number;
  name: string;
  level?: number;
  parentId?: number;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  agentCount?: number;
  inactive?: boolean;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  triggerType?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject?: string;
  body?: string;
  isActive?: boolean;
}

export interface TicketTemplate {
  id: number;
  name: string;
  summary?: string;
  details?: string;
  ticketTypeId?: number;
  priorityId?: number;
  categoryId?: number;
}

/**
 * Service for configuration/system settings operations.
 */
export class ConfigurationService {
  private client: HaloPSAClient;

  constructor(client: HaloPSAClient) {
    this.client = client;
  }

  // === Custom Fields ===
  async listCustomFields(params: ListParams = {}): Promise<CustomField[]> {
    const response = await this.client.get<PaginatedResponse<CustomField> | CustomField[]>(
      '/CustomField',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getCustomField(id: number): Promise<CustomField> {
    return this.client.get<CustomField>(`/CustomField/${id}`);
  }

  async createCustomField(data: Partial<CustomField>): Promise<CustomField[]> {
    return this.client.post<CustomField[]>('/CustomField', [data]);
  }

  // === Ticket Statuses ===
  async listTicketStatuses(params: ListParams = {}): Promise<TicketStatus[]> {
    const response = await this.client.get<PaginatedResponse<TicketStatus> | TicketStatus[]>(
      '/Status',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getTicketStatus(id: number): Promise<TicketStatus> {
    return this.client.get<TicketStatus>(`/Status/${id}`);
  }

  // === Ticket Types ===
  async listTicketTypes(params: ListParams = {}): Promise<TicketType[]> {
    const response = await this.client.get<PaginatedResponse<TicketType> | TicketType[]>(
      '/TicketType',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getTicketType(id: number): Promise<TicketType> {
    return this.client.get<TicketType>(`/TicketType/${id}`);
  }

  // === Priorities ===
  async listPriorities(params: ListParams = {}): Promise<Priority[]> {
    const response = await this.client.get<PaginatedResponse<Priority> | Priority[]>(
      '/Priority',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getPriority(id: number): Promise<Priority> {
    return this.client.get<Priority>(`/Priority/${id}`);
  }

  // === Categories ===
  async listCategories(params: ListParams = {}): Promise<Category[]> {
    const response = await this.client.get<PaginatedResponse<Category> | Category[]>(
      '/Category',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getCategory(id: number): Promise<Category> {
    return this.client.get<Category>(`/Category/${id}`);
  }

  // === Teams ===
  async listTeams(params: ListParams = {}): Promise<Team[]> {
    const response = await this.client.get<PaginatedResponse<Team> | Team[]>(
      '/Team',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getTeam(id: number): Promise<Team> {
    return this.client.get<Team>(`/Team/${id}`);
  }

  // === Workflows ===
  async listWorkflows(params: ListParams = {}): Promise<Workflow[]> {
    const response = await this.client.get<PaginatedResponse<Workflow> | Workflow[]>(
      '/Workflow',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getWorkflow(id: number): Promise<Workflow> {
    return this.client.get<Workflow>(`/Workflow/${id}`);
  }

  async createWorkflow(data: Partial<Workflow>): Promise<Workflow[]> {
    return this.client.post<Workflow[]>('/Workflow', [data]);
  }

  async toggleWorkflow(id: number, isActive: boolean): Promise<Workflow[]> {
    return this.client.post<Workflow[]>('/Workflow', [{ id, isActive }]);
  }

  // === Email Templates ===
  async listEmailTemplates(params: ListParams = {}): Promise<EmailTemplate[]> {
    const response = await this.client.get<PaginatedResponse<EmailTemplate> | EmailTemplate[]>(
      '/EmailTemplate',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate> {
    return this.client.get<EmailTemplate>(`/EmailTemplate/${id}`);
  }

  async createEmailTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate[]> {
    return this.client.post<EmailTemplate[]>('/EmailTemplate', [data]);
  }

  async updateEmailTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate[]> {
    return this.client.post<EmailTemplate[]>('/EmailTemplate', [data]);
  }

  // === Ticket Templates ===
  async listTicketTemplates(params: ListParams = {}): Promise<TicketTemplate[]> {
    const response = await this.client.get<PaginatedResponse<TicketTemplate> | TicketTemplate[]>(
      '/TicketTemplate',
      { count: params.count || 100, ...params }
    );
    return Array.isArray(response) ? response : response.records || [];
  }

  async getTicketTemplate(id: number): Promise<TicketTemplate> {
    return this.client.get<TicketTemplate>(`/TicketTemplate/${id}`);
  }

  async createTicketTemplate(data: Partial<TicketTemplate>): Promise<TicketTemplate[]> {
    return this.client.post<TicketTemplate[]>('/TicketTemplate', [data]);
  }
}
