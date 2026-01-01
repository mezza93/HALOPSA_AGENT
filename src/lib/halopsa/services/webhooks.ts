/**
 * HaloPSA Webhook Services.
 * Phase 4: Productivity & Automation
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  Webhook,
  WebhookAPI,
  WebhookListParams,
  WebhookEvent,
  WebhookEventAPI,
  WebhookEventListParams,
  IncomingWebhook,
  IncomingWebhookAPI,
  IncomingWebhookListParams,
  IncomingWebhookEvent,
  IncomingWebhookEventAPI,
  IncomingWebhookEventListParams,
  WebhookEventType,
  transformWebhook,
  transformWebhookEvent,
  transformIncomingWebhook,
  transformIncomingWebhookEvent,
} from '../types';

/**
 * Service for managing outgoing webhooks.
 */
export class WebhookService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List webhooks with optional filters.
   */
  async list(params?: WebhookListParams): Promise<Webhook[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.search) queryParams.search = params.search;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.eventType) queryParams.event_type = params.eventType;
    if (params?.clientId) queryParams.client_id = params.clientId;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ webhooks: WebhookAPI[] }>('/Webhook', queryParams);
    return (response.webhooks || []).map(transformWebhook);
  }

  /**
   * Get a specific webhook by ID.
   */
  async get(id: number): Promise<Webhook> {
    const response = await this.client.get<WebhookAPI>(`/Webhook/${id}`);
    return transformWebhook(response);
  }

  /**
   * Create a new webhook.
   */
  async create(webhook: Partial<Webhook>): Promise<Webhook> {
    const payload = this.toAPIFormat(webhook);
    const response = await this.client.post<WebhookAPI>('/Webhook', [payload]);
    return transformWebhook(response);
  }

  /**
   * Update an existing webhook.
   */
  async update(id: number, webhook: Partial<Webhook>): Promise<Webhook> {
    const payload = { ...this.toAPIFormat(webhook), id };
    const response = await this.client.post<WebhookAPI>('/Webhook', [payload]);
    return transformWebhook(response);
  }

  /**
   * Delete a webhook.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Webhook/${id}`);
  }

  /**
   * Enable a webhook.
   */
  async enable(id: number): Promise<Webhook> {
    return this.update(id, { isEnabled: true });
  }

  /**
   * Disable a webhook.
   */
  async disable(id: number): Promise<Webhook> {
    return this.update(id, { isEnabled: false });
  }

  /**
   * Test a webhook by sending a test payload.
   */
  async test(id: number): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string }> {
    const response = await this.client.post<{ success: boolean; status_code?: number; response?: string; error?: string }>(
      `/Webhook/${id}/Test`,
      {}
    );
    return {
      success: response.success,
      statusCode: response.status_code,
      response: response.response,
      error: response.error,
    };
  }

  /**
   * Get available webhook event types.
   */
  async getEventTypes(): Promise<{ type: WebhookEventType; label: string; description: string }[]> {
    const response = await this.client.get<{ event_types: { type: WebhookEventType; label: string; description: string }[] }>(
      '/Webhook/EventTypes'
    );
    return response.event_types || [];
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(webhook: Partial<Webhook>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (webhook.name !== undefined) api.name = webhook.name;
    if (webhook.description !== undefined) api.description = webhook.description;
    if (webhook.url !== undefined) api.url = webhook.url;
    if (webhook.method !== undefined) api.method = webhook.method;
    if (webhook.contentType !== undefined) api.content_type = webhook.contentType;
    if (webhook.isEnabled !== undefined) api.is_enabled = webhook.isEnabled;
    if (webhook.events !== undefined) api.events = webhook.events;
    if (webhook.payloadTemplate !== undefined) api.payload_template = webhook.payloadTemplate;
    if (webhook.retryCount !== undefined) api.retry_count = webhook.retryCount;
    if (webhook.retryDelay !== undefined) api.retry_delay = webhook.retryDelay;
    if (webhook.timeout !== undefined) api.timeout = webhook.timeout;
    if (webhook.validateSsl !== undefined) api.validate_ssl = webhook.validateSsl;
    if (webhook.signatureSecret !== undefined) api.signature_secret = webhook.signatureSecret;
    if (webhook.signatureHeader !== undefined) api.signature_header = webhook.signatureHeader;
    if (webhook.clientId !== undefined) api.client_id = webhook.clientId;

    if (webhook.headers) {
      api.headers = webhook.headers.map((h) => ({
        name: h.name,
        value: h.value,
        is_secret: h.isSecret,
      }));
    }

    if (webhook.auth) {
      api.auth = {
        type: webhook.auth.type,
        username: webhook.auth.username,
        password: webhook.auth.password,
        token: webhook.auth.token,
        api_key_name: webhook.auth.apiKeyName,
        api_key_value: webhook.auth.apiKeyValue,
        api_key_location: webhook.auth.apiKeyLocation,
        custom_header_name: webhook.auth.customHeaderName,
        custom_header_value: webhook.auth.customHeaderValue,
      };
    }

    return api;
  }
}

/**
 * Service for managing webhook events/delivery logs.
 */
export class WebhookEventService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List webhook events with optional filters.
   */
  async list(params?: WebhookEventListParams): Promise<WebhookEvent[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.webhookId) queryParams.webhook_id = params.webhookId;
    if (params?.eventType) queryParams.event_type = params.eventType;
    if (params?.status) queryParams.status = params.status;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ events: WebhookEventAPI[] }>('/WebhookEvent', queryParams);
    return (response.events || []).map(transformWebhookEvent);
  }

  /**
   * Get a specific webhook event by ID.
   */
  async get(id: number): Promise<WebhookEvent> {
    const response = await this.client.get<WebhookEventAPI>(`/WebhookEvent/${id}`);
    return transformWebhookEvent(response);
  }

  /**
   * Retry a failed webhook delivery.
   */
  async retry(id: number): Promise<WebhookEvent> {
    const response = await this.client.post<WebhookEventAPI>(`/WebhookEvent/${id}/Retry`, {});
    return transformWebhookEvent(response);
  }

  /**
   * Get events for a specific webhook.
   */
  async getByWebhook(
    webhookId: number,
    params?: Omit<WebhookEventListParams, 'webhookId'>
  ): Promise<WebhookEvent[]> {
    return this.list({ ...params, webhookId });
  }

  /**
   * Get failed webhook events.
   */
  async getFailed(params?: Omit<WebhookEventListParams, 'status'>): Promise<WebhookEvent[]> {
    return this.list({ ...params, status: 'failed' });
  }

  /**
   * Get pending webhook events.
   */
  async getPending(params?: Omit<WebhookEventListParams, 'status'>): Promise<WebhookEvent[]> {
    return this.list({ ...params, status: 'pending' });
  }
}

/**
 * Service for managing incoming webhooks.
 */
export class IncomingWebhookService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List incoming webhooks with optional filters.
   */
  async list(params?: IncomingWebhookListParams): Promise<IncomingWebhook[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.search) queryParams.search = params.search;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ webhooks: IncomingWebhookAPI[] }>('/IncomingWebhook', queryParams);
    return (response.webhooks || []).map(transformIncomingWebhook);
  }

  /**
   * Get a specific incoming webhook by ID.
   */
  async get(id: number): Promise<IncomingWebhook> {
    const response = await this.client.get<IncomingWebhookAPI>(`/IncomingWebhook/${id}`);
    return transformIncomingWebhook(response);
  }

  /**
   * Create a new incoming webhook.
   */
  async create(webhook: Partial<IncomingWebhook>): Promise<IncomingWebhook> {
    const payload = this.toAPIFormat(webhook);
    const response = await this.client.post<IncomingWebhookAPI>('/IncomingWebhook', [payload]);
    return transformIncomingWebhook(response);
  }

  /**
   * Update an existing incoming webhook.
   */
  async update(id: number, webhook: Partial<IncomingWebhook>): Promise<IncomingWebhook> {
    const payload = { ...this.toAPIFormat(webhook), id };
    const response = await this.client.post<IncomingWebhookAPI>('/IncomingWebhook', [payload]);
    return transformIncomingWebhook(response);
  }

  /**
   * Delete an incoming webhook.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/IncomingWebhook/${id}`);
  }

  /**
   * Enable an incoming webhook.
   */
  async enable(id: number): Promise<IncomingWebhook> {
    return this.update(id, { isEnabled: true });
  }

  /**
   * Disable an incoming webhook.
   */
  async disable(id: number): Promise<IncomingWebhook> {
    return this.update(id, { isEnabled: false });
  }

  /**
   * Regenerate the token for an incoming webhook.
   */
  async regenerateToken(id: number): Promise<IncomingWebhook> {
    const response = await this.client.post<IncomingWebhookAPI>(`/IncomingWebhook/${id}/RegenerateToken`, {});
    return transformIncomingWebhook(response);
  }

  /**
   * Get received events for an incoming webhook.
   */
  async getEvents(
    webhookId: number,
    params?: Omit<IncomingWebhookEventListParams, 'webhookId'>
  ): Promise<IncomingWebhookEvent[]> {
    const queryParams: ListParams = { webhook_id: webhookId };

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.processed !== undefined) queryParams.processed = params.processed;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ events: IncomingWebhookEventAPI[] }>(
      '/IncomingWebhook/Events',
      queryParams
    );
    return (response.events || []).map(transformIncomingWebhookEvent);
  }

  /**
   * Get a specific incoming webhook event.
   */
  async getEvent(eventId: number): Promise<IncomingWebhookEvent> {
    const response = await this.client.get<IncomingWebhookEventAPI>(`/IncomingWebhook/Events/${eventId}`);
    return transformIncomingWebhookEvent(response);
  }

  /**
   * Reprocess an incoming webhook event.
   */
  async reprocessEvent(eventId: number): Promise<IncomingWebhookEvent> {
    const response = await this.client.post<IncomingWebhookEventAPI>(
      `/IncomingWebhook/Events/${eventId}/Reprocess`,
      {}
    );
    return transformIncomingWebhookEvent(response);
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(webhook: Partial<IncomingWebhook>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (webhook.name !== undefined) api.name = webhook.name;
    if (webhook.description !== undefined) api.description = webhook.description;
    if (webhook.isEnabled !== undefined) api.is_enabled = webhook.isEnabled;
    if (webhook.validateSignature !== undefined) api.validate_signature = webhook.validateSignature;
    if (webhook.signatureSecret !== undefined) api.signature_secret = webhook.signatureSecret;
    if (webhook.signatureHeader !== undefined) api.signature_header = webhook.signatureHeader;
    if (webhook.allowedIps !== undefined) api.allowed_ips = webhook.allowedIps;
    if (webhook.rateLimit !== undefined) api.rate_limit = webhook.rateLimit;
    if (webhook.rateLimitPeriod !== undefined) api.rate_limit_period = webhook.rateLimitPeriod;
    if (webhook.createTicket !== undefined) api.create_ticket = webhook.createTicket;
    if (webhook.ticketTypeId !== undefined) api.ticket_type_id = webhook.ticketTypeId;
    if (webhook.defaultClientId !== undefined) api.default_client_id = webhook.defaultClientId;
    if (webhook.defaultAgentId !== undefined) api.default_agent_id = webhook.defaultAgentId;
    if (webhook.defaultTeamId !== undefined) api.default_team_id = webhook.defaultTeamId;
    if (webhook.defaultPriority !== undefined) api.default_priority = webhook.defaultPriority;

    if (webhook.fieldMappings) {
      api.field_mappings = webhook.fieldMappings.map((m) => ({
        source_field: m.sourceField,
        target_field: m.targetField,
        transform: m.transform,
        transform_value: m.transformValue,
        default_value: m.defaultValue,
      }));
    }

    return api;
  }
}
