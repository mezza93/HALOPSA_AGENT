/**
 * Integration AI tools for HaloPSA.
 * Phase 5: Integrations & Webhooks
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type {
  Integration,
  IntegrationMapping,
  SyncResult,
  IntegrationLog,
  ExternalEntity,
} from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

const integrationTypeSchema = z.enum([
  'azure_ad', 'intune', 'microsoft_csp', 'office365',
  'connectwise_manage', 'connectwise_automate', 'datto_rmm',
  'datto_autotask', 'ninja_rmm', 'n_able', 'jira', 'slack',
  'teams', 'quickbooks', 'xero', 'freshbooks', 'custom',
]);

const integrationStatusSchema = z.enum([
  'active', 'inactive', 'error', 'syncing', 'pending_auth', 'disabled',
]);

const syncDirectionSchema = z.enum(['inbound', 'outbound', 'bidirectional']);

const syncFrequencySchema = z.enum([
  'realtime', 'hourly', 'daily', 'weekly', 'manual',
]);

export function createIntegrationTools(ctx: HaloContext) {
  return {
    // === INTEGRATION MANAGEMENT ===
    listIntegrations: tool({
      description: 'List all integrations with optional filters.',
      parameters: z.object({
        type: integrationTypeSchema.optional().describe('Filter by integration type'),
        status: integrationStatusSchema.optional().describe('Filter by status'),
        isEnabled: z.boolean().optional().describe('Filter by enabled state'),
        search: z.string().optional().describe('Search in name/description'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ type, status, isEnabled, search, count }) => {
        try {
          const integrations = await ctx.integrations.list({
            type,
            status,
            isEnabled,
            search,
            pageSize: count,
          });

          return {
            success: true,
            count: integrations.length,
            data: integrations.map((i: Integration) => ({
              id: i.id,
              name: i.name,
              type: i.type,
              displayName: i.displayName,
              status: i.status,
              isEnabled: i.isEnabled,
              syncDirection: i.syncDirection,
              syncFrequency: i.syncFrequency,
              lastSyncAt: i.lastSyncAt,
              lastSyncStatus: i.lastSyncStatus,
            })),
          };
        } catch (error) {
          return formatError(error, 'listIntegrations');
        }
      },
    }),

    getIntegration: tool({
      description: 'Get details of a specific integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const integration = await ctx.integrations.get(integrationId);
          return {
            success: true,
            id: integration.id,
            name: integration.name,
            type: integration.type,
            displayName: integration.displayName,
            description: integration.description,
            status: integration.status,
            isEnabled: integration.isEnabled,
            syncDirection: integration.syncDirection,
            syncFrequency: integration.syncFrequency,
            lastSyncAt: integration.lastSyncAt,
            lastSyncStatus: integration.lastSyncStatus,
            lastErrorMessage: integration.lastErrorMessage,
            recordsSynced: integration.recordsSynced,
            recordsFailed: integration.recordsFailed,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
          };
        } catch (error) {
          return formatError(error, 'getIntegration');
        }
      },
    }),

    getIntegrationByType: tool({
      description: 'Get integration by type (e.g., azure_ad, slack).',
      parameters: z.object({
        type: integrationTypeSchema.describe('The integration type'),
      }),
      execute: async ({ type }) => {
        try {
          const integration = await ctx.integrations.getByType(type);
          if (!integration) {
            return {
              success: false,
              error: `No integration found for type: ${type}`,
            };
          }
          return {
            success: true,
            id: integration.id,
            name: integration.name,
            type: integration.type,
            status: integration.status,
            isEnabled: integration.isEnabled,
            lastSyncAt: integration.lastSyncAt,
          };
        } catch (error) {
          return formatError(error, 'getIntegrationByType');
        }
      },
    }),

    createIntegration: tool({
      description: 'Create a new integration.',
      parameters: z.object({
        name: z.string().describe('Integration name'),
        type: integrationTypeSchema.describe('Integration type'),
        displayName: z.string().optional().describe('Display name'),
        description: z.string().optional().describe('Description'),
        syncDirection: syncDirectionSchema.optional().describe('Sync direction'),
        syncFrequency: syncFrequencySchema.optional().describe('Sync frequency'),
      }),
      execute: async ({ name, type, displayName, description, syncDirection, syncFrequency }) => {
        try {
          const integration = await ctx.integrations.create({
            name,
            type,
            displayName,
            description,
            syncDirection,
            syncFrequency,
            isEnabled: false,
          });

          return {
            success: true,
            message: `Integration "${integration.name}" created (disabled by default)`,
            integrationId: integration.id,
          };
        } catch (error) {
          return formatError(error, 'createIntegration');
        }
      },
    }),

    enableIntegration: tool({
      description: 'Enable an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const integration = await ctx.integrations.enable(integrationId);
          return {
            success: true,
            message: `Integration "${integration.name}" enabled`,
          };
        } catch (error) {
          return formatError(error, 'enableIntegration');
        }
      },
    }),

    disableIntegration: tool({
      description: 'Disable an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const integration = await ctx.integrations.disable(integrationId);
          return {
            success: true,
            message: `Integration "${integration.name}" disabled`,
          };
        } catch (error) {
          return formatError(error, 'disableIntegration');
        }
      },
    }),

    testIntegrationConnection: tool({
      description: 'Test connection to an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const result = await ctx.integrations.testConnection(integrationId);
          return {
            success: result.success,
            message: result.message,
            details: result.details,
          };
        } catch (error) {
          return formatError(error, 'testIntegrationConnection');
        }
      },
    }),

    deleteIntegration: tool({
      description: 'Delete an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          await ctx.integrations.delete(integrationId);
          return {
            success: true,
            message: `Integration ${integrationId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteIntegration');
        }
      },
    }),

    getAvailableIntegrationTypes: tool({
      description: 'Get list of available integration types.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const types = await ctx.integrations.getAvailableTypes();
          return {
            success: true,
            count: types.length,
            types: types.map((t: { type: string; name: string; description: string; category: string }) => ({
              type: t.type,
              name: t.name,
              description: t.description,
              category: t.category,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAvailableIntegrationTypes');
        }
      },
    }),

    // === FIELD MAPPINGS ===
    listIntegrationMappings: tool({
      description: 'List field mappings for an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const mappings = await ctx.integrationMappings.list(integrationId);
          return {
            success: true,
            count: mappings.length,
            data: mappings.map((m: IntegrationMapping) => ({
              id: m.id,
              entityType: m.entityType,
              externalEntityType: m.externalEntityType,
              haloField: m.haloField,
              externalField: m.externalField,
              direction: m.direction,
              isRequired: m.isRequired,
              isEnabled: m.isEnabled,
            })),
          };
        } catch (error) {
          return formatError(error, 'listIntegrationMappings');
        }
      },
    }),

    createIntegrationMapping: tool({
      description: 'Create a field mapping for an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        entityType: z.string().describe('Halo entity type (e.g., ticket, client, asset)'),
        externalEntityType: z.string().describe('External entity type'),
        haloField: z.string().describe('Halo field name'),
        externalField: z.string().describe('External field name'),
        direction: syncDirectionSchema.optional().describe('Mapping direction'),
        transformRule: z.string().optional().describe('Transform rule'),
        isRequired: z.boolean().optional().describe('Is this mapping required'),
      }),
      execute: async ({ integrationId, entityType, externalEntityType, haloField, externalField, direction, transformRule, isRequired }) => {
        try {
          const mapping = await ctx.integrationMappings.create(integrationId, {
            entityType,
            externalEntityType,
            haloField,
            externalField,
            direction,
            transformRule,
            isRequired,
            isEnabled: true,
          });

          return {
            success: true,
            message: `Mapping created: ${haloField} <-> ${externalField}`,
            mappingId: mapping.id,
          };
        } catch (error) {
          return formatError(error, 'createIntegrationMapping');
        }
      },
    }),

    deleteIntegrationMapping: tool({
      description: 'Delete a field mapping.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        mappingId: z.number().describe('The mapping ID'),
      }),
      execute: async ({ integrationId, mappingId }) => {
        try {
          await ctx.integrationMappings.delete(integrationId, mappingId);
          return {
            success: true,
            message: `Mapping ${mappingId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteIntegrationMapping');
        }
      },
    }),

    getAvailableMappingFields: tool({
      description: 'Get available fields for mapping.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        entityType: z.string().describe('Entity type to get fields for'),
      }),
      execute: async ({ integrationId, entityType }) => {
        try {
          const fields = await ctx.integrationMappings.getAvailableFields(integrationId, entityType);
          return {
            success: true,
            haloFields: fields.haloFields,
            externalFields: fields.externalFields,
          };
        } catch (error) {
          return formatError(error, 'getAvailableMappingFields');
        }
      },
    }),

    // === SYNC OPERATIONS ===
    triggerSync: tool({
      description: 'Trigger a sync for an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        fullSync: z.boolean().optional().describe('Perform full sync instead of incremental'),
        entityTypes: z.array(z.string()).optional().describe('Specific entity types to sync'),
      }),
      execute: async ({ integrationId, fullSync, entityTypes }) => {
        try {
          const result = await ctx.integrationSync.triggerSync(integrationId, { fullSync, entityTypes });
          return {
            success: true,
            syncId: result.id,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        } catch (error) {
          return formatError(error, 'triggerSync');
        }
      },
    }),

    getSyncStatus: tool({
      description: 'Get current sync status for an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const status = await ctx.integrationSync.getStatus(integrationId);
          return {
            success: true,
            status: status.status,
            progress: status.progress,
            currentEntity: status.currentEntity,
            recordsProcessed: status.recordsProcessed,
            startedAt: status.startedAt,
            estimatedCompletion: status.estimatedCompletion,
          };
        } catch (error) {
          return formatError(error, 'getSyncStatus');
        }
      },
    }),

    cancelSync: tool({
      description: 'Cancel a running sync.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          await ctx.integrationSync.cancelSync(integrationId);
          return {
            success: true,
            message: 'Sync cancelled',
          };
        } catch (error) {
          return formatError(error, 'cancelSync');
        }
      },
    }),

    getSyncHistory: tool({
      description: 'Get sync history for integrations.',
      parameters: z.object({
        integrationId: z.number().optional().describe('Filter by integration ID'),
        status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional().describe('Filter by status'),
        fromDate: z.string().optional().describe('From date (ISO format)'),
        toDate: z.string().optional().describe('To date (ISO format)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ integrationId, status, fromDate, toDate, count }) => {
        try {
          const history = await ctx.integrationSync.getHistory({
            integrationId,
            status,
            fromDate,
            toDate,
            pageSize: count,
          });

          return {
            success: true,
            count: history.length,
            data: history.map((h: SyncResult) => ({
              id: h.id,
              integrationId: h.integrationId,
              status: h.status,
              startedAt: h.startedAt,
              completedAt: h.completedAt,
              duration: h.duration,
              recordsProcessed: h.recordsProcessed,
              recordsCreated: h.recordsCreated,
              recordsUpdated: h.recordsUpdated,
              recordsFailed: h.recordsFailed,
              errorMessage: h.errorMessage,
            })),
          };
        } catch (error) {
          return formatError(error, 'getSyncHistory');
        }
      },
    }),

    retryFailedRecords: tool({
      description: 'Retry failed records from last sync.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
      }),
      execute: async ({ integrationId }) => {
        try {
          const result = await ctx.integrationSync.retryFailed(integrationId);
          return {
            success: true,
            message: 'Retry initiated',
            recordsToRetry: result.recordsFailed,
          };
        } catch (error) {
          return formatError(error, 'retryFailedRecords');
        }
      },
    }),

    // === INTEGRATION LOGS ===
    listIntegrationLogs: tool({
      description: 'List integration logs.',
      parameters: z.object({
        integrationId: z.number().optional().describe('Filter by integration ID'),
        level: z.enum(['debug', 'info', 'warning', 'error']).optional().describe('Filter by log level'),
        entityType: z.string().optional().describe('Filter by entity type'),
        search: z.string().optional().describe('Search in message'),
        fromDate: z.string().optional().describe('From date (ISO format)'),
        toDate: z.string().optional().describe('To date (ISO format)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ integrationId, level, entityType, search, fromDate, toDate, count }) => {
        try {
          const logs = await ctx.integrationLogs.list({
            integrationId,
            level,
            entityType,
            search,
            fromDate,
            toDate,
            pageSize: count,
          });

          return {
            success: true,
            count: logs.length,
            data: logs.map((l: IntegrationLog) => ({
              id: l.id,
              integrationId: l.integrationId,
              level: l.level,
              message: l.message,
              entityType: l.entityType,
              entityId: l.entityId,
              externalId: l.externalId,
              timestamp: l.timestamp,
            })),
          };
        } catch (error) {
          return formatError(error, 'listIntegrationLogs');
        }
      },
    }),

    getIntegrationErrors: tool({
      description: 'Get error logs for integrations.',
      parameters: z.object({
        integrationId: z.number().optional().describe('Filter by integration ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ integrationId, count }) => {
        try {
          const logs = await ctx.integrationLogs.getErrors({
            integrationId,
            pageSize: count,
          });

          return {
            success: true,
            count: logs.length,
            data: logs.map((l: IntegrationLog) => ({
              id: l.id,
              integrationId: l.integrationId,
              message: l.message,
              entityType: l.entityType,
              entityId: l.entityId,
              timestamp: l.timestamp,
              details: l.details,
            })),
          };
        } catch (error) {
          return formatError(error, 'getIntegrationErrors');
        }
      },
    }),

    clearIntegrationLogs: tool({
      description: 'Clear logs for an integration.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        beforeDate: z.string().optional().describe('Clear logs before this date (ISO format)'),
      }),
      execute: async ({ integrationId, beforeDate }) => {
        try {
          await ctx.integrationLogs.clear(integrationId, beforeDate);
          return {
            success: true,
            message: `Logs cleared for integration ${integrationId}`,
          };
        } catch (error) {
          return formatError(error, 'clearIntegrationLogs');
        }
      },
    }),

    // === EXTERNAL ENTITIES ===
    listExternalEntities: tool({
      description: 'List external entity references.',
      parameters: z.object({
        integrationId: z.number().optional().describe('Filter by integration ID'),
        haloEntityType: z.string().optional().describe('Filter by Halo entity type'),
        externalEntityType: z.string().optional().describe('Filter by external entity type'),
        syncStatus: z.enum(['synced', 'pending', 'error', 'orphaned']).optional().describe('Filter by sync status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ integrationId, haloEntityType, externalEntityType, syncStatus, count }) => {
        try {
          const entities = await ctx.externalEntities.list({
            integrationId,
            haloEntityType,
            externalEntityType,
            syncStatus,
            pageSize: count,
          });

          return {
            success: true,
            count: entities.length,
            data: entities.map((e: ExternalEntity) => ({
              id: e.id,
              integrationId: e.integrationId,
              haloEntityType: e.haloEntityType,
              haloEntityId: e.haloEntityId,
              externalEntityType: e.externalEntityType,
              externalEntityId: e.externalEntityId,
              externalEntityName: e.externalEntityName,
              syncStatus: e.syncStatus,
              lastSyncAt: e.lastSyncAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'listExternalEntities');
        }
      },
    }),

    lookupExternalEntity: tool({
      description: 'Find external entity reference for a Halo entity.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        haloEntityType: z.string().describe('Halo entity type'),
        haloEntityId: z.number().describe('Halo entity ID'),
      }),
      execute: async ({ integrationId, haloEntityType, haloEntityId }) => {
        try {
          const entity = await ctx.externalEntities.getForHaloEntity(integrationId, haloEntityType, haloEntityId);
          if (!entity) {
            return {
              success: false,
              error: 'No external entity link found',
            };
          }
          return {
            success: true,
            externalEntityType: entity.externalEntityType,
            externalEntityId: entity.externalEntityId,
            externalEntityName: entity.externalEntityName,
            syncStatus: entity.syncStatus,
            lastSyncAt: entity.lastSyncAt,
          };
        } catch (error) {
          return formatError(error, 'lookupExternalEntity');
        }
      },
    }),

    linkExternalEntity: tool({
      description: 'Create a manual link between Halo and external entity.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        haloEntityType: z.string().describe('Halo entity type'),
        haloEntityId: z.number().describe('Halo entity ID'),
        externalEntityType: z.string().describe('External entity type'),
        externalEntityId: z.string().describe('External entity ID'),
        externalEntityName: z.string().optional().describe('External entity name'),
      }),
      execute: async ({ integrationId, haloEntityType, haloEntityId, externalEntityType, externalEntityId, externalEntityName }) => {
        try {
          const entity = await ctx.externalEntities.link(
            integrationId,
            haloEntityType,
            haloEntityId,
            externalEntityType,
            externalEntityId,
            externalEntityName
          );
          return {
            success: true,
            message: 'Entity linked successfully',
            linkId: entity.id,
          };
        } catch (error) {
          return formatError(error, 'linkExternalEntity');
        }
      },
    }),

    unlinkExternalEntity: tool({
      description: 'Remove link between Halo and external entity.',
      parameters: z.object({
        integrationId: z.number().describe('The integration ID'),
        haloEntityType: z.string().describe('Halo entity type'),
        haloEntityId: z.number().describe('Halo entity ID'),
      }),
      execute: async ({ integrationId, haloEntityType, haloEntityId }) => {
        try {
          await ctx.externalEntities.unlink(integrationId, haloEntityType, haloEntityId);
          return {
            success: true,
            message: 'Entity unlinked',
          };
        } catch (error) {
          return formatError(error, 'unlinkExternalEntity');
        }
      },
    }),

    // === AZURE AD ===
    getAzureADConfig: tool({
      description: 'Get Azure AD integration configuration.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const config = await ctx.azureAD.getConfig();
          return {
            success: true,
            tenantId: config.tenantId,
            syncUsers: config.syncUsers,
            syncGroups: config.syncGroups,
            syncDevices: config.syncDevices,
            userFilter: config.userFilter,
            groupFilter: config.groupFilter,
            createUsers: config.createUsers,
            updateUsers: config.updateUsers,
            disableDeletedUsers: config.disableDeletedUsers,
          };
        } catch (error) {
          return formatError(error, 'getAzureADConfig');
        }
      },
    }),

    syncAzureADUsers: tool({
      description: 'Sync users from Azure AD.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await ctx.azureAD.syncUsers();
          return {
            success: true,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        } catch (error) {
          return formatError(error, 'syncAzureADUsers');
        }
      },
    }),

    syncAzureADGroups: tool({
      description: 'Sync groups from Azure AD.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await ctx.azureAD.syncGroups();
          return {
            success: true,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
          };
        } catch (error) {
          return formatError(error, 'syncAzureADGroups');
        }
      },
    }),

    previewAzureADUsers: tool({
      description: 'Preview Azure AD users that would be synced.',
      parameters: z.object({
        filter: z.string().optional().describe('OData filter expression'),
      }),
      execute: async ({ filter }) => {
        try {
          const users = await ctx.azureAD.previewUsers(filter);
          return {
            success: true,
            count: users.length,
            users: users.slice(0, 20).map((u: { id: string; displayName: string; email: string; department?: string }) => ({
              id: u.id,
              displayName: u.displayName,
              email: u.email,
              department: u.department,
            })),
          };
        } catch (error) {
          return formatError(error, 'previewAzureADUsers');
        }
      },
    }),

    // === INTUNE ===
    getIntuneConfig: tool({
      description: 'Get Intune integration configuration.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const config = await ctx.intune.getConfig();
          return {
            success: true,
            syncManagedDevices: config.syncManagedDevices,
            syncCompliance: config.syncCompliance,
            syncApps: config.syncApps,
            deviceFilter: config.deviceFilter,
            defaultAssetTypeId: config.defaultAssetTypeId,
            createAssets: config.createAssets,
            updateAssets: config.updateAssets,
          };
        } catch (error) {
          return formatError(error, 'getIntuneConfig');
        }
      },
    }),

    syncIntuneDevices: tool({
      description: 'Sync managed devices from Intune.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await ctx.intune.syncDevices();
          return {
            success: true,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        } catch (error) {
          return formatError(error, 'syncIntuneDevices');
        }
      },
    }),

    previewIntuneDevices: tool({
      description: 'Preview Intune devices that would be synced.',
      parameters: z.object({
        filter: z.string().optional().describe('OData filter expression'),
      }),
      execute: async ({ filter }) => {
        try {
          const devices = await ctx.intune.previewDevices(filter);
          return {
            success: true,
            count: devices.length,
            devices: devices.slice(0, 20).map((d: { id: string; deviceName: string; osVersion: string; complianceState: string }) => ({
              id: d.id,
              deviceName: d.deviceName,
              osVersion: d.osVersion,
              complianceState: d.complianceState,
            })),
          };
        } catch (error) {
          return formatError(error, 'previewIntuneDevices');
        }
      },
    }),

    // === CHAT INTEGRATIONS (Slack/Teams) ===
    getSlackConfig: tool({
      description: 'Get Slack integration configuration.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const config = await ctx.slack.getConfig();
          return {
            success: true,
            defaultChannelId: config.defaultChannelId,
            notifyOnTicketCreate: config.notifyOnTicketCreate,
            notifyOnTicketUpdate: config.notifyOnTicketUpdate,
            notifyOnTicketClose: config.notifyOnTicketClose,
            notifyOnSLABreach: config.notifyOnSLABreach,
            mentionAssignee: config.mentionAssignee,
            includeDescription: config.includeDescription,
          };
        } catch (error) {
          return formatError(error, 'getSlackConfig');
        }
      },
    }),

    getSlackChannels: tool({
      description: 'Get available Slack channels.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const channels = await ctx.slack.getChannels();
          return {
            success: true,
            count: channels.length,
            channels: channels.map((c: { id: string; name: string; isPrivate: boolean }) => ({
              id: c.id,
              name: c.name,
              isPrivate: c.isPrivate,
            })),
          };
        } catch (error) {
          return formatError(error, 'getSlackChannels');
        }
      },
    }),

    sendSlackTestMessage: tool({
      description: 'Send a test message to Slack.',
      parameters: z.object({
        channelId: z.string().optional().describe('Channel ID to send to'),
      }),
      execute: async ({ channelId }) => {
        try {
          const result = await ctx.slack.sendTestMessage(channelId);
          return {
            success: result.success,
            message: result.message,
          };
        } catch (error) {
          return formatError(error, 'sendSlackTestMessage');
        }
      },
    }),

    getTeamsConfig: tool({
      description: 'Get Microsoft Teams integration configuration.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const config = await ctx.teams.getConfig();
          return {
            success: true,
            defaultChannelId: config.defaultChannelId,
            notifyOnTicketCreate: config.notifyOnTicketCreate,
            notifyOnTicketUpdate: config.notifyOnTicketUpdate,
            notifyOnTicketClose: config.notifyOnTicketClose,
            notifyOnSLABreach: config.notifyOnSLABreach,
            mentionAssignee: config.mentionAssignee,
          };
        } catch (error) {
          return formatError(error, 'getTeamsConfig');
        }
      },
    }),

    getTeamsChannels: tool({
      description: 'Get available Microsoft Teams channels.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const channels = await ctx.teams.getChannels();
          return {
            success: true,
            count: channels.length,
            channels: channels.map((c: { id: string; name: string; isPrivate: boolean }) => ({
              id: c.id,
              name: c.name,
              isPrivate: c.isPrivate,
            })),
          };
        } catch (error) {
          return formatError(error, 'getTeamsChannels');
        }
      },
    }),

    sendTeamsTestMessage: tool({
      description: 'Send a test message to Microsoft Teams.',
      parameters: z.object({
        channelId: z.string().optional().describe('Channel ID to send to'),
      }),
      execute: async ({ channelId }) => {
        try {
          const result = await ctx.teams.sendTestMessage(channelId);
          return {
            success: result.success,
            message: result.message,
          };
        } catch (error) {
          return formatError(error, 'sendTeamsTestMessage');
        }
      },
    }),

    // === RMM INTEGRATIONS ===
    getNinjaRMMConfig: tool({
      description: 'Get NinjaRMM integration configuration.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const config = await ctx.ninjaRMM.getConfig();
          return {
            success: true,
            apiUrl: config.apiUrl,
            syncDevices: config.syncDevices,
            syncAlerts: config.syncAlerts,
            createTicketsFromAlerts: config.createTicketsFromAlerts,
            alertTicketTypeId: config.alertTicketTypeId,
            deviceAssetTypeId: config.deviceAssetTypeId,
            syncInterval: config.syncInterval,
          };
        } catch (error) {
          return formatError(error, 'getNinjaRMMConfig');
        }
      },
    }),

    syncNinjaRMMDevices: tool({
      description: 'Sync devices from NinjaRMM.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await ctx.ninjaRMM.syncDevices();
          return {
            success: true,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        } catch (error) {
          return formatError(error, 'syncNinjaRMMDevices');
        }
      },
    }),

    syncNinjaRMMAlerts: tool({
      description: 'Sync alerts from NinjaRMM.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await ctx.ninjaRMM.syncAlerts();
          return {
            success: true,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
          };
        } catch (error) {
          return formatError(error, 'syncNinjaRMMAlerts');
        }
      },
    }),

    getNinjaRMMPendingAlerts: tool({
      description: 'Get pending alerts from NinjaRMM.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const alerts = await ctx.ninjaRMM.getPendingAlerts();
          return {
            success: true,
            count: alerts.length,
            alerts: alerts.slice(0, 20).map((a: { id: string; deviceName: string; severity: string; message: string; timestamp: string }) => ({
              id: a.id,
              deviceName: a.deviceName,
              severity: a.severity,
              message: a.message,
              timestamp: a.timestamp,
            })),
          };
        } catch (error) {
          return formatError(error, 'getNinjaRMMPendingAlerts');
        }
      },
    }),

    getDattoConfig: tool({
      description: 'Get Datto RMM integration configuration.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const config = await ctx.datto.getConfig();
          return {
            success: true,
            apiUrl: config.apiUrl,
            syncDevices: config.syncDevices,
            syncAlerts: config.syncAlerts,
            createTicketsFromAlerts: config.createTicketsFromAlerts,
            deviceAssetTypeId: config.deviceAssetTypeId,
            syncInterval: config.syncInterval,
          };
        } catch (error) {
          return formatError(error, 'getDattoConfig');
        }
      },
    }),

    syncDattoDevices: tool({
      description: 'Sync devices from Datto RMM.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await ctx.datto.syncDevices();
          return {
            success: true,
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        } catch (error) {
          return formatError(error, 'syncDattoDevices');
        }
      },
    }),

    getDattoPendingAlerts: tool({
      description: 'Get pending alerts from Datto RMM.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const alerts = await ctx.datto.getPendingAlerts();
          return {
            success: true,
            count: alerts.length,
            alerts: alerts.slice(0, 20).map((a: { id: string; deviceName: string; severity: string; message: string; timestamp: string }) => ({
              id: a.id,
              deviceName: a.deviceName,
              severity: a.severity,
              message: a.message,
              timestamp: a.timestamp,
            })),
          };
        } catch (error) {
          return formatError(error, 'getDattoPendingAlerts');
        }
      },
    }),
  };
}
