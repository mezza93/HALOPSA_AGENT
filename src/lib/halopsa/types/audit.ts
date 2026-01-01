/**
 * HaloPSA Audit types.
 * Phase 4: Productivity & Automation
 */

import { HaloBaseEntity } from './common';

// ==========================================
// Audit Types
// ==========================================

/**
 * Audit action types.
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'password_change'
  | 'permission_change'
  | 'setting_change'
  | 'email_sent'
  | 'sms_sent'
  | 'api_call'
  | 'webhook_triggered'
  | 'rule_executed'
  | 'approval_action'
  | 'bulk_action'
  | 'integration_sync'
  | 'report_generated'
  | 'backup_created'
  | 'restore_performed';

/**
 * Audit entity types.
 */
export type AuditEntityType =
  | 'ticket'
  | 'client'
  | 'site'
  | 'user'
  | 'agent'
  | 'team'
  | 'asset'
  | 'contract'
  | 'invoice'
  | 'opportunity'
  | 'quotation'
  | 'project'
  | 'kb_article'
  | 'service'
  | 'product'
  | 'supplier'
  | 'webhook'
  | 'rule'
  | 'approval'
  | 'release'
  | 'cab'
  | 'report'
  | 'setting'
  | 'integration'
  | 'role'
  | 'permission'
  | 'system';

/**
 * Audit log entry.
 */
export interface AuditLog extends HaloBaseEntity {
  id: number;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: number;
  entityName?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userType?: 'agent' | 'user' | 'system' | 'api';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: string;
  description?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changedFields?: string[];
  metadata?: Record<string, unknown>;
  isSystemGenerated?: boolean;
  isSensitive?: boolean;
  clientId?: number;
  clientName?: string;
}

/**
 * Audit log as returned by API.
 */
export interface AuditLogAPI {
  id: number;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: number;
  entity_name?: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_type?: 'agent' | 'user' | 'system' | 'api';
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  description?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  changed_fields?: string[];
  metadata?: Record<string, unknown>;
  is_system_generated?: boolean;
  is_sensitive?: boolean;
  client_id?: number;
  client_name?: string;
  [key: string]: unknown;
}

/**
 * Audit log summary/statistics.
 */
export interface AuditSummary {
  period: string;
  fromDate: string;
  toDate: string;
  totalEvents: number;
  eventsByAction: Record<AuditAction, number>;
  eventsByEntity: Record<AuditEntityType, number>;
  eventsByUser: { userId: number; userName: string; count: number }[];
  eventsByHour?: Record<number, number>;
  eventsByDay?: Record<string, number>;
  topEntities?: { entityType: AuditEntityType; entityId: number; entityName: string; count: number }[];
  securityEvents?: number;
  systemEvents?: number;
  [key: string]: unknown;
}

/**
 * Audit summary as returned by API.
 */
export interface AuditSummaryAPI {
  period: string;
  from_date: string;
  to_date: string;
  total_events: number;
  events_by_action: Record<AuditAction, number>;
  events_by_entity: Record<AuditEntityType, number>;
  events_by_user: { user_id: number; user_name: string; count: number }[];
  events_by_hour?: Record<number, number>;
  events_by_day?: Record<string, number>;
  top_entities?: { entity_type: AuditEntityType; entity_id: number; entity_name: string; count: number }[];
  security_events?: number;
  system_events?: number;
  [key: string]: unknown;
}

/**
 * Audit policy for data retention.
 */
export interface AuditPolicy extends HaloBaseEntity {
  id: number;
  name: string;
  description?: string;
  entityType?: AuditEntityType;
  actions?: AuditAction[];
  retentionDays: number;
  archiveEnabled?: boolean;
  archiveLocation?: string;
  isEnabled: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Audit policy as returned by API.
 */
export interface AuditPolicyAPI {
  id: number;
  name: string;
  description?: string;
  entity_type?: AuditEntityType;
  actions?: AuditAction[];
  retention_days: number;
  archive_enabled?: boolean;
  archive_location?: string;
  is_enabled: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Entity change history entry.
 */
export interface EntityHistory extends HaloBaseEntity {
  id: number;
  entityType: AuditEntityType;
  entityId: number;
  entityName?: string;
  version: number;
  action: AuditAction;
  userId?: number;
  userName?: string;
  timestamp: string;
  changes: EntityChange[];
  snapshot?: Record<string, unknown>;
}

/**
 * Entity history as returned by API.
 */
export interface EntityHistoryAPI {
  id: number;
  entity_type: AuditEntityType;
  entity_id: number;
  entity_name?: string;
  version: number;
  action: AuditAction;
  user_id?: number;
  user_name?: string;
  timestamp: string;
  changes: EntityChangeAPI[];
  snapshot?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Individual field change.
 */
export interface EntityChange {
  field: string;
  fieldLabel?: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'modified' | 'removed';
  [key: string]: unknown;
}

/**
 * Entity change as returned by API.
 */
export interface EntityChangeAPI {
  field: string;
  field_label?: string;
  old_value: unknown;
  new_value: unknown;
  change_type: 'added' | 'modified' | 'removed';
  [key: string]: unknown;
}

/**
 * Security event for compliance monitoring.
 */
export interface SecurityEvent extends HaloBaseEntity {
  id: number;
  eventType: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'permission_change' | 'unauthorized_access' | 'suspicious_activity' | 'data_export' | 'api_key_created' | 'api_key_revoked';
  severity: 'info' | 'warning' | 'critical';
  userId?: number;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: string;
  description: string;
  details?: Record<string, unknown>;
  isResolved?: boolean;
  resolvedBy?: number;
  resolvedAt?: string;
  resolution?: string;
}

/**
 * Security event as returned by API.
 */
export interface SecurityEventAPI {
  id: number;
  event_type: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'permission_change' | 'unauthorized_access' | 'suspicious_activity' | 'data_export' | 'api_key_created' | 'api_key_revoked';
  severity: 'info' | 'warning' | 'critical';
  user_id?: number;
  user_name?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  timestamp: string;
  description: string;
  details?: Record<string, unknown>;
  is_resolved?: boolean;
  resolved_by?: number;
  resolved_at?: string;
  resolution?: string;
  [key: string]: unknown;
}

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform API audit log to internal format.
 */
export function transformAuditLog(api: AuditLogAPI): AuditLog {
  return {
    id: api.id,
    action: api.action,
    entityType: api.entity_type,
    entityId: api.entity_id,
    entityName: api.entity_name,
    userId: api.user_id,
    userName: api.user_name,
    userEmail: api.user_email,
    userType: api.user_type,
    ipAddress: api.ip_address,
    userAgent: api.user_agent,
    sessionId: api.session_id,
    timestamp: api.timestamp,
    description: api.description,
    oldValue: api.old_value,
    newValue: api.new_value,
    changedFields: api.changed_fields,
    metadata: api.metadata,
    isSystemGenerated: api.is_system_generated,
    isSensitive: api.is_sensitive,
    clientId: api.client_id,
    clientName: api.client_name,
  };
}

/**
 * Transform API audit summary to internal format.
 */
export function transformAuditSummary(api: AuditSummaryAPI): AuditSummary {
  return {
    period: api.period,
    fromDate: api.from_date,
    toDate: api.to_date,
    totalEvents: api.total_events,
    eventsByAction: api.events_by_action,
    eventsByEntity: api.events_by_entity,
    eventsByUser: api.events_by_user?.map((u) => ({
      userId: u.user_id,
      userName: u.user_name,
      count: u.count,
    })) || [],
    eventsByHour: api.events_by_hour,
    eventsByDay: api.events_by_day,
    topEntities: api.top_entities?.map((e) => ({
      entityType: e.entity_type,
      entityId: e.entity_id,
      entityName: e.entity_name,
      count: e.count,
    })),
    securityEvents: api.security_events,
    systemEvents: api.system_events,
  };
}

/**
 * Transform API audit policy to internal format.
 */
export function transformAuditPolicy(api: AuditPolicyAPI): AuditPolicy {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    entityType: api.entity_type,
    actions: api.actions,
    retentionDays: api.retention_days,
    archiveEnabled: api.archive_enabled,
    archiveLocation: api.archive_location,
    isEnabled: api.is_enabled,
    isDefault: api.is_default,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Transform API entity change to internal format.
 */
export function transformEntityChange(api: EntityChangeAPI): EntityChange {
  return {
    field: api.field,
    fieldLabel: api.field_label,
    oldValue: api.old_value,
    newValue: api.new_value,
    changeType: api.change_type,
  };
}

/**
 * Transform API entity history to internal format.
 */
export function transformEntityHistory(api: EntityHistoryAPI): EntityHistory {
  return {
    id: api.id,
    entityType: api.entity_type,
    entityId: api.entity_id,
    entityName: api.entity_name,
    version: api.version,
    action: api.action,
    userId: api.user_id,
    userName: api.user_name,
    timestamp: api.timestamp,
    changes: api.changes?.map(transformEntityChange) || [],
    snapshot: api.snapshot,
  };
}

/**
 * Transform API security event to internal format.
 */
export function transformSecurityEvent(api: SecurityEventAPI): SecurityEvent {
  return {
    id: api.id,
    eventType: api.event_type,
    severity: api.severity,
    userId: api.user_id,
    userName: api.user_name,
    userEmail: api.user_email,
    ipAddress: api.ip_address,
    userAgent: api.user_agent,
    location: api.location,
    timestamp: api.timestamp,
    description: api.description,
    details: api.details,
    isResolved: api.is_resolved,
    resolvedBy: api.resolved_by,
    resolvedAt: api.resolved_at,
    resolution: api.resolution,
  };
}

// ==========================================
// List Parameters
// ==========================================

/**
 * Parameters for listing audit logs.
 */
export interface AuditLogListParams {
  pageSize?: number;
  pageNo?: number;
  action?: AuditAction;
  actions?: AuditAction[];
  entityType?: AuditEntityType;
  entityTypes?: AuditEntityType[];
  entityId?: number;
  userId?: number;
  userType?: 'agent' | 'user' | 'system' | 'api';
  fromDate?: string;
  toDate?: string;
  search?: string;
  ipAddress?: string;
  isSystemGenerated?: boolean;
  clientId?: number;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for audit summary.
 */
export interface AuditSummaryParams {
  fromDate: string;
  toDate: string;
  entityType?: AuditEntityType;
  userId?: number;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  includeTopEntities?: boolean;
  topEntitiesLimit?: number;
}

/**
 * Parameters for entity history.
 */
export interface EntityHistoryParams {
  entityType: AuditEntityType;
  entityId: number;
  pageSize?: number;
  pageNo?: number;
  fromDate?: string;
  toDate?: string;
  action?: AuditAction;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing security events.
 */
export interface SecurityEventListParams {
  pageSize?: number;
  pageNo?: number;
  eventType?: SecurityEvent['eventType'];
  severity?: SecurityEvent['severity'];
  userId?: number;
  fromDate?: string;
  toDate?: string;
  isResolved?: boolean;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing audit policies.
 */
export interface AuditPolicyListParams {
  pageSize?: number;
  pageNo?: number;
  search?: string;
  entityType?: AuditEntityType;
  isEnabled?: boolean;
  orderBy?: string;
  orderDesc?: boolean;
}
