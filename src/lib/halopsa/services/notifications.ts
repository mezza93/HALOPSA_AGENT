/**
 * HaloPSA Notification Services.
 * Phase 4: Productivity & Automation
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  Notification,
  NotificationAPI,
  NotificationListParams,
  NotificationTemplate,
  NotificationTemplateAPI,
  NotificationTemplateListParams,
  NotificationPreference,
  NotificationPreferenceAPI,
  NotificationPreferenceListParams,
  NotificationSubscription,
  NotificationSubscriptionAPI,
  NotificationSubscriptionListParams,
  NotificationStats,
  NotificationStatsAPI,
  NotificationStatsParams,
  BulkNotificationRequest,
  NotificationCategory,
  NotificationChannel,
  transformNotification,
  transformNotificationTemplate,
  transformNotificationPreference,
  transformNotificationSubscription,
  transformNotificationStats,
} from '../types';

/**
 * Service for managing user notifications.
 */
export class NotificationService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List notifications with optional filters.
   */
  async list(params?: NotificationListParams): Promise<Notification[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.userId) queryParams.user_id = params.userId;
    if (params?.category) queryParams.category = params.category;
    if (params?.categories) queryParams.categories = params.categories.join(',');
    if (params?.channel) queryParams.channel = params.channel;
    if (params?.priority) queryParams.priority = params.priority;
    if (params?.status) queryParams.status = params.status;
    if (params?.isRead !== undefined) queryParams.is_read = params.isRead;
    if (params?.isArchived !== undefined) queryParams.is_archived = params.isArchived;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.search) queryParams.search = params.search;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ notifications: NotificationAPI[] }>('/Notification', queryParams);
    return (response.notifications || []).map(transformNotification);
  }

  /**
   * Get a specific notification by ID.
   */
  async get(id: number): Promise<Notification> {
    const response = await this.client.get<NotificationAPI>(`/Notification/${id}`);
    return transformNotification(response);
  }

  /**
   * Send a notification to a user.
   */
  async send(notification: Partial<Notification>): Promise<Notification> {
    const payload = this.toAPIFormat(notification);
    const response = await this.client.post<NotificationAPI>('/Notification', [payload]);
    return transformNotification(response);
  }

  /**
   * Send bulk notifications.
   */
  async sendBulk(request: BulkNotificationRequest): Promise<{ sent: number; failed: number; notifications: Notification[] }> {
    const payload: Record<string, unknown> = {
      title: request.title,
      message: request.message,
      category: request.category,
      priority: request.priority,
      channels: request.channels,
    };

    if (request.userIds) payload.user_ids = request.userIds;
    if (request.userFilter) {
      payload.user_filter = {
        team_ids: request.userFilter.teamIds,
        role_ids: request.userFilter.roleIds,
        client_ids: request.userFilter.clientIds,
      };
    }
    if (request.templateId) payload.template_id = request.templateId;
    if (request.entityType) payload.entity_type = request.entityType;
    if (request.entityId) payload.entity_id = request.entityId;
    if (request.actionUrl) payload.action_url = request.actionUrl;
    if (request.actionLabel) payload.action_label = request.actionLabel;
    if (request.scheduledFor) payload.scheduled_for = request.scheduledFor;
    if (request.expiresAt) payload.expires_at = request.expiresAt;

    const response = await this.client.post<{ sent: number; failed: number; notifications: NotificationAPI[] }>(
      '/Notification/Bulk',
      payload
    );

    return {
      sent: response.sent,
      failed: response.failed,
      notifications: (response.notifications || []).map(transformNotification),
    };
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await this.client.post<NotificationAPI>(`/Notification/${id}/Read`, {});
    return transformNotification(response);
  }

  /**
   * Mark multiple notifications as read.
   */
  async markManyAsRead(ids: number[]): Promise<void> {
    await this.client.post('/Notification/MarkRead', { notification_ids: ids });
  }

  /**
   * Mark all notifications as read for the current user.
   */
  async markAllAsRead(): Promise<void> {
    await this.client.post('/Notification/MarkAllRead', {});
  }

  /**
   * Archive a notification.
   */
  async archive(id: number): Promise<Notification> {
    const response = await this.client.post<NotificationAPI>(`/Notification/${id}/Archive`, {});
    return transformNotification(response);
  }

  /**
   * Archive multiple notifications.
   */
  async archiveMany(ids: number[]): Promise<void> {
    await this.client.post('/Notification/Archive', { notification_ids: ids });
  }

  /**
   * Delete a notification.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Notification/${id}`);
  }

  /**
   * Get unread notifications for the current user.
   */
  async getUnread(params?: Omit<NotificationListParams, 'isRead'>): Promise<Notification[]> {
    return this.list({ ...params, isRead: false });
  }

  /**
   * Get unread count for the current user.
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.client.get<{ count: number }>('/Notification/UnreadCount');
    return response.count;
  }

  /**
   * Get notifications by category.
   */
  async getByCategory(
    category: NotificationCategory,
    params?: Omit<NotificationListParams, 'category'>
  ): Promise<Notification[]> {
    return this.list({ ...params, category });
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(notification: Partial<Notification>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (notification.userId !== undefined) api.user_id = notification.userId;
    if (notification.title !== undefined) api.title = notification.title;
    if (notification.message !== undefined) api.message = notification.message;
    if (notification.category !== undefined) api.category = notification.category;
    if (notification.priority !== undefined) api.priority = notification.priority;
    if (notification.channel !== undefined) api.channel = notification.channel;
    if (notification.entityType !== undefined) api.entity_type = notification.entityType;
    if (notification.entityId !== undefined) api.entity_id = notification.entityId;
    if (notification.entityUrl !== undefined) api.entity_url = notification.entityUrl;
    if (notification.actionUrl !== undefined) api.action_url = notification.actionUrl;
    if (notification.actionLabel !== undefined) api.action_label = notification.actionLabel;
    if (notification.iconType !== undefined) api.icon_type = notification.iconType;
    if (notification.iconColor !== undefined) api.icon_color = notification.iconColor;
    if (notification.imageUrl !== undefined) api.image_url = notification.imageUrl;
    if (notification.metadata !== undefined) api.metadata = notification.metadata;
    if (notification.expiresAt !== undefined) api.expires_at = notification.expiresAt;

    return api;
  }
}

/**
 * Service for managing notification templates.
 */
export class NotificationTemplateService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List notification templates.
   */
  async list(params?: NotificationTemplateListParams): Promise<NotificationTemplate[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.search) queryParams.search = params.search;
    if (params?.category) queryParams.category = params.category;
    if (params?.channel) queryParams.channel = params.channel;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ templates: NotificationTemplateAPI[] }>(
      '/Notification/Templates',
      queryParams
    );
    return (response.templates || []).map(transformNotificationTemplate);
  }

  /**
   * Get a specific notification template by ID.
   */
  async get(id: number): Promise<NotificationTemplate> {
    const response = await this.client.get<NotificationTemplateAPI>(`/Notification/Templates/${id}`);
    return transformNotificationTemplate(response);
  }

  /**
   * Create a new notification template.
   */
  async create(template: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const payload = this.toAPIFormat(template);
    const response = await this.client.post<NotificationTemplateAPI>('/Notification/Templates', [payload]);
    return transformNotificationTemplate(response);
  }

  /**
   * Update an existing notification template.
   */
  async update(id: number, template: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const payload = { ...this.toAPIFormat(template), id };
    const response = await this.client.post<NotificationTemplateAPI>('/Notification/Templates', [payload]);
    return transformNotificationTemplate(response);
  }

  /**
   * Delete a notification template.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Notification/Templates/${id}`);
  }

  /**
   * Enable a notification template.
   */
  async enable(id: number): Promise<NotificationTemplate> {
    return this.update(id, { isEnabled: true });
  }

  /**
   * Disable a notification template.
   */
  async disable(id: number): Promise<NotificationTemplate> {
    return this.update(id, { isEnabled: false });
  }

  /**
   * Preview a template with sample data.
   */
  async preview(
    id: number,
    sampleData: Record<string, unknown>
  ): Promise<{ title: string; message: string }> {
    const response = await this.client.post<{ title: string; message: string }>(
      `/Notification/Templates/${id}/Preview`,
      { sample_data: sampleData }
    );
    return response;
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(template: Partial<NotificationTemplate>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (template.name !== undefined) api.name = template.name;
    if (template.description !== undefined) api.description = template.description;
    if (template.category !== undefined) api.category = template.category;
    if (template.channels !== undefined) api.channels = template.channels;
    if (template.titleTemplate !== undefined) api.title_template = template.titleTemplate;
    if (template.messageTemplate !== undefined) api.message_template = template.messageTemplate;
    if (template.priority !== undefined) api.priority = template.priority;
    if (template.iconType !== undefined) api.icon_type = template.iconType;
    if (template.iconColor !== undefined) api.icon_color = template.iconColor;
    if (template.isEnabled !== undefined) api.is_enabled = template.isEnabled;
    if (template.isDefault !== undefined) api.is_default = template.isDefault;
    if (template.expiresAfter !== undefined) api.expires_after = template.expiresAfter;
    if (template.expiresUnit !== undefined) api.expires_unit = template.expiresUnit;

    return api;
  }
}

/**
 * Service for managing user notification preferences.
 */
export class NotificationPreferenceService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Get notification preferences for a user.
   */
  async getForUser(userId: number): Promise<NotificationPreference[]> {
    const response = await this.client.get<{ preferences: NotificationPreferenceAPI[] }>(
      '/Notification/Preferences',
      { user_id: userId }
    );
    return (response.preferences || []).map(transformNotificationPreference);
  }

  /**
   * Get preference for a specific category.
   */
  async getForCategory(
    userId: number,
    category: NotificationCategory
  ): Promise<NotificationPreference | null> {
    const preferences = await this.getForUser(userId);
    return preferences.find((p) => p.category === category) || null;
  }

  /**
   * Update notification preferences.
   */
  async update(preference: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const payload = this.toAPIFormat(preference);
    const response = await this.client.post<NotificationPreferenceAPI>(
      '/Notification/Preferences',
      [payload]
    );
    return transformNotificationPreference(response);
  }

  /**
   * Enable a channel for a category.
   */
  async enableChannel(
    userId: number,
    category: NotificationCategory,
    channel: NotificationChannel
  ): Promise<NotificationPreference> {
    const existing = await this.getForCategory(userId, category);
    const channelPrefs = existing?.channelPreferences || [];
    const channelIndex = channelPrefs.findIndex((cp) => cp.channel === channel);

    if (channelIndex >= 0) {
      channelPrefs[channelIndex].enabled = true;
    } else {
      channelPrefs.push({ channel, enabled: true });
    }

    return this.update({
      id: existing?.id,
      userId,
      category,
      channelPreferences: channelPrefs,
    });
  }

  /**
   * Disable a channel for a category.
   */
  async disableChannel(
    userId: number,
    category: NotificationCategory,
    channel: NotificationChannel
  ): Promise<NotificationPreference> {
    const existing = await this.getForCategory(userId, category);
    const channelPrefs = existing?.channelPreferences || [];
    const channelIndex = channelPrefs.findIndex((cp) => cp.channel === channel);

    if (channelIndex >= 0) {
      channelPrefs[channelIndex].enabled = false;
    } else {
      channelPrefs.push({ channel, enabled: false });
    }

    return this.update({
      id: existing?.id,
      userId,
      category,
      channelPreferences: channelPrefs,
    });
  }

  /**
   * Mute notifications for a user temporarily.
   */
  async muteUntil(userId: number, until: string): Promise<void> {
    await this.client.post('/Notification/Preferences/Mute', {
      user_id: userId,
      muted_until: until,
    });
  }

  /**
   * Unmute notifications for a user.
   */
  async unmute(userId: number): Promise<void> {
    await this.client.post('/Notification/Preferences/Unmute', {
      user_id: userId,
    });
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(preference: Partial<NotificationPreference>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (preference.id !== undefined) api.id = preference.id;
    if (preference.userId !== undefined) api.user_id = preference.userId;
    if (preference.category !== undefined) api.category = preference.category;
    if (preference.mutedUntil !== undefined) api.muted_until = preference.mutedUntil;

    if (preference.channelPreferences) {
      api.channel_preferences = preference.channelPreferences.map((cp) => ({
        channel: cp.channel,
        enabled: cp.enabled,
        min_priority: cp.minPriority,
        schedule: cp.schedule ? {
          timezone: cp.schedule.timezone,
          allowed_days: cp.schedule.allowedDays,
          start_time: cp.schedule.startTime,
          end_time: cp.schedule.endTime,
          batch_digest: cp.schedule.batchDigest,
          digest_time: cp.schedule.digestTime,
        } : undefined,
      }));
    }

    return api;
  }
}

/**
 * Service for managing notification subscriptions.
 */
export class NotificationSubscriptionService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List notification subscriptions.
   */
  async list(params?: NotificationSubscriptionListParams): Promise<NotificationSubscription[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.userId) queryParams.user_id = params.userId;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ subscriptions: NotificationSubscriptionAPI[] }>(
      '/Notification/Subscriptions',
      queryParams
    );
    return (response.subscriptions || []).map(transformNotificationSubscription);
  }

  /**
   * Get a specific subscription by ID.
   */
  async get(id: number): Promise<NotificationSubscription> {
    const response = await this.client.get<NotificationSubscriptionAPI>(
      `/Notification/Subscriptions/${id}`
    );
    return transformNotificationSubscription(response);
  }

  /**
   * Subscribe to an entity.
   */
  async subscribe(subscription: Partial<NotificationSubscription>): Promise<NotificationSubscription> {
    const payload = this.toAPIFormat(subscription);
    const response = await this.client.post<NotificationSubscriptionAPI>(
      '/Notification/Subscriptions',
      [payload]
    );
    return transformNotificationSubscription(response);
  }

  /**
   * Update a subscription.
   */
  async update(id: number, subscription: Partial<NotificationSubscription>): Promise<NotificationSubscription> {
    const payload = { ...this.toAPIFormat(subscription), id };
    const response = await this.client.post<NotificationSubscriptionAPI>(
      '/Notification/Subscriptions',
      [payload]
    );
    return transformNotificationSubscription(response);
  }

  /**
   * Unsubscribe (delete subscription).
   */
  async unsubscribe(id: number): Promise<void> {
    await this.client.delete(`/Notification/Subscriptions/${id}`);
  }

  /**
   * Get subscriptions for the current user.
   */
  async getMySubscriptions(params?: Omit<NotificationSubscriptionListParams, 'userId'>): Promise<NotificationSubscription[]> {
    return this.list(params);
  }

  /**
   * Subscribe to a ticket.
   */
  async subscribeToTicket(
    ticketId: number,
    events: string[] = ['updated', 'note_added', 'status_changed'],
    channels: NotificationChannel[] = ['in_app', 'email']
  ): Promise<NotificationSubscription> {
    return this.subscribe({
      entityType: 'ticket',
      entityId: ticketId,
      events,
      channels,
      isEnabled: true,
    });
  }

  /**
   * Subscribe to a client.
   */
  async subscribeToClient(
    clientId: number,
    events: string[] = ['ticket_created', 'contract_expiring'],
    channels: NotificationChannel[] = ['in_app', 'email']
  ): Promise<NotificationSubscription> {
    return this.subscribe({
      entityType: 'client',
      entityId: clientId,
      events,
      channels,
      isEnabled: true,
    });
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(subscription: Partial<NotificationSubscription>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (subscription.userId !== undefined) api.user_id = subscription.userId;
    if (subscription.entityType !== undefined) api.entity_type = subscription.entityType;
    if (subscription.entityId !== undefined) api.entity_id = subscription.entityId;
    if (subscription.entityName !== undefined) api.entity_name = subscription.entityName;
    if (subscription.events !== undefined) api.events = subscription.events;
    if (subscription.channels !== undefined) api.channels = subscription.channels;
    if (subscription.isEnabled !== undefined) api.is_enabled = subscription.isEnabled;
    if (subscription.expiresAt !== undefined) api.expires_at = subscription.expiresAt;

    return api;
  }
}

/**
 * Service for notification statistics.
 */
export class NotificationStatsService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Get notification statistics.
   */
  async getStats(params: NotificationStatsParams): Promise<NotificationStats> {
    const queryParams: ListParams = {
      from_date: params.fromDate,
      to_date: params.toDate,
    };

    if (params.userId) queryParams.user_id = params.userId;
    if (params.category) queryParams.category = params.category;
    if (params.channel) queryParams.channel = params.channel;
    if (params.groupBy) queryParams.group_by = params.groupBy;

    const response = await this.client.get<NotificationStatsAPI>('/Notification/Stats', queryParams);
    return transformNotificationStats(response);
  }

  /**
   * Get delivery statistics for a time period.
   */
  async getDeliveryStats(fromDate: string, toDate: string): Promise<NotificationStats> {
    return this.getStats({ fromDate, toDate });
  }

  /**
   * Get channel performance.
   */
  async getChannelPerformance(
    channel: NotificationChannel,
    fromDate: string,
    toDate: string
  ): Promise<NotificationStats> {
    return this.getStats({ fromDate, toDate, channel });
  }
}
