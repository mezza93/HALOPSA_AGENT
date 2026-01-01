/**
 * HaloPSA Webhook types.
 * Phase 4: Productivity & Automation
 */

import { HaloBaseEntity } from './common';

// ==========================================
// Webhook Types
// ==========================================

/**
 * HTTP methods for webhooks.
 */
export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Webhook authentication types.
 */
export type WebhookAuthType = 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2' | 'custom_header';

/**
 * Webhook content types.
 */
export type WebhookContentType = 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded' | 'text/plain';

/**
 * Webhook event types that can trigger outgoing webhooks.
 */
export type WebhookEventType =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.deleted'
  | 'ticket.closed'
  | 'ticket.assigned'
  | 'ticket.escalated'
  | 'ticket.note_added'
  | 'ticket.attachment_added'
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'asset.created'
  | 'asset.updated'
  | 'asset.deleted'
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'contract.created'
  | 'contract.renewed'
  | 'contract.expired'
  | 'opportunity.created'
  | 'opportunity.won'
  | 'opportunity.lost'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'sla.warning'
  | 'sla.breach'
  | 'custom';

/**
 * Webhook header configuration.
 */
export interface WebhookHeader {
  name: string;
  value: string;
  isSecret?: boolean;
  [key: string]: unknown;
}

/**
 * Webhook authentication configuration.
 */
export interface WebhookAuth {
  type: WebhookAuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'header' | 'query';
  customHeaderName?: string;
  customHeaderValue?: string;
  [key: string]: unknown;
}

/**
 * Outgoing webhook configuration.
 */
export interface Webhook extends HaloBaseEntity {
  id: number;
  name: string;
  description?: string;
  url: string;
  method: WebhookMethod;
  contentType: WebhookContentType;
  isEnabled: boolean;
  isActive?: boolean;
  events: WebhookEventType[];
  headers?: WebhookHeader[];
  auth?: WebhookAuth;
  payloadTemplate?: string;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  validateSsl?: boolean;
  signatureSecret?: string;
  signatureHeader?: string;
  clientId?: number;
  createdBy?: number;
  createdByName?: string;
  createdAt?: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
  lastTriggeredAt?: string;
  successCount?: number;
  failureCount?: number;
}

/**
 * Webhook as returned by API.
 */
export interface WebhookAPI {
  id: number;
  name: string;
  description?: string;
  url: string;
  method: WebhookMethod;
  content_type: WebhookContentType;
  is_enabled: boolean;
  is_active?: boolean;
  events: WebhookEventType[];
  headers?: { name: string; value: string; is_secret?: boolean }[];
  auth?: {
    type: WebhookAuthType;
    username?: string;
    password?: string;
    token?: string;
    api_key_name?: string;
    api_key_value?: string;
    api_key_location?: 'header' | 'query';
    custom_header_name?: string;
    custom_header_value?: string;
  };
  payload_template?: string;
  retry_count?: number;
  retry_delay?: number;
  timeout?: number;
  validate_ssl?: boolean;
  signature_secret?: string;
  signature_header?: string;
  client_id?: number;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_by?: number;
  updated_by_name?: string;
  updated_at?: string;
  last_triggered_at?: string;
  success_count?: number;
  failure_count?: number;
  [key: string]: unknown;
}

/**
 * Webhook delivery attempt status.
 */
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

/**
 * Webhook event delivery record.
 */
export interface WebhookEvent extends HaloBaseEntity {
  id: number;
  webhookId: number;
  webhookName?: string;
  eventType: WebhookEventType;
  entityId?: number;
  entityType?: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  attempts: number;
  nextRetryAt?: string;
  createdAt: string;
  deliveredAt?: string;
  duration?: number;
}

/**
 * Webhook event as returned by API.
 */
export interface WebhookEventAPI {
  id: number;
  webhook_id: number;
  webhook_name?: string;
  event_type: WebhookEventType;
  entity_id?: number;
  entity_type?: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  attempts: number;
  next_retry_at?: string;
  created_at: string;
  delivered_at?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Incoming webhook configuration for receiving external events.
 */
export interface IncomingWebhook extends HaloBaseEntity {
  id: number;
  name: string;
  description?: string;
  token: string;
  endpoint: string;
  isEnabled: boolean;
  isActive?: boolean;
  validateSignature?: boolean;
  signatureSecret?: string;
  signatureHeader?: string;
  allowedIps?: string[];
  rateLimit?: number;
  rateLimitPeriod?: number;
  createTicket?: boolean;
  ticketTypeId?: number;
  defaultClientId?: number;
  defaultAgentId?: number;
  defaultTeamId?: number;
  defaultPriority?: number;
  fieldMappings?: WebhookFieldMapping[];
  createdBy?: number;
  createdByName?: string;
  createdAt?: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
  lastReceivedAt?: string;
  receivedCount?: number;
}

/**
 * Incoming webhook as returned by API.
 */
export interface IncomingWebhookAPI {
  id: number;
  name: string;
  description?: string;
  token: string;
  endpoint: string;
  is_enabled: boolean;
  is_active?: boolean;
  validate_signature?: boolean;
  signature_secret?: string;
  signature_header?: string;
  allowed_ips?: string[];
  rate_limit?: number;
  rate_limit_period?: number;
  create_ticket?: boolean;
  ticket_type_id?: number;
  default_client_id?: number;
  default_agent_id?: number;
  default_team_id?: number;
  default_priority?: number;
  field_mappings?: WebhookFieldMappingAPI[];
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_by?: number;
  updated_by_name?: string;
  updated_at?: string;
  last_received_at?: string;
  received_count?: number;
  [key: string]: unknown;
}

/**
 * Field mapping for incoming webhooks.
 */
export interface WebhookFieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'none' | 'lowercase' | 'uppercase' | 'trim' | 'html_to_text' | 'json_path';
  transformValue?: string;
  defaultValue?: string;
  [key: string]: unknown;
}

/**
 * Field mapping as returned by API.
 */
export interface WebhookFieldMappingAPI {
  source_field: string;
  target_field: string;
  transform?: 'none' | 'lowercase' | 'uppercase' | 'trim' | 'html_to_text' | 'json_path';
  transform_value?: string;
  default_value?: string;
  [key: string]: unknown;
}

/**
 * Incoming webhook received event.
 */
export interface IncomingWebhookEvent extends HaloBaseEntity {
  id: number;
  webhookId: number;
  webhookName?: string;
  receivedAt: string;
  sourceIp?: string;
  headers?: Record<string, string>;
  payload: Record<string, unknown>;
  processed: boolean;
  processedAt?: string;
  ticketId?: number;
  errorMessage?: string;
}

/**
 * Incoming webhook event as returned by API.
 */
export interface IncomingWebhookEventAPI {
  id: number;
  webhook_id: number;
  webhook_name?: string;
  received_at: string;
  source_ip?: string;
  headers?: Record<string, string>;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  ticket_id?: number;
  error_message?: string;
  [key: string]: unknown;
}

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform API webhook to internal format.
 */
export function transformWebhook(api: WebhookAPI): Webhook {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    url: api.url,
    method: api.method,
    contentType: api.content_type,
    isEnabled: api.is_enabled,
    isActive: api.is_active,
    events: api.events || [],
    headers: api.headers?.map((h) => ({
      name: h.name,
      value: h.value,
      isSecret: h.is_secret,
    })),
    auth: api.auth ? {
      type: api.auth.type,
      username: api.auth.username,
      password: api.auth.password,
      token: api.auth.token,
      apiKeyName: api.auth.api_key_name,
      apiKeyValue: api.auth.api_key_value,
      apiKeyLocation: api.auth.api_key_location,
      customHeaderName: api.auth.custom_header_name,
      customHeaderValue: api.auth.custom_header_value,
    } : undefined,
    payloadTemplate: api.payload_template,
    retryCount: api.retry_count,
    retryDelay: api.retry_delay,
    timeout: api.timeout,
    validateSsl: api.validate_ssl,
    signatureSecret: api.signature_secret,
    signatureHeader: api.signature_header,
    clientId: api.client_id,
    createdBy: api.created_by,
    createdByName: api.created_by_name,
    createdAt: api.created_at,
    updatedBy: api.updated_by,
    updatedByName: api.updated_by_name,
    updatedAt: api.updated_at,
    lastTriggeredAt: api.last_triggered_at,
    successCount: api.success_count,
    failureCount: api.failure_count,
  };
}

/**
 * Transform API webhook event to internal format.
 */
export function transformWebhookEvent(api: WebhookEventAPI): WebhookEvent {
  return {
    id: api.id,
    webhookId: api.webhook_id,
    webhookName: api.webhook_name,
    eventType: api.event_type,
    entityId: api.entity_id,
    entityType: api.entity_type,
    payload: api.payload,
    status: api.status,
    responseStatus: api.response_status,
    responseBody: api.response_body,
    errorMessage: api.error_message,
    attempts: api.attempts,
    nextRetryAt: api.next_retry_at,
    createdAt: api.created_at,
    deliveredAt: api.delivered_at,
    duration: api.duration,
  };
}

/**
 * Transform API field mapping to internal format.
 */
export function transformWebhookFieldMapping(api: WebhookFieldMappingAPI): WebhookFieldMapping {
  return {
    sourceField: api.source_field,
    targetField: api.target_field,
    transform: api.transform,
    transformValue: api.transform_value,
    defaultValue: api.default_value,
  };
}

/**
 * Transform API incoming webhook to internal format.
 */
export function transformIncomingWebhook(api: IncomingWebhookAPI): IncomingWebhook {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    token: api.token,
    endpoint: api.endpoint,
    isEnabled: api.is_enabled,
    isActive: api.is_active,
    validateSignature: api.validate_signature,
    signatureSecret: api.signature_secret,
    signatureHeader: api.signature_header,
    allowedIps: api.allowed_ips,
    rateLimit: api.rate_limit,
    rateLimitPeriod: api.rate_limit_period,
    createTicket: api.create_ticket,
    ticketTypeId: api.ticket_type_id,
    defaultClientId: api.default_client_id,
    defaultAgentId: api.default_agent_id,
    defaultTeamId: api.default_team_id,
    defaultPriority: api.default_priority,
    fieldMappings: api.field_mappings?.map(transformWebhookFieldMapping),
    createdBy: api.created_by,
    createdByName: api.created_by_name,
    createdAt: api.created_at,
    updatedBy: api.updated_by,
    updatedByName: api.updated_by_name,
    updatedAt: api.updated_at,
    lastReceivedAt: api.last_received_at,
    receivedCount: api.received_count,
  };
}

/**
 * Transform API incoming webhook event to internal format.
 */
export function transformIncomingWebhookEvent(api: IncomingWebhookEventAPI): IncomingWebhookEvent {
  return {
    id: api.id,
    webhookId: api.webhook_id,
    webhookName: api.webhook_name,
    receivedAt: api.received_at,
    sourceIp: api.source_ip,
    headers: api.headers,
    payload: api.payload,
    processed: api.processed,
    processedAt: api.processed_at,
    ticketId: api.ticket_id,
    errorMessage: api.error_message,
  };
}

// ==========================================
// List Parameters
// ==========================================

/**
 * Parameters for listing webhooks.
 */
export interface WebhookListParams {
  pageSize?: number;
  pageNo?: number;
  search?: string;
  isEnabled?: boolean;
  eventType?: WebhookEventType;
  clientId?: number;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing webhook events.
 */
export interface WebhookEventListParams {
  pageSize?: number;
  pageNo?: number;
  webhookId?: number;
  eventType?: WebhookEventType;
  status?: WebhookDeliveryStatus;
  fromDate?: string;
  toDate?: string;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing incoming webhooks.
 */
export interface IncomingWebhookListParams {
  pageSize?: number;
  pageNo?: number;
  search?: string;
  isEnabled?: boolean;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing incoming webhook events.
 */
export interface IncomingWebhookEventListParams {
  pageSize?: number;
  pageNo?: number;
  webhookId?: number;
  processed?: boolean;
  fromDate?: string;
  toDate?: string;
  orderBy?: string;
  orderDesc?: boolean;
}
