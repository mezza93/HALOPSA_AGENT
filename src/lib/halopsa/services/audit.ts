/**
 * HaloPSA Audit Service.
 * Phase 4: Productivity & Automation
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  AuditLog,
  AuditLogAPI,
  AuditLogListParams,
  AuditSummary,
  AuditSummaryAPI,
  AuditSummaryParams,
  AuditPolicy,
  AuditPolicyAPI,
  AuditPolicyListParams,
  EntityHistory,
  EntityHistoryAPI,
  EntityHistoryParams,
  SecurityEvent,
  SecurityEventAPI,
  SecurityEventListParams,
  AuditEntityType,
  transformAuditLog,
  transformAuditSummary,
  transformAuditPolicy,
  transformEntityHistory,
  transformSecurityEvent,
} from '../types';

/**
 * Service for accessing audit logs.
 */
export class AuditService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List audit logs with optional filters.
   */
  async list(params?: AuditLogListParams): Promise<AuditLog[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.action) queryParams.action = params.action;
    if (params?.actions) queryParams.actions = params.actions.join(',');
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityTypes) queryParams.entity_types = params.entityTypes.join(',');
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.userId) queryParams.user_id = params.userId;
    if (params?.userType) queryParams.user_type = params.userType;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.search) queryParams.search = params.search;
    if (params?.ipAddress) queryParams.ip_address = params.ipAddress;
    if (params?.isSystemGenerated !== undefined) queryParams.is_system_generated = params.isSystemGenerated;
    if (params?.clientId) queryParams.client_id = params.clientId;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ logs: AuditLogAPI[] }>('/Audit', queryParams);
    return (response.logs || []).map(transformAuditLog);
  }

  /**
   * Get a specific audit log entry by ID.
   */
  async get(id: number): Promise<AuditLog> {
    const response = await this.client.get<AuditLogAPI>(`/Audit/${id}`);
    return transformAuditLog(response);
  }

  /**
   * Get audit logs for a specific entity.
   */
  async getByEntity(
    entityType: AuditEntityType,
    entityId: number,
    params?: Omit<AuditLogListParams, 'entityType' | 'entityId'>
  ): Promise<AuditLog[]> {
    return this.list({ ...params, entityType, entityId });
  }

  /**
   * Get audit logs for a specific user.
   */
  async getByUser(
    userId: number,
    params?: Omit<AuditLogListParams, 'userId'>
  ): Promise<AuditLog[]> {
    return this.list({ ...params, userId });
  }

  /**
   * Get audit summary/statistics.
   */
  async getSummary(params: AuditSummaryParams): Promise<AuditSummary> {
    const queryParams: ListParams = {
      from_date: params.fromDate,
      to_date: params.toDate,
    };

    if (params.entityType) queryParams.entity_type = params.entityType;
    if (params.userId) queryParams.user_id = params.userId;
    if (params.groupBy) queryParams.group_by = params.groupBy;
    if (params.includeTopEntities !== undefined) queryParams.include_top_entities = params.includeTopEntities;
    if (params.topEntitiesLimit) queryParams.top_entities_limit = params.topEntitiesLimit;

    const response = await this.client.get<AuditSummaryAPI>('/Audit/Summary', queryParams);
    return transformAuditSummary(response);
  }

  /**
   * Export audit logs to a file.
   */
  async export(
    params: AuditLogListParams,
    format: 'csv' | 'json' | 'pdf' = 'csv'
  ): Promise<{ url: string; expiresAt: string }> {
    const queryParams: ListParams = { format };

    if (params.fromDate) queryParams.from_date = params.fromDate;
    if (params.toDate) queryParams.to_date = params.toDate;
    if (params.action) queryParams.action = params.action;
    if (params.entityType) queryParams.entity_type = params.entityType;
    if (params.userId) queryParams.user_id = params.userId;

    const response = await this.client.post<{ url: string; expires_at: string }>(
      '/Audit/Export',
      queryParams
    );
    return {
      url: response.url,
      expiresAt: response.expires_at,
    };
  }

  /**
   * Search audit logs with full-text search.
   */
  async search(
    query: string,
    params?: Omit<AuditLogListParams, 'search'>
  ): Promise<AuditLog[]> {
    return this.list({ ...params, search: query });
  }
}

/**
 * Service for managing audit policies.
 */
export class AuditPolicyService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List audit policies.
   */
  async list(params?: AuditPolicyListParams): Promise<AuditPolicy[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.search) queryParams.search = params.search;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ policies: AuditPolicyAPI[] }>('/Audit/Policies', queryParams);
    return (response.policies || []).map(transformAuditPolicy);
  }

  /**
   * Get a specific audit policy by ID.
   */
  async get(id: number): Promise<AuditPolicy> {
    const response = await this.client.get<AuditPolicyAPI>(`/Audit/Policies/${id}`);
    return transformAuditPolicy(response);
  }

  /**
   * Create a new audit policy.
   */
  async create(policy: Partial<AuditPolicy>): Promise<AuditPolicy> {
    const payload = this.toAPIFormat(policy);
    const response = await this.client.post<AuditPolicyAPI>('/Audit/Policies', [payload]);
    return transformAuditPolicy(response);
  }

  /**
   * Update an existing audit policy.
   */
  async update(id: number, policy: Partial<AuditPolicy>): Promise<AuditPolicy> {
    const payload = { ...this.toAPIFormat(policy), id };
    const response = await this.client.post<AuditPolicyAPI>('/Audit/Policies', [payload]);
    return transformAuditPolicy(response);
  }

  /**
   * Delete an audit policy.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Audit/Policies/${id}`);
  }

  /**
   * Enable an audit policy.
   */
  async enable(id: number): Promise<AuditPolicy> {
    return this.update(id, { isEnabled: true });
  }

  /**
   * Disable an audit policy.
   */
  async disable(id: number): Promise<AuditPolicy> {
    return this.update(id, { isEnabled: false });
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(policy: Partial<AuditPolicy>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (policy.name !== undefined) api.name = policy.name;
    if (policy.description !== undefined) api.description = policy.description;
    if (policy.entityType !== undefined) api.entity_type = policy.entityType;
    if (policy.actions !== undefined) api.actions = policy.actions;
    if (policy.retentionDays !== undefined) api.retention_days = policy.retentionDays;
    if (policy.archiveEnabled !== undefined) api.archive_enabled = policy.archiveEnabled;
    if (policy.archiveLocation !== undefined) api.archive_location = policy.archiveLocation;
    if (policy.isEnabled !== undefined) api.is_enabled = policy.isEnabled;
    if (policy.isDefault !== undefined) api.is_default = policy.isDefault;

    return api;
  }
}

/**
 * Service for accessing entity change history.
 */
export class EntityHistoryService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Get change history for a specific entity.
   */
  async getHistory(params: EntityHistoryParams): Promise<EntityHistory[]> {
    const queryParams: ListParams = {
      entity_type: params.entityType,
      entity_id: params.entityId,
    };

    if (params.pageSize) queryParams.page_size = params.pageSize;
    if (params.pageNo) queryParams.page_no = params.pageNo;
    if (params.fromDate) queryParams.from_date = params.fromDate;
    if (params.toDate) queryParams.to_date = params.toDate;
    if (params.action) queryParams.action = params.action;
    if (params.orderBy) queryParams.order_by = params.orderBy;
    if (params.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ history: EntityHistoryAPI[] }>('/Audit/History', queryParams);
    return (response.history || []).map(transformEntityHistory);
  }

  /**
   * Get a specific history entry by ID.
   */
  async get(id: number): Promise<EntityHistory> {
    const response = await this.client.get<EntityHistoryAPI>(`/Audit/History/${id}`);
    return transformEntityHistory(response);
  }

  /**
   * Get history for a ticket.
   */
  async getTicketHistory(
    ticketId: number,
    params?: Omit<EntityHistoryParams, 'entityType' | 'entityId'>
  ): Promise<EntityHistory[]> {
    return this.getHistory({ ...params, entityType: 'ticket', entityId: ticketId });
  }

  /**
   * Get history for a client.
   */
  async getClientHistory(
    clientId: number,
    params?: Omit<EntityHistoryParams, 'entityType' | 'entityId'>
  ): Promise<EntityHistory[]> {
    return this.getHistory({ ...params, entityType: 'client', entityId: clientId });
  }

  /**
   * Get history for an asset.
   */
  async getAssetHistory(
    assetId: number,
    params?: Omit<EntityHistoryParams, 'entityType' | 'entityId'>
  ): Promise<EntityHistory[]> {
    return this.getHistory({ ...params, entityType: 'asset', entityId: assetId });
  }

  /**
   * Compare two versions of an entity.
   */
  async compareVersions(
    entityType: AuditEntityType,
    entityId: number,
    version1: number,
    version2: number
  ): Promise<{
    version1: EntityHistory;
    version2: EntityHistory;
    differences: { field: string; value1: unknown; value2: unknown }[];
  }> {
    const response = await this.client.get<{
      version1: EntityHistoryAPI;
      version2: EntityHistoryAPI;
      differences: { field: string; value1: unknown; value2: unknown }[];
    }>('/Audit/History/Compare', {
      entity_type: entityType,
      entity_id: entityId,
      version1,
      version2,
    });

    return {
      version1: transformEntityHistory(response.version1),
      version2: transformEntityHistory(response.version2),
      differences: response.differences,
    };
  }

  /**
   * Restore an entity to a previous version.
   */
  async restoreVersion(
    entityType: AuditEntityType,
    entityId: number,
    version: number
  ): Promise<EntityHistory> {
    const response = await this.client.post<EntityHistoryAPI>('/Audit/History/Restore', {
      entity_type: entityType,
      entity_id: entityId,
      version,
    });
    return transformEntityHistory(response);
  }
}

/**
 * Service for managing security events.
 */
export class SecurityEventService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List security events.
   */
  async list(params?: SecurityEventListParams): Promise<SecurityEvent[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.eventType) queryParams.event_type = params.eventType;
    if (params?.severity) queryParams.severity = params.severity;
    if (params?.userId) queryParams.user_id = params.userId;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.isResolved !== undefined) queryParams.is_resolved = params.isResolved;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ events: SecurityEventAPI[] }>('/Audit/Security', queryParams);
    return (response.events || []).map(transformSecurityEvent);
  }

  /**
   * Get a specific security event by ID.
   */
  async get(id: number): Promise<SecurityEvent> {
    const response = await this.client.get<SecurityEventAPI>(`/Audit/Security/${id}`);
    return transformSecurityEvent(response);
  }

  /**
   * Get unresolved security events.
   */
  async getUnresolved(params?: Omit<SecurityEventListParams, 'isResolved'>): Promise<SecurityEvent[]> {
    return this.list({ ...params, isResolved: false });
  }

  /**
   * Get critical security events.
   */
  async getCritical(params?: Omit<SecurityEventListParams, 'severity'>): Promise<SecurityEvent[]> {
    return this.list({ ...params, severity: 'critical' });
  }

  /**
   * Resolve a security event.
   */
  async resolve(id: number, resolution: string): Promise<SecurityEvent> {
    const response = await this.client.post<SecurityEventAPI>(`/Audit/Security/${id}/Resolve`, {
      resolution,
    });
    return transformSecurityEvent(response);
  }

  /**
   * Get security events for a specific user.
   */
  async getByUser(
    userId: number,
    params?: Omit<SecurityEventListParams, 'userId'>
  ): Promise<SecurityEvent[]> {
    return this.list({ ...params, userId });
  }

  /**
   * Get failed login attempts.
   */
  async getFailedLogins(params?: Omit<SecurityEventListParams, 'eventType'>): Promise<SecurityEvent[]> {
    return this.list({ ...params, eventType: 'login_failure' });
  }
}
