/**
 * Webhook AI tools for HaloPSA.
 * Phase 4: Productivity & Automation
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Webhook, WebhookEvent, IncomingWebhook, IncomingWebhookEvent } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

const webhookMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const webhookContentTypeSchema = z.enum([
  'application/json',
  'application/xml',
  'application/x-www-form-urlencoded',
  'text/plain',
]);
const webhookEventTypeSchema = z.enum([
  'ticket.created', 'ticket.updated', 'ticket.deleted', 'ticket.closed',
  'ticket.assigned', 'ticket.escalated', 'ticket.note_added', 'ticket.attachment_added',
  'client.created', 'client.updated', 'client.deleted',
  'asset.created', 'asset.updated', 'asset.deleted',
  'invoice.created', 'invoice.sent', 'invoice.paid',
  'contract.created', 'contract.renewed', 'contract.expired',
  'opportunity.created', 'opportunity.won', 'opportunity.lost',
  'approval.requested', 'approval.approved', 'approval.rejected',
  'sla.warning', 'sla.breach', 'custom',
]);

export function createWebhookTools(ctx: HaloContext) {
  return {
    // === OUTGOING WEBHOOK OPERATIONS ===
    listWebhooks: tool({
      description: 'List outgoing webhooks.',
      parameters: z.object({
        search: z.string().optional().describe('Search by name'),
        isEnabled: z.boolean().optional().describe('Filter by enabled status'),
        eventType: webhookEventTypeSchema.optional().describe('Filter by event type'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ search, isEnabled, eventType, count }) => {
        try {
          const webhooks = await ctx.webhooks.list({
            search,
            isEnabled,
            eventType,
            pageSize: count,
          });

          return {
            success: true,
            count: webhooks.length,
            data: webhooks.map((w: Webhook) => ({
              id: w.id,
              name: w.name,
              url: w.url,
              method: w.method,
              isEnabled: w.isEnabled,
              events: w.events,
              lastTriggered: w.lastTriggeredAt,
              successCount: w.successCount,
              failureCount: w.failureCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listWebhooks');
        }
      },
    }),

    getWebhook: tool({
      description: 'Get details of a specific webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.webhooks.get(webhookId);
          return {
            success: true,
            id: webhook.id,
            name: webhook.name,
            description: webhook.description,
            url: webhook.url,
            method: webhook.method,
            contentType: webhook.contentType,
            isEnabled: webhook.isEnabled,
            events: webhook.events,
            headerCount: webhook.headers?.length || 0,
            hasAuth: !!webhook.auth,
            authType: webhook.auth?.type,
            retryCount: webhook.retryCount,
            timeout: webhook.timeout,
            validateSsl: webhook.validateSsl,
            lastTriggered: webhook.lastTriggeredAt,
            successCount: webhook.successCount,
            failureCount: webhook.failureCount,
          };
        } catch (error) {
          return formatError(error, 'getWebhook');
        }
      },
    }),

    createWebhook: tool({
      description: 'Create a new outgoing webhook.',
      parameters: z.object({
        name: z.string().describe('Webhook name'),
        description: z.string().optional().describe('Webhook description'),
        url: z.string().url().describe('Destination URL'),
        method: webhookMethodSchema.optional().default('POST').describe('HTTP method'),
        contentType: webhookContentTypeSchema.optional().default('application/json').describe('Content type'),
        events: z.array(webhookEventTypeSchema).describe('Events to trigger webhook'),
        retryCount: z.number().optional().default(3).describe('Number of retries'),
        timeout: z.number().optional().default(30000).describe('Timeout in ms'),
      }),
      execute: async ({ name, description, url, method, contentType, events, retryCount, timeout }) => {
        try {
          const webhook = await ctx.webhooks.create({
            name,
            description,
            url,
            method,
            contentType,
            events,
            retryCount,
            timeout,
            isEnabled: false, // Create disabled by default
          });

          return {
            success: true,
            message: `Webhook "${webhook.name}" created (disabled by default)`,
            webhookId: webhook.id,
          };
        } catch (error) {
          return formatError(error, 'createWebhook');
        }
      },
    }),

    enableWebhook: tool({
      description: 'Enable a webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.webhooks.enable(webhookId);
          return {
            success: true,
            message: `Webhook "${webhook.name}" enabled`,
          };
        } catch (error) {
          return formatError(error, 'enableWebhook');
        }
      },
    }),

    disableWebhook: tool({
      description: 'Disable a webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.webhooks.disable(webhookId);
          return {
            success: true,
            message: `Webhook "${webhook.name}" disabled`,
          };
        } catch (error) {
          return formatError(error, 'disableWebhook');
        }
      },
    }),

    testWebhook: tool({
      description: 'Test a webhook by sending a test payload.',
      parameters: z.object({
        webhookId: z.number().describe('The webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const result = await ctx.webhooks.test(webhookId);
          return {
            success: result.success,
            statusCode: result.statusCode,
            response: result.response?.substring(0, 500), // Truncate long responses
            error: result.error,
          };
        } catch (error) {
          return formatError(error, 'testWebhook');
        }
      },
    }),

    deleteWebhook: tool({
      description: 'Delete a webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          await ctx.webhooks.delete(webhookId);
          return {
            success: true,
            message: `Webhook ${webhookId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteWebhook');
        }
      },
    }),

    // === WEBHOOK EVENT/DELIVERY OPERATIONS ===
    listWebhookEvents: tool({
      description: 'List webhook delivery events.',
      parameters: z.object({
        webhookId: z.number().optional().describe('Filter by webhook ID'),
        status: z.enum(['pending', 'success', 'failed', 'retrying']).optional().describe('Filter by status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ webhookId, status, count }) => {
        try {
          const events = await ctx.webhookEvents.list({
            webhookId,
            status,
            pageSize: count,
          });

          return {
            success: true,
            count: events.length,
            data: events.map((e: WebhookEvent) => ({
              id: e.id,
              webhookId: e.webhookId,
              webhookName: e.webhookName,
              eventType: e.eventType,
              entityId: e.entityId,
              status: e.status,
              responseStatus: e.responseStatus,
              attempts: e.attempts,
              createdAt: e.createdAt,
              deliveredAt: e.deliveredAt,
              error: e.errorMessage,
            })),
          };
        } catch (error) {
          return formatError(error, 'listWebhookEvents');
        }
      },
    }),

    retryWebhookEvent: tool({
      description: 'Retry a failed webhook delivery.',
      parameters: z.object({
        eventId: z.number().describe('The webhook event ID'),
      }),
      execute: async ({ eventId }) => {
        try {
          const event = await ctx.webhookEvents.retry(eventId);
          return {
            success: true,
            message: `Webhook event ${eventId} retried`,
            status: event.status,
            attempts: event.attempts,
          };
        } catch (error) {
          return formatError(error, 'retryWebhookEvent');
        }
      },
    }),

    // === INCOMING WEBHOOK OPERATIONS ===
    listIncomingWebhooks: tool({
      description: 'List incoming webhooks.',
      parameters: z.object({
        search: z.string().optional().describe('Search by name'),
        isEnabled: z.boolean().optional().describe('Filter by enabled status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ search, isEnabled, count }) => {
        try {
          const webhooks = await ctx.incomingWebhooks.list({
            search,
            isEnabled,
            pageSize: count,
          });

          return {
            success: true,
            count: webhooks.length,
            data: webhooks.map((w: IncomingWebhook) => ({
              id: w.id,
              name: w.name,
              endpoint: w.endpoint,
              isEnabled: w.isEnabled,
              createTicket: w.createTicket,
              lastReceived: w.lastReceivedAt,
              receivedCount: w.receivedCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listIncomingWebhooks');
        }
      },
    }),

    getIncomingWebhook: tool({
      description: 'Get details of an incoming webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The incoming webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.incomingWebhooks.get(webhookId);
          return {
            success: true,
            id: webhook.id,
            name: webhook.name,
            description: webhook.description,
            endpoint: webhook.endpoint,
            isEnabled: webhook.isEnabled,
            validateSignature: webhook.validateSignature,
            allowedIps: webhook.allowedIps,
            rateLimit: webhook.rateLimit,
            createTicket: webhook.createTicket,
            ticketTypeId: webhook.ticketTypeId,
            defaultClientId: webhook.defaultClientId,
            fieldMappingCount: webhook.fieldMappings?.length || 0,
            lastReceived: webhook.lastReceivedAt,
            receivedCount: webhook.receivedCount,
          };
        } catch (error) {
          return formatError(error, 'getIncomingWebhook');
        }
      },
    }),

    createIncomingWebhook: tool({
      description: 'Create a new incoming webhook endpoint.',
      parameters: z.object({
        name: z.string().describe('Webhook name'),
        description: z.string().optional().describe('Webhook description'),
        createTicket: z.boolean().optional().default(true).describe('Create ticket from payload'),
        ticketTypeId: z.number().optional().describe('Default ticket type'),
        defaultClientId: z.number().optional().describe('Default client ID'),
        rateLimit: z.number().optional().describe('Rate limit per minute'),
      }),
      execute: async ({ name, description, createTicket, ticketTypeId, defaultClientId, rateLimit }) => {
        try {
          const webhook = await ctx.incomingWebhooks.create({
            name,
            description,
            createTicket,
            ticketTypeId,
            defaultClientId,
            rateLimit,
            isEnabled: false, // Create disabled by default
          });

          return {
            success: true,
            message: `Incoming webhook "${webhook.name}" created (disabled by default)`,
            webhookId: webhook.id,
            endpoint: webhook.endpoint,
            token: webhook.token,
          };
        } catch (error) {
          return formatError(error, 'createIncomingWebhook');
        }
      },
    }),

    enableIncomingWebhook: tool({
      description: 'Enable an incoming webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The incoming webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.incomingWebhooks.enable(webhookId);
          return {
            success: true,
            message: `Incoming webhook "${webhook.name}" enabled`,
          };
        } catch (error) {
          return formatError(error, 'enableIncomingWebhook');
        }
      },
    }),

    disableIncomingWebhook: tool({
      description: 'Disable an incoming webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The incoming webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.incomingWebhooks.disable(webhookId);
          return {
            success: true,
            message: `Incoming webhook "${webhook.name}" disabled`,
          };
        } catch (error) {
          return formatError(error, 'disableIncomingWebhook');
        }
      },
    }),

    regenerateIncomingWebhookToken: tool({
      description: 'Regenerate the token for an incoming webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The incoming webhook ID'),
      }),
      execute: async ({ webhookId }) => {
        try {
          const webhook = await ctx.incomingWebhooks.regenerateToken(webhookId);
          return {
            success: true,
            message: `Token regenerated for webhook "${webhook.name}"`,
            newToken: webhook.token,
          };
        } catch (error) {
          return formatError(error, 'regenerateIncomingWebhookToken');
        }
      },
    }),

    listIncomingWebhookEvents: tool({
      description: 'List received events for an incoming webhook.',
      parameters: z.object({
        webhookId: z.number().describe('The incoming webhook ID'),
        processed: z.boolean().optional().describe('Filter by processed status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ webhookId, processed, count }) => {
        try {
          const events = await ctx.incomingWebhooks.getEvents(webhookId, {
            processed,
            pageSize: count,
          });

          return {
            success: true,
            count: events.length,
            data: events.map((e: IncomingWebhookEvent) => ({
              id: e.id,
              receivedAt: e.receivedAt,
              sourceIp: e.sourceIp,
              processed: e.processed,
              processedAt: e.processedAt,
              ticketId: e.ticketId,
              error: e.errorMessage,
            })),
          };
        } catch (error) {
          return formatError(error, 'listIncomingWebhookEvents');
        }
      },
    }),

    // === UTILITY ===
    getWebhookEventTypes: tool({
      description: 'Get available webhook event types.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const types = await ctx.webhooks.getEventTypes();
          return {
            success: true,
            count: types.length,
            types: types.map((t: { type: string; label: string; description: string }) => ({
              type: t.type,
              label: t.label,
              description: t.description,
            })),
          };
        } catch (error) {
          return formatError(error, 'getWebhookEventTypes');
        }
      },
    }),
  };
}
