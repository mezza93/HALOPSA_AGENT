/**
 * HaloPSA Integration Services.
 * Phase 5: Integrations & Webhooks
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  Integration,
  IntegrationAPI,
  IntegrationListParams,
  IntegrationType,
  IntegrationStatus,
  IntegrationCredentials,
  IntegrationMapping,
  IntegrationMappingAPI,
  SyncResult,
  SyncResultAPI,
  SyncStatus,
  SyncStatusAPI,
  SyncHistoryParams,
  IntegrationLog,
  IntegrationLogAPI,
  IntegrationLogListParams,
  ExternalEntity,
  ExternalEntityAPI,
  ExternalEntityListParams,
  AzureADConfig,
  AzureADConfigAPI,
  IntuneConfig,
  IntuneConfigAPI,
  ChatIntegrationConfig,
  ChatIntegrationConfigAPI,
  RMMIntegrationConfig,
  RMMIntegrationConfigAPI,
  PSAIntegrationConfig,
  PSAIntegrationConfigAPI,
  AccountingIntegrationConfig,
  AccountingIntegrationConfigAPI,
  transformIntegration,
  transformSyncResult,
  transformSyncStatus,
  transformIntegrationLog,
  transformExternalEntity,
  transformIntegrationMapping,
} from '../types';

/**
 * Service for managing integrations.
 */
export class IntegrationService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List all integrations.
   */
  async list(params?: IntegrationListParams): Promise<Integration[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.type) queryParams.type = params.type;
    if (params?.status) queryParams.status = params.status;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.search) queryParams.search = params.search;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ integrations: IntegrationAPI[] }>('/Integration', queryParams);
    return (response.integrations || []).map(transformIntegration);
  }

  /**
   * Get a specific integration by ID.
   */
  async get(id: number): Promise<Integration> {
    const response = await this.client.get<IntegrationAPI>(`/Integration/${id}`);
    return transformIntegration(response);
  }

  /**
   * Get integration by type.
   */
  async getByType(type: IntegrationType): Promise<Integration | null> {
    const integrations = await this.list({ type });
    return integrations.length > 0 ? integrations[0] : null;
  }

  /**
   * Create a new integration.
   */
  async create(integration: Partial<Integration>): Promise<Integration> {
    const payload = this.toAPIFormat(integration);
    const response = await this.client.post<IntegrationAPI>('/Integration', [payload]);
    return transformIntegration(response);
  }

  /**
   * Update an existing integration.
   */
  async update(id: number, integration: Partial<Integration>): Promise<Integration> {
    const payload = { ...this.toAPIFormat(integration), id };
    const response = await this.client.post<IntegrationAPI>('/Integration', [payload]);
    return transformIntegration(response);
  }

  /**
   * Delete an integration.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Integration/${id}`);
  }

  /**
   * Enable an integration.
   */
  async enable(id: number): Promise<Integration> {
    const response = await this.client.post<IntegrationAPI>(`/Integration/${id}/Enable`, {});
    return transformIntegration(response);
  }

  /**
   * Disable an integration.
   */
  async disable(id: number): Promise<Integration> {
    const response = await this.client.post<IntegrationAPI>(`/Integration/${id}/Disable`, {});
    return transformIntegration(response);
  }

  /**
   * Test integration connection.
   */
  async testConnection(id: number): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    const response = await this.client.post<{ success: boolean; message: string; details?: Record<string, unknown> }>(
      `/Integration/${id}/Test`,
      {}
    );
    return response;
  }

  /**
   * Get integration credentials (masked).
   */
  async getCredentials(id: number): Promise<IntegrationCredentials> {
    const response = await this.client.get<{ credentials: IntegrationCredentials }>(`/Integration/${id}/Credentials`);
    return response.credentials;
  }

  /**
   * Update integration credentials.
   */
  async updateCredentials(id: number, credentials: Partial<IntegrationCredentials>): Promise<void> {
    await this.client.post(`/Integration/${id}/Credentials`, this.credentialsToAPIFormat(credentials));
  }

  /**
   * Get available integration types.
   */
  async getAvailableTypes(): Promise<{ type: IntegrationType; name: string; description: string; category: string }[]> {
    const response = await this.client.get<{
      types: { type: IntegrationType; name: string; description: string; category: string }[]
    }>('/Integration/Types');
    return response.types || [];
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(integration: Partial<Integration>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (integration.name !== undefined) api.name = integration.name;
    if (integration.type !== undefined) api.type = integration.type;
    if (integration.displayName !== undefined) api.display_name = integration.displayName;
    if (integration.description !== undefined) api.description = integration.description;
    if (integration.isEnabled !== undefined) api.is_enabled = integration.isEnabled;
    if (integration.syncFrequency !== undefined) api.sync_frequency = integration.syncFrequency;
    if (integration.syncDirection !== undefined) api.sync_direction = integration.syncDirection;
    if (integration.settings !== undefined) api.settings = integration.settings;

    return api;
  }

  /**
   * Convert credentials to API format.
   */
  private credentialsToAPIFormat(credentials: Partial<IntegrationCredentials>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (credentials.clientId !== undefined) api.client_id = credentials.clientId;
    if (credentials.clientSecret !== undefined) api.client_secret = credentials.clientSecret;
    if (credentials.tenantId !== undefined) api.tenant_id = credentials.tenantId;
    if (credentials.apiKey !== undefined) api.api_key = credentials.apiKey;
    if (credentials.apiSecret !== undefined) api.api_secret = credentials.apiSecret;
    if (credentials.accessToken !== undefined) api.access_token = credentials.accessToken;
    if (credentials.refreshToken !== undefined) api.refresh_token = credentials.refreshToken;
    if (credentials.webhookUrl !== undefined) api.webhook_url = credentials.webhookUrl;
    if (credentials.webhookSecret !== undefined) api.webhook_secret = credentials.webhookSecret;
    if (credentials.username !== undefined) api.username = credentials.username;
    if (credentials.password !== undefined) api.password = credentials.password;
    if (credentials.baseUrl !== undefined) api.base_url = credentials.baseUrl;
    if (credentials.customFields !== undefined) api.custom_fields = credentials.customFields;

    return api;
  }
}

/**
 * Service for managing integration field mappings.
 */
export class IntegrationMappingService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List mappings for an integration.
   */
  async list(integrationId: number): Promise<IntegrationMapping[]> {
    const response = await this.client.get<{ mappings: IntegrationMappingAPI[] }>(
      `/Integration/${integrationId}/Mappings`
    );
    return (response.mappings || []).map(transformIntegrationMapping);
  }

  /**
   * Get a specific mapping.
   */
  async get(integrationId: number, mappingId: number): Promise<IntegrationMapping> {
    const response = await this.client.get<IntegrationMappingAPI>(
      `/Integration/${integrationId}/Mappings/${mappingId}`
    );
    return transformIntegrationMapping(response);
  }

  /**
   * Create a new mapping.
   */
  async create(integrationId: number, mapping: Partial<IntegrationMapping>): Promise<IntegrationMapping> {
    const payload = this.toAPIFormat(mapping);
    const response = await this.client.post<IntegrationMappingAPI>(
      `/Integration/${integrationId}/Mappings`,
      [payload]
    );
    return transformIntegrationMapping(response);
  }

  /**
   * Update a mapping.
   */
  async update(integrationId: number, mappingId: number, mapping: Partial<IntegrationMapping>): Promise<IntegrationMapping> {
    const payload = { ...this.toAPIFormat(mapping), id: mappingId };
    const response = await this.client.post<IntegrationMappingAPI>(
      `/Integration/${integrationId}/Mappings`,
      [payload]
    );
    return transformIntegrationMapping(response);
  }

  /**
   * Delete a mapping.
   */
  async delete(integrationId: number, mappingId: number): Promise<void> {
    await this.client.delete(`/Integration/${integrationId}/Mappings/${mappingId}`);
  }

  /**
   * Get available fields for mapping.
   */
  async getAvailableFields(
    integrationId: number,
    entityType: string
  ): Promise<{ haloFields: { field: string; label: string; type: string }[]; externalFields: { field: string; label: string; type: string }[] }> {
    const response = await this.client.get<{
      halo_fields: { field: string; label: string; type: string }[];
      external_fields: { field: string; label: string; type: string }[];
    }>(`/Integration/${integrationId}/Mappings/Fields`, { entity_type: entityType });

    return {
      haloFields: response.halo_fields || [],
      externalFields: response.external_fields || [],
    };
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(mapping: Partial<IntegrationMapping>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (mapping.entityType !== undefined) api.entity_type = mapping.entityType;
    if (mapping.externalEntityType !== undefined) api.external_entity_type = mapping.externalEntityType;
    if (mapping.haloField !== undefined) api.halo_field = mapping.haloField;
    if (mapping.externalField !== undefined) api.external_field = mapping.externalField;
    if (mapping.direction !== undefined) api.direction = mapping.direction;
    if (mapping.transformRule !== undefined) api.transform_rule = mapping.transformRule;
    if (mapping.isRequired !== undefined) api.is_required = mapping.isRequired;
    if (mapping.isEnabled !== undefined) api.is_enabled = mapping.isEnabled;

    return api;
  }
}

/**
 * Service for managing integration sync operations.
 */
export class IntegrationSyncService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Trigger a sync for an integration.
   */
  async triggerSync(integrationId: number, options?: { fullSync?: boolean; entityTypes?: string[] }): Promise<SyncResult> {
    const payload: Record<string, unknown> = {};
    if (options?.fullSync) payload.full_sync = options.fullSync;
    if (options?.entityTypes) payload.entity_types = options.entityTypes;

    const response = await this.client.post<SyncResultAPI>(`/Integration/${integrationId}/Sync`, payload);
    return transformSyncResult(response);
  }

  /**
   * Get current sync status.
   */
  async getStatus(integrationId: number): Promise<SyncStatus> {
    const response = await this.client.get<SyncStatusAPI>(`/Integration/${integrationId}/Sync/Status`);
    return transformSyncStatus(response);
  }

  /**
   * Cancel a running sync.
   */
  async cancelSync(integrationId: number): Promise<void> {
    await this.client.post(`/Integration/${integrationId}/Sync/Cancel`, {});
  }

  /**
   * Get sync history.
   */
  async getHistory(params?: SyncHistoryParams): Promise<SyncResult[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.integrationId) queryParams.integration_id = params.integrationId;
    if (params?.status) queryParams.status = params.status;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ history: SyncResultAPI[] }>('/Integration/Sync/History', queryParams);
    return (response.history || []).map(transformSyncResult);
  }

  /**
   * Get last sync result.
   */
  async getLastSync(integrationId: number): Promise<SyncResult | null> {
    const history = await this.getHistory({ integrationId, pageSize: 1 });
    return history.length > 0 ? history[0] : null;
  }

  /**
   * Retry failed records from last sync.
   */
  async retryFailed(integrationId: number): Promise<SyncResult> {
    const response = await this.client.post<SyncResultAPI>(`/Integration/${integrationId}/Sync/RetryFailed`, {});
    return transformSyncResult(response);
  }
}

/**
 * Service for managing integration logs.
 */
export class IntegrationLogService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List integration logs.
   */
  async list(params?: IntegrationLogListParams): Promise<IntegrationLog[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.integrationId) queryParams.integration_id = params.integrationId;
    if (params?.level) queryParams.level = params.level;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.search) queryParams.search = params.search;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ logs: IntegrationLogAPI[] }>('/Integration/Logs', queryParams);
    return (response.logs || []).map(transformIntegrationLog);
  }

  /**
   * Get logs for a specific integration.
   */
  async getForIntegration(
    integrationId: number,
    params?: Omit<IntegrationLogListParams, 'integrationId'>
  ): Promise<IntegrationLog[]> {
    return this.list({ ...params, integrationId });
  }

  /**
   * Get error logs.
   */
  async getErrors(params?: Omit<IntegrationLogListParams, 'level'>): Promise<IntegrationLog[]> {
    return this.list({ ...params, level: 'error' });
  }

  /**
   * Clear logs for an integration.
   */
  async clear(integrationId: number, beforeDate?: string): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (beforeDate) payload.before_date = beforeDate;

    await this.client.post(`/Integration/${integrationId}/Logs/Clear`, payload);
  }
}

/**
 * Service for managing external entity references.
 */
export class ExternalEntityService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List external entity references.
   */
  async list(params?: ExternalEntityListParams): Promise<ExternalEntity[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.integrationId) queryParams.integration_id = params.integrationId;
    if (params?.haloEntityType) queryParams.halo_entity_type = params.haloEntityType;
    if (params?.haloEntityId) queryParams.halo_entity_id = params.haloEntityId;
    if (params?.externalEntityType) queryParams.external_entity_type = params.externalEntityType;
    if (params?.syncStatus) queryParams.sync_status = params.syncStatus;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ entities: ExternalEntityAPI[] }>('/Integration/ExternalEntities', queryParams);
    return (response.entities || []).map(transformExternalEntity);
  }

  /**
   * Get external reference for a Halo entity.
   */
  async getForHaloEntity(
    integrationId: number,
    haloEntityType: string,
    haloEntityId: number
  ): Promise<ExternalEntity | null> {
    const entities = await this.list({
      integrationId,
      haloEntityType,
      haloEntityId,
    });
    return entities.length > 0 ? entities[0] : null;
  }

  /**
   * Get Halo entity for an external reference.
   */
  async getForExternalEntity(
    integrationId: number,
    externalEntityType: string,
    externalEntityId: string
  ): Promise<ExternalEntity | null> {
    const response = await this.client.get<{ entity: ExternalEntityAPI | null }>(
      '/Integration/ExternalEntities/Lookup',
      {
        integration_id: integrationId,
        external_entity_type: externalEntityType,
        external_entity_id: externalEntityId,
      }
    );
    return response.entity ? transformExternalEntity(response.entity) : null;
  }

  /**
   * Create a manual link between Halo and external entity.
   */
  async link(
    integrationId: number,
    haloEntityType: string,
    haloEntityId: number,
    externalEntityType: string,
    externalEntityId: string,
    externalEntityName?: string
  ): Promise<ExternalEntity> {
    const response = await this.client.post<ExternalEntityAPI>('/Integration/ExternalEntities/Link', {
      integration_id: integrationId,
      halo_entity_type: haloEntityType,
      halo_entity_id: haloEntityId,
      external_entity_type: externalEntityType,
      external_entity_id: externalEntityId,
      external_entity_name: externalEntityName,
    });
    return transformExternalEntity(response);
  }

  /**
   * Remove a link between Halo and external entity.
   */
  async unlink(
    integrationId: number,
    haloEntityType: string,
    haloEntityId: number
  ): Promise<void> {
    await this.client.post('/Integration/ExternalEntities/Unlink', {
      integration_id: integrationId,
      halo_entity_type: haloEntityType,
      halo_entity_id: haloEntityId,
    });
  }
}

/**
 * Service for Azure AD specific operations.
 */
export class AzureADIntegrationService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Get Azure AD integration configuration.
   */
  async getConfig(): Promise<AzureADConfig> {
    const response = await this.client.get<AzureADConfigAPI>('/IntegrationData/Get/AzureAD');
    return this.transformConfig(response);
  }

  /**
   * Update Azure AD configuration.
   */
  async updateConfig(config: Partial<AzureADConfig>): Promise<AzureADConfig> {
    const payload = this.toAPIFormat(config);
    const response = await this.client.post<AzureADConfigAPI>('/IntegrationData/Post/AzureAD', payload);
    return this.transformConfig(response);
  }

  /**
   * Sync Azure AD users.
   */
  async syncUsers(): Promise<SyncResult> {
    const response = await this.client.post<SyncResultAPI>('/IntegrationData/Sync/AzureAD/Users', {});
    return transformSyncResult(response);
  }

  /**
   * Sync Azure AD groups.
   */
  async syncGroups(): Promise<SyncResult> {
    const response = await this.client.post<SyncResultAPI>('/IntegrationData/Sync/AzureAD/Groups', {});
    return transformSyncResult(response);
  }

  /**
   * Get Azure AD users preview (what would be synced).
   */
  async previewUsers(filter?: string): Promise<{ id: string; displayName: string; email: string; department?: string }[]> {
    const response = await this.client.get<{ users: { id: string; displayName: string; email: string; department?: string }[] }>(
      '/IntegrationData/Preview/AzureAD/Users',
      filter ? { filter } : undefined
    );
    return response.users || [];
  }

  private transformConfig(api: AzureADConfigAPI): AzureADConfig {
    return {
      tenantId: api.tenant_id,
      clientId: api.client_id,
      syncUsers: api.sync_users,
      syncGroups: api.sync_groups,
      syncDevices: api.sync_devices,
      userFilter: api.user_filter,
      groupFilter: api.group_filter,
      defaultClientId: api.default_client_id,
      defaultSiteId: api.default_site_id,
      createUsers: api.create_users,
      updateUsers: api.update_users,
      disableDeletedUsers: api.disable_deleted_users,
    };
  }

  private toAPIFormat(config: Partial<AzureADConfig>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (config.tenantId !== undefined) api.tenant_id = config.tenantId;
    if (config.clientId !== undefined) api.client_id = config.clientId;
    if (config.syncUsers !== undefined) api.sync_users = config.syncUsers;
    if (config.syncGroups !== undefined) api.sync_groups = config.syncGroups;
    if (config.syncDevices !== undefined) api.sync_devices = config.syncDevices;
    if (config.userFilter !== undefined) api.user_filter = config.userFilter;
    if (config.groupFilter !== undefined) api.group_filter = config.groupFilter;
    if (config.defaultClientId !== undefined) api.default_client_id = config.defaultClientId;
    if (config.defaultSiteId !== undefined) api.default_site_id = config.defaultSiteId;
    if (config.createUsers !== undefined) api.create_users = config.createUsers;
    if (config.updateUsers !== undefined) api.update_users = config.updateUsers;
    if (config.disableDeletedUsers !== undefined) api.disable_deleted_users = config.disableDeletedUsers;

    return api;
  }
}

/**
 * Service for Intune specific operations.
 */
export class IntuneIntegrationService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Get Intune integration configuration.
   */
  async getConfig(): Promise<IntuneConfig> {
    const response = await this.client.get<IntuneConfigAPI>('/IntegrationData/Get/Intune');
    return this.transformConfig(response);
  }

  /**
   * Update Intune configuration.
   */
  async updateConfig(config: Partial<IntuneConfig>): Promise<IntuneConfig> {
    const payload = this.toAPIFormat(config);
    const response = await this.client.post<IntuneConfigAPI>('/IntegrationData/Post/Intune', payload);
    return this.transformConfig(response);
  }

  /**
   * Sync Intune managed devices.
   */
  async syncDevices(): Promise<SyncResult> {
    const response = await this.client.post<SyncResultAPI>('/IntegrationData/Sync/Intune/Devices', {});
    return transformSyncResult(response);
  }

  /**
   * Get Intune devices preview.
   */
  async previewDevices(filter?: string): Promise<{ id: string; deviceName: string; osVersion: string; complianceState: string }[]> {
    const response = await this.client.get<{ devices: { id: string; deviceName: string; osVersion: string; complianceState: string }[] }>(
      '/IntegrationData/Preview/Intune/Devices',
      filter ? { filter } : undefined
    );
    return response.devices || [];
  }

  private transformConfig(api: IntuneConfigAPI): IntuneConfig {
    return {
      tenantId: api.tenant_id,
      clientId: api.client_id,
      syncManagedDevices: api.sync_managed_devices,
      syncCompliance: api.sync_compliance,
      syncApps: api.sync_apps,
      deviceFilter: api.device_filter,
      defaultAssetTypeId: api.default_asset_type_id,
      createAssets: api.create_assets,
      updateAssets: api.update_assets,
    };
  }

  private toAPIFormat(config: Partial<IntuneConfig>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (config.tenantId !== undefined) api.tenant_id = config.tenantId;
    if (config.clientId !== undefined) api.client_id = config.clientId;
    if (config.syncManagedDevices !== undefined) api.sync_managed_devices = config.syncManagedDevices;
    if (config.syncCompliance !== undefined) api.sync_compliance = config.syncCompliance;
    if (config.syncApps !== undefined) api.sync_apps = config.syncApps;
    if (config.deviceFilter !== undefined) api.device_filter = config.deviceFilter;
    if (config.defaultAssetTypeId !== undefined) api.default_asset_type_id = config.defaultAssetTypeId;
    if (config.createAssets !== undefined) api.create_assets = config.createAssets;
    if (config.updateAssets !== undefined) api.update_assets = config.updateAssets;

    return api;
  }
}

/**
 * Service for Slack/Teams integration operations.
 */
export class ChatIntegrationService {
  private integrationName: 'Slack' | 'Teams';

  constructor(private client: HaloPSAClient, integrationName: 'Slack' | 'Teams') {
    this.integrationName = integrationName;
  }

  /**
   * Get chat integration configuration.
   */
  async getConfig(): Promise<ChatIntegrationConfig> {
    const response = await this.client.get<ChatIntegrationConfigAPI>(`/IntegrationData/Get/${this.integrationName}`);
    return this.transformConfig(response);
  }

  /**
   * Update chat integration configuration.
   */
  async updateConfig(config: Partial<ChatIntegrationConfig>): Promise<ChatIntegrationConfig> {
    const payload = this.toAPIFormat(config);
    const response = await this.client.post<ChatIntegrationConfigAPI>(`/IntegrationData/Post/${this.integrationName}`, payload);
    return this.transformConfig(response);
  }

  /**
   * Send a test message.
   */
  async sendTestMessage(channelId?: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post<{ success: boolean; message: string }>(
      `/IntegrationData/Test/${this.integrationName}`,
      channelId ? { channel_id: channelId } : {}
    );
    return response;
  }

  /**
   * Get available channels.
   */
  async getChannels(): Promise<{ id: string; name: string; isPrivate: boolean }[]> {
    const response = await this.client.get<{ channels: { id: string; name: string; is_private: boolean }[] }>(
      `/IntegrationData/Get/${this.integrationName}/Channels`
    );
    return (response.channels || []).map((c) => ({
      id: c.id,
      name: c.name,
      isPrivate: c.is_private,
    }));
  }

  private transformConfig(api: ChatIntegrationConfigAPI): ChatIntegrationConfig {
    return {
      webhookUrl: api.webhook_url,
      defaultChannelId: api.default_channel_id,
      notifyOnTicketCreate: api.notify_on_ticket_create,
      notifyOnTicketUpdate: api.notify_on_ticket_update,
      notifyOnTicketClose: api.notify_on_ticket_close,
      notifyOnSLABreach: api.notify_on_sla_breach,
      mentionAssignee: api.mention_assignee,
      includeDescription: api.include_description,
      ticketTypes: api.ticket_types,
      priorities: api.priorities,
    };
  }

  private toAPIFormat(config: Partial<ChatIntegrationConfig>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (config.webhookUrl !== undefined) api.webhook_url = config.webhookUrl;
    if (config.defaultChannelId !== undefined) api.default_channel_id = config.defaultChannelId;
    if (config.notifyOnTicketCreate !== undefined) api.notify_on_ticket_create = config.notifyOnTicketCreate;
    if (config.notifyOnTicketUpdate !== undefined) api.notify_on_ticket_update = config.notifyOnTicketUpdate;
    if (config.notifyOnTicketClose !== undefined) api.notify_on_ticket_close = config.notifyOnTicketClose;
    if (config.notifyOnSLABreach !== undefined) api.notify_on_sla_breach = config.notifyOnSLABreach;
    if (config.mentionAssignee !== undefined) api.mention_assignee = config.mentionAssignee;
    if (config.includeDescription !== undefined) api.include_description = config.includeDescription;
    if (config.ticketTypes !== undefined) api.ticket_types = config.ticketTypes;
    if (config.priorities !== undefined) api.priorities = config.priorities;

    return api;
  }
}

/**
 * Service for RMM integration operations (NinjaRMM, Datto, etc.).
 */
export class RMMIntegrationService {
  private integrationName: string;

  constructor(private client: HaloPSAClient, integrationName: 'NinjaRMM' | 'Datto' | 'NAble') {
    this.integrationName = integrationName;
  }

  /**
   * Get RMM integration configuration.
   */
  async getConfig(): Promise<RMMIntegrationConfig> {
    const response = await this.client.get<RMMIntegrationConfigAPI>(`/IntegrationData/Get/${this.integrationName}`);
    return this.transformConfig(response);
  }

  /**
   * Update RMM integration configuration.
   */
  async updateConfig(config: Partial<RMMIntegrationConfig>): Promise<RMMIntegrationConfig> {
    const payload = this.toAPIFormat(config);
    const response = await this.client.post<RMMIntegrationConfigAPI>(`/IntegrationData/Post/${this.integrationName}`, payload);
    return this.transformConfig(response);
  }

  /**
   * Sync devices from RMM.
   */
  async syncDevices(): Promise<SyncResult> {
    const response = await this.client.post<SyncResultAPI>(`/IntegrationData/Sync/${this.integrationName}/Devices`, {});
    return transformSyncResult(response);
  }

  /**
   * Sync alerts from RMM.
   */
  async syncAlerts(): Promise<SyncResult> {
    const response = await this.client.post<SyncResultAPI>(`/IntegrationData/Sync/${this.integrationName}/Alerts`, {});
    return transformSyncResult(response);
  }

  /**
   * Get pending alerts.
   */
  async getPendingAlerts(): Promise<{ id: string; deviceName: string; severity: string; message: string; timestamp: string }[]> {
    const response = await this.client.get<{ alerts: { id: string; device_name: string; severity: string; message: string; timestamp: string }[] }>(
      `/IntegrationData/Get/${this.integrationName}/Alerts`
    );
    return (response.alerts || []).map((a) => ({
      id: a.id,
      deviceName: a.device_name,
      severity: a.severity,
      message: a.message,
      timestamp: a.timestamp,
    }));
  }

  private transformConfig(api: RMMIntegrationConfigAPI): RMMIntegrationConfig {
    return {
      apiUrl: api.api_url,
      apiKey: api.api_key,
      syncDevices: api.sync_devices,
      syncAlerts: api.sync_alerts,
      createTicketsFromAlerts: api.create_tickets_from_alerts,
      alertTicketTypeId: api.alert_ticket_type_id,
      alertPriorityMapping: api.alert_priority_mapping,
      deviceAssetTypeId: api.device_asset_type_id,
      syncInterval: api.sync_interval,
    };
  }

  private toAPIFormat(config: Partial<RMMIntegrationConfig>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (config.apiUrl !== undefined) api.api_url = config.apiUrl;
    if (config.apiKey !== undefined) api.api_key = config.apiKey;
    if (config.syncDevices !== undefined) api.sync_devices = config.syncDevices;
    if (config.syncAlerts !== undefined) api.sync_alerts = config.syncAlerts;
    if (config.createTicketsFromAlerts !== undefined) api.create_tickets_from_alerts = config.createTicketsFromAlerts;
    if (config.alertTicketTypeId !== undefined) api.alert_ticket_type_id = config.alertTicketTypeId;
    if (config.alertPriorityMapping !== undefined) api.alert_priority_mapping = config.alertPriorityMapping;
    if (config.deviceAssetTypeId !== undefined) api.device_asset_type_id = config.deviceAssetTypeId;
    if (config.syncInterval !== undefined) api.sync_interval = config.syncInterval;

    return api;
  }
}
