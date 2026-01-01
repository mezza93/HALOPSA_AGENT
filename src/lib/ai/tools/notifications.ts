/**
 * Notification AI tools for HaloPSA.
 * Phase 4: Productivity & Automation
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Notification, NotificationTemplate, NotificationPreference, NotificationSubscription } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

const notificationChannelSchema = z.enum(['in_app', 'email', 'sms', 'push', 'slack', 'teams', 'webhook']);
const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
const notificationCategorySchema = z.enum([
  'ticket', 'client', 'asset', 'contract', 'invoice', 'opportunity',
  'project', 'approval', 'sla', 'system', 'security', 'reminder',
  'mention', 'assignment', 'escalation',
]);

export function createNotificationTools(ctx: HaloContext) {
  return {
    // === NOTIFICATION OPERATIONS ===
    listNotifications: tool({
      description: 'List notifications with optional filters.',
      parameters: z.object({
        category: notificationCategorySchema.optional().describe('Filter by category'),
        priority: notificationPrioritySchema.optional().describe('Filter by priority'),
        channel: notificationChannelSchema.optional().describe('Filter by channel'),
        isRead: z.boolean().optional().describe('Filter by read status'),
        isArchived: z.boolean().optional().describe('Filter by archived status'),
        fromDate: z.string().optional().describe('From date (ISO format)'),
        toDate: z.string().optional().describe('To date (ISO format)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ category, priority, channel, isRead, isArchived, fromDate, toDate, count }) => {
        try {
          const notifications = await ctx.notifications.list({
            category,
            priority,
            channel,
            isRead,
            isArchived,
            fromDate,
            toDate,
            pageSize: count,
          });

          return {
            success: true,
            count: notifications.length,
            data: notifications.map((n: Notification) => ({
              id: n.id,
              title: n.title,
              message: n.message.substring(0, 200),
              category: n.category,
              priority: n.priority,
              channel: n.channel,
              status: n.status,
              isRead: n.isRead,
              createdAt: n.createdAt,
              entityType: n.entityType,
              entityId: n.entityId,
            })),
          };
        } catch (error) {
          return formatError(error, 'listNotifications');
        }
      },
    }),

    getNotification: tool({
      description: 'Get details of a specific notification.',
      parameters: z.object({
        notificationId: z.number().describe('The notification ID'),
      }),
      execute: async ({ notificationId }) => {
        try {
          const notification = await ctx.notifications.get(notificationId);
          return {
            success: true,
            id: notification.id,
            title: notification.title,
            message: notification.message,
            category: notification.category,
            priority: notification.priority,
            channel: notification.channel,
            status: notification.status,
            isRead: notification.isRead,
            isArchived: notification.isArchived,
            entityType: notification.entityType,
            entityId: notification.entityId,
            entityUrl: notification.entityUrl,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel,
            createdAt: notification.createdAt,
            sentAt: notification.sentAt,
            deliveredAt: notification.deliveredAt,
            readAt: notification.readAt,
          };
        } catch (error) {
          return formatError(error, 'getNotification');
        }
      },
    }),

    getUnreadNotifications: tool({
      description: 'Get unread notifications.',
      parameters: z.object({
        category: notificationCategorySchema.optional().describe('Filter by category'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ category, count }) => {
        try {
          const notifications = await ctx.notifications.getUnread({
            category,
            pageSize: count,
          });

          return {
            success: true,
            count: notifications.length,
            data: notifications.map((n: Notification) => ({
              id: n.id,
              title: n.title,
              message: n.message.substring(0, 200),
              category: n.category,
              priority: n.priority,
              createdAt: n.createdAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'getUnreadNotifications');
        }
      },
    }),

    getUnreadCount: tool({
      description: 'Get count of unread notifications.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const count = await ctx.notifications.getUnreadCount();
          return {
            success: true,
            unreadCount: count,
          };
        } catch (error) {
          return formatError(error, 'getUnreadCount');
        }
      },
    }),

    sendNotification: tool({
      description: 'Send a notification to a user.',
      parameters: z.object({
        userId: z.number().describe('User ID to send to'),
        title: z.string().describe('Notification title'),
        message: z.string().describe('Notification message'),
        category: notificationCategorySchema.describe('Notification category'),
        priority: notificationPrioritySchema.optional().default('normal').describe('Priority'),
        channel: notificationChannelSchema.optional().default('in_app').describe('Delivery channel'),
        entityType: z.string().optional().describe('Related entity type'),
        entityId: z.number().optional().describe('Related entity ID'),
        actionUrl: z.string().optional().describe('Action URL'),
        actionLabel: z.string().optional().describe('Action button label'),
      }),
      execute: async ({ userId, title, message, category, priority, channel, entityType, entityId, actionUrl, actionLabel }) => {
        try {
          const notification = await ctx.notifications.send({
            userId,
            title,
            message,
            category,
            priority,
            channel,
            entityType,
            entityId,
            actionUrl,
            actionLabel,
          });

          return {
            success: true,
            message: `Notification sent to user ${userId}`,
            notificationId: notification.id,
            status: notification.status,
          };
        } catch (error) {
          return formatError(error, 'sendNotification');
        }
      },
    }),

    sendBulkNotifications: tool({
      description: 'Send notifications to multiple users.',
      parameters: z.object({
        userIds: z.array(z.number()).optional().describe('Specific user IDs'),
        teamIds: z.array(z.number()).optional().describe('Team IDs to notify'),
        roleIds: z.array(z.number()).optional().describe('Role IDs to notify'),
        title: z.string().describe('Notification title'),
        message: z.string().describe('Notification message'),
        category: notificationCategorySchema.describe('Notification category'),
        priority: notificationPrioritySchema.optional().default('normal').describe('Priority'),
        channels: z.array(notificationChannelSchema).optional().default(['in_app']).describe('Delivery channels'),
      }),
      execute: async ({ userIds, teamIds, roleIds, title, message, category, priority, channels }) => {
        try {
          const result = await ctx.notifications.sendBulk({
            userIds,
            userFilter: teamIds || roleIds ? { teamIds, roleIds } : undefined,
            title,
            message,
            category,
            priority,
            channels,
          });

          return {
            success: true,
            message: `Sent ${result.sent} notifications (${result.failed} failed)`,
            sent: result.sent,
            failed: result.failed,
          };
        } catch (error) {
          return formatError(error, 'sendBulkNotifications');
        }
      },
    }),

    markNotificationAsRead: tool({
      description: 'Mark a notification as read.',
      parameters: z.object({
        notificationId: z.number().describe('The notification ID'),
      }),
      execute: async ({ notificationId }) => {
        try {
          const notification = await ctx.notifications.markAsRead(notificationId);
          return {
            success: true,
            message: `Notification ${notificationId} marked as read`,
            readAt: notification.readAt,
          };
        } catch (error) {
          return formatError(error, 'markNotificationAsRead');
        }
      },
    }),

    markAllNotificationsAsRead: tool({
      description: 'Mark all notifications as read.',
      parameters: z.object({}),
      execute: async () => {
        try {
          await ctx.notifications.markAllAsRead();
          return {
            success: true,
            message: 'All notifications marked as read',
          };
        } catch (error) {
          return formatError(error, 'markAllNotificationsAsRead');
        }
      },
    }),

    archiveNotification: tool({
      description: 'Archive a notification.',
      parameters: z.object({
        notificationId: z.number().describe('The notification ID'),
      }),
      execute: async ({ notificationId }) => {
        try {
          const notification = await ctx.notifications.archive(notificationId);
          return {
            success: true,
            message: `Notification ${notificationId} archived`,
            isArchived: notification.isArchived,
          };
        } catch (error) {
          return formatError(error, 'archiveNotification');
        }
      },
    }),

    deleteNotification: tool({
      description: 'Delete a notification.',
      parameters: z.object({
        notificationId: z.number().describe('The notification ID'),
      }),
      execute: async ({ notificationId }) => {
        try {
          await ctx.notifications.delete(notificationId);
          return {
            success: true,
            message: `Notification ${notificationId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteNotification');
        }
      },
    }),

    // === NOTIFICATION TEMPLATE OPERATIONS ===
    listNotificationTemplates: tool({
      description: 'List notification templates.',
      parameters: z.object({
        search: z.string().optional().describe('Search in name/description'),
        category: notificationCategorySchema.optional().describe('Filter by category'),
        isEnabled: z.boolean().optional().describe('Filter by enabled status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ search, category, isEnabled, count }) => {
        try {
          const templates = await ctx.notificationTemplates.list({
            search,
            category,
            isEnabled,
            pageSize: count,
          });

          return {
            success: true,
            count: templates.length,
            data: templates.map((t: NotificationTemplate) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              channels: t.channels,
              priority: t.priority,
              isEnabled: t.isEnabled,
              isDefault: t.isDefault,
            })),
          };
        } catch (error) {
          return formatError(error, 'listNotificationTemplates');
        }
      },
    }),

    getNotificationTemplate: tool({
      description: 'Get details of a notification template.',
      parameters: z.object({
        templateId: z.number().describe('The template ID'),
      }),
      execute: async ({ templateId }) => {
        try {
          const template = await ctx.notificationTemplates.get(templateId);
          return {
            success: true,
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            channels: template.channels,
            titleTemplate: template.titleTemplate,
            messageTemplate: template.messageTemplate,
            priority: template.priority,
            isEnabled: template.isEnabled,
            isDefault: template.isDefault,
            expiresAfter: template.expiresAfter,
            expiresUnit: template.expiresUnit,
          };
        } catch (error) {
          return formatError(error, 'getNotificationTemplate');
        }
      },
    }),

    createNotificationTemplate: tool({
      description: 'Create a new notification template.',
      parameters: z.object({
        name: z.string().describe('Template name'),
        description: z.string().optional().describe('Template description'),
        category: notificationCategorySchema.describe('Notification category'),
        channels: z.array(notificationChannelSchema).describe('Delivery channels'),
        titleTemplate: z.string().describe('Title template (supports variables)'),
        messageTemplate: z.string().describe('Message template (supports variables)'),
        priority: notificationPrioritySchema.optional().default('normal').describe('Default priority'),
      }),
      execute: async ({ name, description, category, channels, titleTemplate, messageTemplate, priority }) => {
        try {
          const template = await ctx.notificationTemplates.create({
            name,
            description,
            category,
            channels,
            titleTemplate,
            messageTemplate,
            priority,
            isEnabled: false, // Create disabled by default
          });

          return {
            success: true,
            message: `Template "${template.name}" created (disabled by default)`,
            templateId: template.id,
          };
        } catch (error) {
          return formatError(error, 'createNotificationTemplate');
        }
      },
    }),

    enableNotificationTemplate: tool({
      description: 'Enable a notification template.',
      parameters: z.object({
        templateId: z.number().describe('The template ID'),
      }),
      execute: async ({ templateId }) => {
        try {
          const template = await ctx.notificationTemplates.enable(templateId);
          return {
            success: true,
            message: `Template "${template.name}" enabled`,
          };
        } catch (error) {
          return formatError(error, 'enableNotificationTemplate');
        }
      },
    }),

    disableNotificationTemplate: tool({
      description: 'Disable a notification template.',
      parameters: z.object({
        templateId: z.number().describe('The template ID'),
      }),
      execute: async ({ templateId }) => {
        try {
          const template = await ctx.notificationTemplates.disable(templateId);
          return {
            success: true,
            message: `Template "${template.name}" disabled`,
          };
        } catch (error) {
          return formatError(error, 'disableNotificationTemplate');
        }
      },
    }),

    previewNotificationTemplate: tool({
      description: 'Preview a notification template with sample data.',
      parameters: z.object({
        templateId: z.number().describe('The template ID'),
        sampleData: z.record(z.unknown()).describe('Sample data for variables'),
      }),
      execute: async ({ templateId, sampleData }) => {
        try {
          const preview = await ctx.notificationTemplates.preview(templateId, sampleData);
          return {
            success: true,
            title: preview.title,
            message: preview.message,
          };
        } catch (error) {
          return formatError(error, 'previewNotificationTemplate');
        }
      },
    }),

    // === NOTIFICATION PREFERENCE OPERATIONS ===
    getNotificationPreferences: tool({
      description: 'Get notification preferences for a user.',
      parameters: z.object({
        userId: z.number().describe('The user ID'),
      }),
      execute: async ({ userId }) => {
        try {
          const preferences = await ctx.notificationPreferences.getForUser(userId);

          return {
            success: true,
            count: preferences.length,
            preferences: preferences.map((p: NotificationPreference) => ({
              id: p.id,
              category: p.category,
              channelCount: p.channelPreferences.length,
              channels: p.channelPreferences.map((cp) => ({
                channel: cp.channel,
                enabled: cp.enabled,
                minPriority: cp.minPriority,
              })),
              mutedUntil: p.mutedUntil,
            })),
          };
        } catch (error) {
          return formatError(error, 'getNotificationPreferences');
        }
      },
    }),

    enableNotificationChannel: tool({
      description: 'Enable a notification channel for a category.',
      parameters: z.object({
        userId: z.number().describe('The user ID'),
        category: notificationCategorySchema.describe('Notification category'),
        channel: notificationChannelSchema.describe('Channel to enable'),
      }),
      execute: async ({ userId, category, channel }) => {
        try {
          await ctx.notificationPreferences.enableChannel(userId, category, channel);
          return {
            success: true,
            message: `Channel "${channel}" enabled for "${category}" notifications`,
          };
        } catch (error) {
          return formatError(error, 'enableNotificationChannel');
        }
      },
    }),

    disableNotificationChannel: tool({
      description: 'Disable a notification channel for a category.',
      parameters: z.object({
        userId: z.number().describe('The user ID'),
        category: notificationCategorySchema.describe('Notification category'),
        channel: notificationChannelSchema.describe('Channel to disable'),
      }),
      execute: async ({ userId, category, channel }) => {
        try {
          await ctx.notificationPreferences.disableChannel(userId, category, channel);
          return {
            success: true,
            message: `Channel "${channel}" disabled for "${category}" notifications`,
          };
        } catch (error) {
          return formatError(error, 'disableNotificationChannel');
        }
      },
    }),

    muteNotifications: tool({
      description: 'Temporarily mute all notifications for a user.',
      parameters: z.object({
        userId: z.number().describe('The user ID'),
        until: z.string().describe('Mute until (ISO date)'),
      }),
      execute: async ({ userId, until }) => {
        try {
          await ctx.notificationPreferences.muteUntil(userId, until);
          return {
            success: true,
            message: `Notifications muted until ${until}`,
          };
        } catch (error) {
          return formatError(error, 'muteNotifications');
        }
      },
    }),

    unmuteNotifications: tool({
      description: 'Unmute notifications for a user.',
      parameters: z.object({
        userId: z.number().describe('The user ID'),
      }),
      execute: async ({ userId }) => {
        try {
          await ctx.notificationPreferences.unmute(userId);
          return {
            success: true,
            message: 'Notifications unmuted',
          };
        } catch (error) {
          return formatError(error, 'unmuteNotifications');
        }
      },
    }),

    // === NOTIFICATION SUBSCRIPTION OPERATIONS ===
    listNotificationSubscriptions: tool({
      description: 'List notification subscriptions.',
      parameters: z.object({
        entityType: z.string().optional().describe('Filter by entity type'),
        entityId: z.number().optional().describe('Filter by entity ID'),
        isEnabled: z.boolean().optional().describe('Filter by enabled status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ entityType, entityId, isEnabled, count }) => {
        try {
          const subscriptions = await ctx.notificationSubscriptions.list({
            entityType,
            entityId,
            isEnabled,
            pageSize: count,
          });

          return {
            success: true,
            count: subscriptions.length,
            data: subscriptions.map((s: NotificationSubscription) => ({
              id: s.id,
              entityType: s.entityType,
              entityId: s.entityId,
              entityName: s.entityName,
              events: s.events,
              channels: s.channels,
              isEnabled: s.isEnabled,
            })),
          };
        } catch (error) {
          return formatError(error, 'listNotificationSubscriptions');
        }
      },
    }),

    subscribeToEntity: tool({
      description: 'Subscribe to notifications for an entity.',
      parameters: z.object({
        entityType: z.string().describe('Entity type (ticket, client, etc.)'),
        entityId: z.number().describe('Entity ID'),
        events: z.array(z.string()).describe('Events to subscribe to'),
        channels: z.array(notificationChannelSchema).optional().default(['in_app', 'email']).describe('Delivery channels'),
      }),
      execute: async ({ entityType, entityId, events, channels }) => {
        try {
          const subscription = await ctx.notificationSubscriptions.subscribe({
            entityType,
            entityId,
            events,
            channels,
            isEnabled: true,
          });

          return {
            success: true,
            message: `Subscribed to ${entityType} ${entityId}`,
            subscriptionId: subscription.id,
          };
        } catch (error) {
          return formatError(error, 'subscribeToEntity');
        }
      },
    }),

    subscribeToTicket: tool({
      description: 'Subscribe to notifications for a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('Ticket ID'),
        events: z.array(z.string()).optional().default(['updated', 'note_added', 'status_changed']).describe('Events to subscribe to'),
      }),
      execute: async ({ ticketId, events }) => {
        try {
          const subscription = await ctx.notificationSubscriptions.subscribeToTicket(ticketId, events);

          return {
            success: true,
            message: `Subscribed to ticket ${ticketId}`,
            subscriptionId: subscription.id,
            events: subscription.events,
          };
        } catch (error) {
          return formatError(error, 'subscribeToTicket');
        }
      },
    }),

    subscribeToClient: tool({
      description: 'Subscribe to notifications for a client.',
      parameters: z.object({
        clientId: z.number().describe('Client ID'),
        events: z.array(z.string()).optional().default(['ticket_created', 'contract_expiring']).describe('Events to subscribe to'),
      }),
      execute: async ({ clientId, events }) => {
        try {
          const subscription = await ctx.notificationSubscriptions.subscribeToClient(clientId, events);

          return {
            success: true,
            message: `Subscribed to client ${clientId}`,
            subscriptionId: subscription.id,
            events: subscription.events,
          };
        } catch (error) {
          return formatError(error, 'subscribeToClient');
        }
      },
    }),

    unsubscribeFromEntity: tool({
      description: 'Unsubscribe from entity notifications.',
      parameters: z.object({
        subscriptionId: z.number().describe('The subscription ID'),
      }),
      execute: async ({ subscriptionId }) => {
        try {
          await ctx.notificationSubscriptions.unsubscribe(subscriptionId);
          return {
            success: true,
            message: `Subscription ${subscriptionId} removed`,
          };
        } catch (error) {
          return formatError(error, 'unsubscribeFromEntity');
        }
      },
    }),

    // === NOTIFICATION STATISTICS ===
    getNotificationStats: tool({
      description: 'Get notification statistics for a time period.',
      parameters: z.object({
        fromDate: z.string().describe('From date (ISO format)'),
        toDate: z.string().describe('To date (ISO format)'),
        category: notificationCategorySchema.optional().describe('Filter by category'),
        channel: notificationChannelSchema.optional().describe('Filter by channel'),
        groupBy: z.enum(['hour', 'day', 'week', 'month']).optional().describe('Group by time period'),
      }),
      execute: async ({ fromDate, toDate, category, channel, groupBy }) => {
        try {
          const stats = await ctx.notificationStats.getStats({
            fromDate,
            toDate,
            category,
            channel,
            groupBy,
          });

          return {
            success: true,
            period: stats.period,
            fromDate: stats.fromDate,
            toDate: stats.toDate,
            totalSent: stats.totalSent,
            totalDelivered: stats.totalDelivered,
            totalRead: stats.totalRead,
            totalFailed: stats.totalFailed,
            readRate: stats.readRate,
            averageDeliveryTime: stats.averageDeliveryTime,
            byChannel: stats.byChannel,
            byCategory: stats.byCategory,
          };
        } catch (error) {
          return formatError(error, 'getNotificationStats');
        }
      },
    }),
  };
}
