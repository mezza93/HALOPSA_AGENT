/**
 * Audit AI tools for HaloPSA.
 * Phase 4: Productivity & Automation
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { AuditLog, AuditPolicy, EntityHistory, SecurityEvent } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

const auditActionSchema = z.enum([
  'create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout',
  'password_change', 'permission_change', 'setting_change', 'email_sent',
  'sms_sent', 'api_call', 'webhook_triggered', 'rule_executed', 'approval_action',
  'bulk_action', 'integration_sync', 'report_generated', 'backup_created', 'restore_performed',
]);

const auditEntityTypeSchema = z.enum([
  'ticket', 'client', 'site', 'user', 'agent', 'team', 'asset', 'contract',
  'invoice', 'opportunity', 'quotation', 'project', 'kb_article', 'service',
  'product', 'supplier', 'webhook', 'rule', 'approval', 'release', 'cab',
  'report', 'setting', 'integration', 'role', 'permission', 'system',
]);

export function createAuditTools(ctx: HaloContext) {
  return {
    // === AUDIT LOG OPERATIONS ===
    listAuditLogs: tool({
      description: 'List audit log entries with optional filters.',
      parameters: z.object({
        action: auditActionSchema.optional().describe('Filter by action type'),
        entityType: auditEntityTypeSchema.optional().describe('Filter by entity type'),
        entityId: z.number().optional().describe('Filter by entity ID'),
        userId: z.number().optional().describe('Filter by user'),
        fromDate: z.string().optional().describe('From date (ISO format)'),
        toDate: z.string().optional().describe('To date (ISO format)'),
        search: z.string().optional().describe('Search in description'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ action, entityType, entityId, userId, fromDate, toDate, search, count }) => {
        try {
          const logs = await ctx.audit.list({
            action,
            entityType,
            entityId,
            userId,
            fromDate,
            toDate,
            search,
            pageSize: count,
          });

          return {
            success: true,
            count: logs.length,
            data: logs.map((l: AuditLog) => ({
              id: l.id,
              action: l.action,
              entityType: l.entityType,
              entityId: l.entityId,
              entityName: l.entityName,
              user: l.userName,
              userType: l.userType,
              timestamp: l.timestamp,
              description: l.description,
              ipAddress: l.ipAddress,
            })),
          };
        } catch (error) {
          return formatError(error, 'listAuditLogs');
        }
      },
    }),

    getAuditLog: tool({
      description: 'Get details of a specific audit log entry.',
      parameters: z.object({
        logId: z.number().describe('The audit log ID'),
      }),
      execute: async ({ logId }) => {
        try {
          const log = await ctx.audit.get(logId);

          return {
            success: true,
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            entityName: log.entityName,
            user: log.userName,
            userEmail: log.userEmail,
            userType: log.userType,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            timestamp: log.timestamp,
            description: log.description,
            changedFields: log.changedFields,
            oldValue: log.oldValue,
            newValue: log.newValue,
            isSystemGenerated: log.isSystemGenerated,
            client: log.clientName,
          };
        } catch (error) {
          return formatError(error, 'getAuditLog');
        }
      },
    }),

    getAuditSummary: tool({
      description: 'Get audit log summary/statistics for a time period.',
      parameters: z.object({
        fromDate: z.string().describe('From date (ISO format)'),
        toDate: z.string().describe('To date (ISO format)'),
        entityType: auditEntityTypeSchema.optional().describe('Filter by entity type'),
        groupBy: z.enum(['hour', 'day', 'week', 'month']).optional().describe('Group by time period'),
      }),
      execute: async ({ fromDate, toDate, entityType, groupBy }) => {
        try {
          const summary = await ctx.audit.getSummary({
            fromDate,
            toDate,
            entityType,
            groupBy,
            includeTopEntities: true,
            topEntitiesLimit: 10,
          });

          return {
            success: true,
            period: summary.period,
            fromDate: summary.fromDate,
            toDate: summary.toDate,
            totalEvents: summary.totalEvents,
            securityEvents: summary.securityEvents,
            systemEvents: summary.systemEvents,
            topActions: Object.entries(summary.eventsByAction)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 10)
              .map(([action, count]) => ({ action, count })),
            topEntities: summary.topEntities?.map((e: { entityType: string; entityId: number; entityName: string; count: number }) => ({
              type: e.entityType,
              id: e.entityId,
              name: e.entityName,
              count: e.count,
            })),
            topUsers: summary.eventsByUser.slice(0, 10).map((u: { userId: number; userName: string; count: number }) => ({
              userId: u.userId,
              name: u.userName,
              count: u.count,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAuditSummary');
        }
      },
    }),

    searchAuditLogs: tool({
      description: 'Search audit logs with full-text search.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        fromDate: z.string().optional().describe('From date (ISO format)'),
        toDate: z.string().optional().describe('To date (ISO format)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ query, fromDate, toDate, count }) => {
        try {
          const logs = await ctx.audit.search(query, {
            fromDate,
            toDate,
            pageSize: count,
          });

          return {
            success: true,
            count: logs.length,
            data: logs.map((l: AuditLog) => ({
              id: l.id,
              action: l.action,
              entityType: l.entityType,
              entityName: l.entityName,
              user: l.userName,
              timestamp: l.timestamp,
              description: l.description,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchAuditLogs');
        }
      },
    }),

    getEntityAuditLogs: tool({
      description: 'Get audit logs for a specific entity.',
      parameters: z.object({
        entityType: auditEntityTypeSchema.describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ entityType, entityId, count }) => {
        try {
          const logs = await ctx.audit.getByEntity(entityType, entityId, { pageSize: count });

          return {
            success: true,
            count: logs.length,
            data: logs.map((l: AuditLog) => ({
              id: l.id,
              action: l.action,
              user: l.userName,
              timestamp: l.timestamp,
              description: l.description,
              changedFields: l.changedFields,
            })),
          };
        } catch (error) {
          return formatError(error, 'getEntityAuditLogs');
        }
      },
    }),

    // === ENTITY HISTORY OPERATIONS ===
    getEntityHistory: tool({
      description: 'Get change history for a specific entity.',
      parameters: z.object({
        entityType: auditEntityTypeSchema.describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ entityType, entityId, count }) => {
        try {
          const history = await ctx.entityHistory.getHistory({
            entityType,
            entityId,
            pageSize: count,
          });

          return {
            success: true,
            count: history.length,
            versions: history.map((h: EntityHistory) => ({
              id: h.id,
              version: h.version,
              action: h.action,
              user: h.userName,
              timestamp: h.timestamp,
              changeCount: h.changes.length,
              changes: h.changes.slice(0, 10).map((c) => ({
                field: c.field,
                label: c.fieldLabel,
                changeType: c.changeType,
              })),
            })),
          };
        } catch (error) {
          return formatError(error, 'getEntityHistory');
        }
      },
    }),

    getTicketHistory: tool({
      description: 'Get change history for a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('Ticket ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ ticketId, count }) => {
        try {
          const history = await ctx.entityHistory.getTicketHistory(ticketId, { pageSize: count });

          return {
            success: true,
            count: history.length,
            versions: history.map((h: EntityHistory) => ({
              version: h.version,
              action: h.action,
              user: h.userName,
              timestamp: h.timestamp,
              changes: h.changes.map((c) => ({
                field: c.fieldLabel || c.field,
                changeType: c.changeType,
                oldValue: c.oldValue,
                newValue: c.newValue,
              })),
            })),
          };
        } catch (error) {
          return formatError(error, 'getTicketHistory');
        }
      },
    }),

    compareEntityVersions: tool({
      description: 'Compare two versions of an entity.',
      parameters: z.object({
        entityType: auditEntityTypeSchema.describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        version1: z.number().describe('First version number'),
        version2: z.number().describe('Second version number'),
      }),
      execute: async ({ entityType, entityId, version1, version2 }) => {
        try {
          const comparison = await ctx.entityHistory.compareVersions(
            entityType,
            entityId,
            version1,
            version2
          );

          return {
            success: true,
            version1: {
              version: comparison.version1.version,
              timestamp: comparison.version1.timestamp,
              user: comparison.version1.userName,
            },
            version2: {
              version: comparison.version2.version,
              timestamp: comparison.version2.timestamp,
              user: comparison.version2.userName,
            },
            differences: comparison.differences.map((d: { field: string; value1: unknown; value2: unknown }) => ({
              field: d.field,
              value1: d.value1,
              value2: d.value2,
            })),
          };
        } catch (error) {
          return formatError(error, 'compareEntityVersions');
        }
      },
    }),

    // === SECURITY EVENT OPERATIONS ===
    listSecurityEvents: tool({
      description: 'List security events.',
      parameters: z.object({
        eventType: z.enum([
          'login_success', 'login_failure', 'logout', 'password_change',
          'permission_change', 'unauthorized_access', 'suspicious_activity',
          'data_export', 'api_key_created', 'api_key_revoked',
        ]).optional().describe('Filter by event type'),
        severity: z.enum(['info', 'warning', 'critical']).optional().describe('Filter by severity'),
        userId: z.number().optional().describe('Filter by user'),
        unresolvedOnly: z.boolean().optional().describe('Only show unresolved events'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ eventType, severity, userId, unresolvedOnly, count }) => {
        try {
          const events = unresolvedOnly
            ? await ctx.securityEvents.getUnresolved({
                eventType,
                severity,
                userId,
                pageSize: count,
              })
            : await ctx.securityEvents.list({
                eventType,
                severity,
                userId,
                pageSize: count,
              });

          return {
            success: true,
            count: events.length,
            data: events.map((e: SecurityEvent) => ({
              id: e.id,
              type: e.eventType,
              severity: e.severity,
              user: e.userName,
              userEmail: e.userEmail,
              ipAddress: e.ipAddress,
              location: e.location,
              timestamp: e.timestamp,
              description: e.description,
              isResolved: e.isResolved,
            })),
          };
        } catch (error) {
          return formatError(error, 'listSecurityEvents');
        }
      },
    }),

    getCriticalSecurityEvents: tool({
      description: 'Get critical security events.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ count }) => {
        try {
          const events = await ctx.securityEvents.getCritical({ pageSize: count });

          return {
            success: true,
            count: events.length,
            data: events.map((e: SecurityEvent) => ({
              id: e.id,
              type: e.eventType,
              user: e.userName,
              ipAddress: e.ipAddress,
              timestamp: e.timestamp,
              description: e.description,
              isResolved: e.isResolved,
              resolution: e.resolution,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCriticalSecurityEvents');
        }
      },
    }),

    resolveSecurityEvent: tool({
      description: 'Mark a security event as resolved.',
      parameters: z.object({
        eventId: z.number().describe('The security event ID'),
        resolution: z.string().describe('Resolution description'),
      }),
      execute: async ({ eventId, resolution }) => {
        try {
          const event = await ctx.securityEvents.resolve(eventId, resolution);

          return {
            success: true,
            message: `Security event ${eventId} resolved`,
            isResolved: event.isResolved,
            resolvedAt: event.resolvedAt,
          };
        } catch (error) {
          return formatError(error, 'resolveSecurityEvent');
        }
      },
    }),

    getFailedLoginAttempts: tool({
      description: 'Get failed login attempts.',
      parameters: z.object({
        userId: z.number().optional().describe('Filter by user'),
        fromDate: z.string().optional().describe('From date (ISO format)'),
        toDate: z.string().optional().describe('To date (ISO format)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ userId, fromDate, toDate, count }) => {
        try {
          const events = await ctx.securityEvents.getFailedLogins({
            userId,
            fromDate,
            toDate,
            pageSize: count,
          });

          return {
            success: true,
            count: events.length,
            attempts: events.map((e: SecurityEvent) => ({
              id: e.id,
              user: e.userName,
              userEmail: e.userEmail,
              ipAddress: e.ipAddress,
              location: e.location,
              timestamp: e.timestamp,
              userAgent: e.userAgent,
            })),
          };
        } catch (error) {
          return formatError(error, 'getFailedLoginAttempts');
        }
      },
    }),

    // === AUDIT POLICY OPERATIONS ===
    listAuditPolicies: tool({
      description: 'List audit retention policies.',
      parameters: z.object({
        enabledOnly: z.boolean().optional().describe('Only show enabled policies'),
      }),
      execute: async ({ enabledOnly }) => {
        try {
          const policies = await ctx.auditPolicies.list({
            isEnabled: enabledOnly,
          });

          return {
            success: true,
            count: policies.length,
            policies: policies.map((p: AuditPolicy) => ({
              id: p.id,
              name: p.name,
              entityType: p.entityType,
              retentionDays: p.retentionDays,
              archiveEnabled: p.archiveEnabled,
              isEnabled: p.isEnabled,
              isDefault: p.isDefault,
            })),
          };
        } catch (error) {
          return formatError(error, 'listAuditPolicies');
        }
      },
    }),
  };
}
