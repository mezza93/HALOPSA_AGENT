/**
 * HaloPSA Integration types.
 * Phase 5: Integrations & Webhooks
 */

import { HaloBaseEntity } from './common';

// ==========================================
// Integration Types
// ==========================================

/**
 * Supported integration types in HaloPSA.
 */
export type IntegrationType =
  | 'azure_ad'
  | 'microsoft_csp'
  | 'intune'
  | 'connectwise'
  | 'jira'
  | 'slack'
  | 'teams'
  | 'ninja_rmm'
  | 'datto'
  | 'autotask'
  | 'n_able'
  | 'xero'
  | 'quickbooks'
  | 'stripe'
  | 'twilio'
  | 'custom';

/**
 * Integration status values.
 */
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending' | 'syncing';

/**
 * Sync direction for integrations.
 */
export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';

/**
 * Sync frequency options.
 */
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';

/**
 * Base integration configuration.
 */
export interface Integration extends HaloBaseEntity {
  id: number;
  name: string;
  type: IntegrationType;
  displayName: string;
  description?: string;
  status: IntegrationStatus;
  isEnabled: boolean;
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncFrequency: SyncFrequency;
  syncDirection: SyncDirection;
  errorCount?: number;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  settings?: Record<string, unknown>;
  credentials?: IntegrationCredentials;
  mappings?: IntegrationMapping[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

/**
 * Integration as returned by API.
 */
export interface IntegrationAPI {
  id: number;
  name: string;
  type: IntegrationType;
  display_name: string;
  description?: string;
  status: IntegrationStatus;
  is_enabled: boolean;
  last_sync_at?: string;
  next_sync_at?: string;
  sync_frequency: SyncFrequency;
  sync_direction: SyncDirection;
  error_count?: number;
  last_error_at?: string;
  last_error_message?: string;
  settings?: Record<string, unknown>;
  credentials?: IntegrationCredentialsAPI;
  mappings?: IntegrationMappingAPI[];
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  [key: string]: unknown;
}

/**
 * Integration credentials (stored securely).
 */
export interface IntegrationCredentials {
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
  customFields?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Integration credentials as returned by API.
 */
export interface IntegrationCredentialsAPI {
  client_id?: string;
  client_secret?: string;
  tenant_id?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  webhook_url?: string;
  webhook_secret?: string;
  username?: string;
  password?: string;
  base_url?: string;
  custom_fields?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Field mapping between HaloPSA and external system.
 */
export interface IntegrationMapping {
  id: number;
  integrationId: number;
  entityType: string;
  externalEntityType: string;
  haloField: string;
  externalField: string;
  direction: SyncDirection;
  transformRule?: string;
  isRequired?: boolean;
  isEnabled?: boolean;
  [key: string]: unknown;
}

/**
 * Integration mapping as returned by API.
 */
export interface IntegrationMappingAPI {
  id: number;
  integration_id: number;
  entity_type: string;
  external_entity_type: string;
  halo_field: string;
  external_field: string;
  direction: SyncDirection;
  transform_rule?: string;
  is_required?: boolean;
  is_enabled?: boolean;
  [key: string]: unknown;
}

/**
 * Sync result information.
 */
export interface SyncResult {
  integrationId: number;
  integrationName: string;
  startedAt: string;
  completedAt?: string;
  status: 'success' | 'partial' | 'failed' | 'cancelled';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsFailed: number;
  errors?: SyncError[];
  warnings?: string[];
  duration?: number;
  [key: string]: unknown;
}

/**
 * Sync result as returned by API.
 */
export interface SyncResultAPI {
  integration_id: number;
  integration_name: string;
  started_at: string;
  completed_at?: string;
  status: 'success' | 'partial' | 'failed' | 'cancelled';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_deleted: number;
  records_failed: number;
  errors?: SyncErrorAPI[];
  warnings?: string[];
  duration?: number;
  [key: string]: unknown;
}

/**
 * Sync error information.
 */
export interface SyncError {
  recordId?: string;
  externalId?: string;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  errorCode?: string;
  errorMessage: string;
  timestamp: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Sync error as returned by API.
 */
export interface SyncErrorAPI {
  record_id?: string;
  external_id?: string;
  entity_type: string;
  operation: 'create' | 'update' | 'delete';
  error_code?: string;
  error_message: string;
  timestamp: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Sync status information.
 */
export interface SyncStatus {
  integrationId: number;
  integrationName: string;
  isRunning: boolean;
  currentOperation?: string;
  progress?: number;
  totalRecords?: number;
  processedRecords?: number;
  startedAt?: string;
  estimatedCompletion?: string;
  lastSyncResult?: SyncResult;
  [key: string]: unknown;
}

/**
 * Sync status as returned by API.
 */
export interface SyncStatusAPI {
  integration_id: number;
  integration_name: string;
  is_running: boolean;
  current_operation?: string;
  progress?: number;
  total_records?: number;
  processed_records?: number;
  started_at?: string;
  estimated_completion?: string;
  last_sync_result?: SyncResultAPI;
  [key: string]: unknown;
}

/**
 * Integration log entry.
 */
export interface IntegrationLog extends HaloBaseEntity {
  id: number;
  integrationId: number;
  integrationName: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
  entityType?: string;
  entityId?: number;
  externalId?: string;
  timestamp: string;
}

/**
 * Integration log as returned by API.
 */
export interface IntegrationLogAPI {
  id: number;
  integration_id: number;
  integration_name: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
  entity_type?: string;
  entity_id?: number;
  external_id?: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * External entity reference.
 */
export interface ExternalEntity {
  integrationId: number;
  integrationType: IntegrationType;
  haloEntityType: string;
  haloEntityId: number;
  externalEntityType: string;
  externalEntityId: string;
  externalEntityName?: string;
  lastSyncAt?: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'deleted';
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * External entity as returned by API.
 */
export interface ExternalEntityAPI {
  integration_id: number;
  integration_type: IntegrationType;
  halo_entity_type: string;
  halo_entity_id: number;
  external_entity_type: string;
  external_entity_id: string;
  external_entity_name?: string;
  last_sync_at?: string;
  sync_status: 'synced' | 'pending' | 'error' | 'deleted';
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// ==========================================
// Azure AD Specific Types
// ==========================================

/**
 * Azure AD sync configuration.
 */
export interface AzureADConfig {
  tenantId: string;
  clientId: string;
  syncUsers: boolean;
  syncGroups: boolean;
  syncDevices: boolean;
  userFilter?: string;
  groupFilter?: string;
  defaultClientId?: number;
  defaultSiteId?: number;
  createUsers: boolean;
  updateUsers: boolean;
  disableDeletedUsers: boolean;
  [key: string]: unknown;
}

/**
 * Azure AD sync configuration as returned by API.
 */
export interface AzureADConfigAPI {
  tenant_id: string;
  client_id: string;
  sync_users: boolean;
  sync_groups: boolean;
  sync_devices: boolean;
  user_filter?: string;
  group_filter?: string;
  default_client_id?: number;
  default_site_id?: number;
  create_users: boolean;
  update_users: boolean;
  disable_deleted_users: boolean;
  [key: string]: unknown;
}

// ==========================================
// Microsoft Intune Specific Types
// ==========================================

/**
 * Intune sync configuration.
 */
export interface IntuneConfig {
  tenantId: string;
  clientId: string;
  syncManagedDevices: boolean;
  syncCompliance: boolean;
  syncApps: boolean;
  deviceFilter?: string;
  defaultAssetTypeId?: number;
  createAssets: boolean;
  updateAssets: boolean;
  [key: string]: unknown;
}

/**
 * Intune sync configuration as returned by API.
 */
export interface IntuneConfigAPI {
  tenant_id: string;
  client_id: string;
  sync_managed_devices: boolean;
  sync_compliance: boolean;
  sync_apps: boolean;
  device_filter?: string;
  default_asset_type_id?: number;
  create_assets: boolean;
  update_assets: boolean;
  [key: string]: unknown;
}

// ==========================================
// Slack/Teams Specific Types
// ==========================================

/**
 * Slack/Teams integration configuration.
 */
export interface ChatIntegrationConfig {
  webhookUrl: string;
  defaultChannelId?: string;
  notifyOnTicketCreate: boolean;
  notifyOnTicketUpdate: boolean;
  notifyOnTicketClose: boolean;
  notifyOnSLABreach: boolean;
  mentionAssignee: boolean;
  includeDescription: boolean;
  ticketTypes?: number[];
  priorities?: number[];
  [key: string]: unknown;
}

/**
 * Chat integration configuration as returned by API.
 */
export interface ChatIntegrationConfigAPI {
  webhook_url: string;
  default_channel_id?: string;
  notify_on_ticket_create: boolean;
  notify_on_ticket_update: boolean;
  notify_on_ticket_close: boolean;
  notify_on_sla_breach: boolean;
  mention_assignee: boolean;
  include_description: boolean;
  ticket_types?: number[];
  priorities?: number[];
  [key: string]: unknown;
}

// ==========================================
// RMM Integration Types (NinjaRMM, Datto, etc.)
// ==========================================

/**
 * RMM integration configuration.
 */
export interface RMMIntegrationConfig {
  apiUrl: string;
  apiKey: string;
  syncDevices: boolean;
  syncAlerts: boolean;
  createTicketsFromAlerts: boolean;
  alertTicketTypeId?: number;
  alertPriorityMapping?: Record<string, number>;
  deviceAssetTypeId?: number;
  syncInterval?: number;
  [key: string]: unknown;
}

/**
 * RMM integration configuration as returned by API.
 */
export interface RMMIntegrationConfigAPI {
  api_url: string;
  api_key: string;
  sync_devices: boolean;
  sync_alerts: boolean;
  create_tickets_from_alerts: boolean;
  alert_ticket_type_id?: number;
  alert_priority_mapping?: Record<string, number>;
  device_asset_type_id?: number;
  sync_interval?: number;
  [key: string]: unknown;
}

// ==========================================
// PSA Integration Types (ConnectWise, Autotask)
// ==========================================

/**
 * PSA integration configuration.
 */
export interface PSAIntegrationConfig {
  baseUrl: string;
  companyId: string;
  publicKey: string;
  privateKey: string;
  syncTickets: boolean;
  syncClients: boolean;
  syncContacts: boolean;
  syncProducts: boolean;
  ticketBoardId?: number;
  clientTypeMapping?: Record<string, number>;
  [key: string]: unknown;
}

/**
 * PSA integration configuration as returned by API.
 */
export interface PSAIntegrationConfigAPI {
  base_url: string;
  company_id: string;
  public_key: string;
  private_key: string;
  sync_tickets: boolean;
  sync_clients: boolean;
  sync_contacts: boolean;
  sync_products: boolean;
  ticket_board_id?: number;
  client_type_mapping?: Record<string, number>;
  [key: string]: unknown;
}

// ==========================================
// Accounting Integration Types (Xero, QuickBooks)
// ==========================================

/**
 * Accounting integration configuration.
 */
export interface AccountingIntegrationConfig {
  syncInvoices: boolean;
  syncPayments: boolean;
  syncProducts: boolean;
  defaultAccountCode?: string;
  taxCodeMapping?: Record<string, string>;
  currencyCode?: string;
  autoCreateContacts: boolean;
  [key: string]: unknown;
}

/**
 * Accounting integration configuration as returned by API.
 */
export interface AccountingIntegrationConfigAPI {
  sync_invoices: boolean;
  sync_payments: boolean;
  sync_products: boolean;
  default_account_code?: string;
  tax_code_mapping?: Record<string, string>;
  currency_code?: string;
  auto_create_contacts: boolean;
  [key: string]: unknown;
}

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform API integration credentials to internal format.
 */
export function transformIntegrationCredentials(api: IntegrationCredentialsAPI): IntegrationCredentials {
  return {
    clientId: api.client_id,
    clientSecret: api.client_secret,
    tenantId: api.tenant_id,
    apiKey: api.api_key,
    apiSecret: api.api_secret,
    accessToken: api.access_token,
    refreshToken: api.refresh_token,
    tokenExpiresAt: api.token_expires_at,
    webhookUrl: api.webhook_url,
    webhookSecret: api.webhook_secret,
    username: api.username,
    password: api.password,
    baseUrl: api.base_url,
    customFields: api.custom_fields,
  };
}

/**
 * Transform API integration mapping to internal format.
 */
export function transformIntegrationMapping(api: IntegrationMappingAPI): IntegrationMapping {
  return {
    id: api.id,
    integrationId: api.integration_id,
    entityType: api.entity_type,
    externalEntityType: api.external_entity_type,
    haloField: api.halo_field,
    externalField: api.external_field,
    direction: api.direction,
    transformRule: api.transform_rule,
    isRequired: api.is_required,
    isEnabled: api.is_enabled,
  };
}

/**
 * Transform API integration to internal format.
 */
export function transformIntegration(api: IntegrationAPI): Integration {
  return {
    id: api.id,
    name: api.name,
    type: api.type,
    displayName: api.display_name,
    description: api.description,
    status: api.status,
    isEnabled: api.is_enabled,
    lastSyncAt: api.last_sync_at,
    nextSyncAt: api.next_sync_at,
    syncFrequency: api.sync_frequency,
    syncDirection: api.sync_direction,
    errorCount: api.error_count,
    lastErrorAt: api.last_error_at,
    lastErrorMessage: api.last_error_message,
    settings: api.settings,
    credentials: api.credentials ? transformIntegrationCredentials(api.credentials) : undefined,
    mappings: api.mappings?.map(transformIntegrationMapping),
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    createdBy: api.created_by,
  };
}

/**
 * Transform API sync error to internal format.
 */
export function transformSyncError(api: SyncErrorAPI): SyncError {
  return {
    recordId: api.record_id,
    externalId: api.external_id,
    entityType: api.entity_type,
    operation: api.operation,
    errorCode: api.error_code,
    errorMessage: api.error_message,
    timestamp: api.timestamp,
    data: api.data,
  };
}

/**
 * Transform API sync result to internal format.
 */
export function transformSyncResult(api: SyncResultAPI): SyncResult {
  return {
    integrationId: api.integration_id,
    integrationName: api.integration_name,
    startedAt: api.started_at,
    completedAt: api.completed_at,
    status: api.status,
    recordsProcessed: api.records_processed,
    recordsCreated: api.records_created,
    recordsUpdated: api.records_updated,
    recordsDeleted: api.records_deleted,
    recordsFailed: api.records_failed,
    errors: api.errors?.map(transformSyncError),
    warnings: api.warnings,
    duration: api.duration,
  };
}

/**
 * Transform API sync status to internal format.
 */
export function transformSyncStatus(api: SyncStatusAPI): SyncStatus {
  return {
    integrationId: api.integration_id,
    integrationName: api.integration_name,
    isRunning: api.is_running,
    currentOperation: api.current_operation,
    progress: api.progress,
    totalRecords: api.total_records,
    processedRecords: api.processed_records,
    startedAt: api.started_at,
    estimatedCompletion: api.estimated_completion,
    lastSyncResult: api.last_sync_result ? transformSyncResult(api.last_sync_result) : undefined,
  };
}

/**
 * Transform API integration log to internal format.
 */
export function transformIntegrationLog(api: IntegrationLogAPI): IntegrationLog {
  return {
    id: api.id,
    integrationId: api.integration_id,
    integrationName: api.integration_name,
    level: api.level,
    message: api.message,
    details: api.details,
    entityType: api.entity_type,
    entityId: api.entity_id,
    externalId: api.external_id,
    timestamp: api.timestamp,
  };
}

/**
 * Transform API external entity to internal format.
 */
export function transformExternalEntity(api: ExternalEntityAPI): ExternalEntity {
  return {
    integrationId: api.integration_id,
    integrationType: api.integration_type,
    haloEntityType: api.halo_entity_type,
    haloEntityId: api.halo_entity_id,
    externalEntityType: api.external_entity_type,
    externalEntityId: api.external_entity_id,
    externalEntityName: api.external_entity_name,
    lastSyncAt: api.last_sync_at,
    syncStatus: api.sync_status,
    metadata: api.metadata,
  };
}

// ==========================================
// List Parameters
// ==========================================

/**
 * Parameters for listing integrations.
 */
export interface IntegrationListParams {
  pageSize?: number;
  pageNo?: number;
  type?: IntegrationType;
  status?: IntegrationStatus;
  isEnabled?: boolean;
  search?: string;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing integration logs.
 */
export interface IntegrationLogListParams {
  pageSize?: number;
  pageNo?: number;
  integrationId?: number;
  level?: 'debug' | 'info' | 'warning' | 'error';
  fromDate?: string;
  toDate?: string;
  search?: string;
  entityType?: string;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing sync history.
 */
export interface SyncHistoryParams {
  pageSize?: number;
  pageNo?: number;
  integrationId?: number;
  status?: 'success' | 'partial' | 'failed' | 'cancelled';
  fromDate?: string;
  toDate?: string;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing external entities.
 */
export interface ExternalEntityListParams {
  pageSize?: number;
  pageNo?: number;
  integrationId?: number;
  haloEntityType?: string;
  haloEntityId?: number;
  externalEntityType?: string;
  syncStatus?: 'synced' | 'pending' | 'error' | 'deleted';
  orderBy?: string;
  orderDesc?: boolean;
}
