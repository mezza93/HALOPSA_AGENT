/**
 * HaloPSA Notification types.
 * Phase 4: Productivity & Automation
 */

import { HaloBaseEntity } from './common';

// ==========================================
// Notification Types
// ==========================================

/**
 * Notification delivery channels.
 */
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'slack' | 'teams' | 'webhook';

/**
 * Notification priority levels.
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification categories.
 */
export type NotificationCategory =
  | 'ticket'
  | 'client'
  | 'asset'
  | 'contract'
  | 'invoice'
  | 'opportunity'
  | 'project'
  | 'approval'
  | 'sla'
  | 'system'
  | 'security'
  | 'reminder'
  | 'mention'
  | 'assignment'
  | 'escalation';

/**
 * Notification status.
 */
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';

/**
 * User notification.
 */
export interface Notification extends HaloBaseEntity {
  id: number;
  userId: number;
  userName?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: NotificationStatus;
  isRead: boolean;
  isArchived?: boolean;
  entityType?: string;
  entityId?: number;
  entityUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  iconType?: string;
  iconColor?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  expiresAt?: string;
  errorMessage?: string;
}

/**
 * Notification as returned by API.
 */
export interface NotificationAPI {
  id: number;
  user_id: number;
  user_name?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: NotificationStatus;
  is_read: boolean;
  is_archived?: boolean;
  entity_type?: string;
  entity_id?: number;
  entity_url?: string;
  action_url?: string;
  action_label?: string;
  icon_type?: string;
  icon_color?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  expires_at?: string;
  error_message?: string;
  [key: string]: unknown;
}

/**
 * Notification template for creating notifications.
 */
export interface NotificationTemplate extends HaloBaseEntity {
  id: number;
  name: string;
  description?: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  titleTemplate: string;
  messageTemplate: string;
  priority: NotificationPriority;
  iconType?: string;
  iconColor?: string;
  isEnabled: boolean;
  isDefault?: boolean;
  expiresAfter?: number;
  expiresUnit?: 'hours' | 'days' | 'weeks';
  createdBy?: number;
  createdAt?: string;
  updatedBy?: number;
  updatedAt?: string;
}

/**
 * Notification template as returned by API.
 */
export interface NotificationTemplateAPI {
  id: number;
  name: string;
  description?: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  title_template: string;
  message_template: string;
  priority: NotificationPriority;
  icon_type?: string;
  icon_color?: string;
  is_enabled: boolean;
  is_default?: boolean;
  expires_after?: number;
  expires_unit?: 'hours' | 'days' | 'weeks';
  created_by?: number;
  created_at?: string;
  updated_by?: number;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * User notification preferences.
 */
export interface NotificationPreference extends HaloBaseEntity {
  id: number;
  userId: number;
  category: NotificationCategory;
  channelPreferences: {
    channel: NotificationChannel;
    enabled: boolean;
    minPriority?: NotificationPriority;
    schedule?: NotificationSchedule;
  }[];
  mutedUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Notification preference as returned by API.
 */
export interface NotificationPreferenceAPI {
  id: number;
  user_id: number;
  category: NotificationCategory;
  channel_preferences: {
    channel: NotificationChannel;
    enabled: boolean;
    min_priority?: NotificationPriority;
    schedule?: NotificationScheduleAPI;
  }[];
  muted_until?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Notification delivery schedule.
 */
export interface NotificationSchedule {
  timezone: string;
  allowedDays: number[];
  startTime: string;
  endTime: string;
  batchDigest?: boolean;
  digestTime?: string;
  [key: string]: unknown;
}

/**
 * Notification schedule as returned by API.
 */
export interface NotificationScheduleAPI {
  timezone: string;
  allowed_days: number[];
  start_time: string;
  end_time: string;
  batch_digest?: boolean;
  digest_time?: string;
  [key: string]: unknown;
}

/**
 * Notification subscription for entity updates.
 */
export interface NotificationSubscription extends HaloBaseEntity {
  id: number;
  userId: number;
  entityType: string;
  entityId: number;
  entityName?: string;
  events: string[];
  channels: NotificationChannel[];
  isEnabled: boolean;
  createdAt?: string;
  expiresAt?: string;
}

/**
 * Notification subscription as returned by API.
 */
export interface NotificationSubscriptionAPI {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  entity_name?: string;
  events: string[];
  channels: NotificationChannel[];
  is_enabled: boolean;
  created_at?: string;
  expires_at?: string;
  [key: string]: unknown;
}

/**
 * Bulk notification request.
 */
export interface BulkNotificationRequest extends HaloBaseEntity {
  userIds?: number[];
  userFilter?: {
    teamIds?: number[];
    roleIds?: number[];
    clientIds?: number[];
  };
  templateId?: number;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  entityType?: string;
  entityId?: number;
  actionUrl?: string;
  actionLabel?: string;
  scheduledFor?: string;
  expiresAt?: string;
}

/**
 * Bulk notification request as returned by API.
 */
export interface BulkNotificationRequestAPI {
  user_ids?: number[];
  user_filter?: {
    team_ids?: number[];
    role_ids?: number[];
    client_ids?: number[];
  };
  template_id?: number;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  entity_type?: string;
  entity_id?: number;
  action_url?: string;
  action_label?: string;
  scheduled_for?: string;
  expires_at?: string;
  [key: string]: unknown;
}

/**
 * Notification statistics.
 */
export interface NotificationStats {
  period: string;
  fromDate: string;
  toDate: string;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  byChannel: Record<NotificationChannel, { sent: number; delivered: number; read: number; failed: number }>;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  averageDeliveryTime?: number;
  averageReadTime?: number;
  readRate?: number;
  [key: string]: unknown;
}

/**
 * Notification statistics as returned by API.
 */
export interface NotificationStatsAPI {
  period: string;
  from_date: string;
  to_date: string;
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  by_channel: Record<NotificationChannel, { sent: number; delivered: number; read: number; failed: number }>;
  by_category: Record<NotificationCategory, number>;
  by_priority: Record<NotificationPriority, number>;
  average_delivery_time?: number;
  average_read_time?: number;
  read_rate?: number;
  [key: string]: unknown;
}

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform API notification to internal format.
 */
export function transformNotification(api: NotificationAPI): Notification {
  return {
    id: api.id,
    userId: api.user_id,
    userName: api.user_name,
    title: api.title,
    message: api.message,
    category: api.category,
    priority: api.priority,
    channel: api.channel,
    status: api.status,
    isRead: api.is_read,
    isArchived: api.is_archived,
    entityType: api.entity_type,
    entityId: api.entity_id,
    entityUrl: api.entity_url,
    actionUrl: api.action_url,
    actionLabel: api.action_label,
    iconType: api.icon_type,
    iconColor: api.icon_color,
    imageUrl: api.image_url,
    metadata: api.metadata,
    createdAt: api.created_at,
    sentAt: api.sent_at,
    deliveredAt: api.delivered_at,
    readAt: api.read_at,
    expiresAt: api.expires_at,
    errorMessage: api.error_message,
  };
}

/**
 * Transform API notification template to internal format.
 */
export function transformNotificationTemplate(api: NotificationTemplateAPI): NotificationTemplate {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    category: api.category,
    channels: api.channels || [],
    titleTemplate: api.title_template,
    messageTemplate: api.message_template,
    priority: api.priority,
    iconType: api.icon_type,
    iconColor: api.icon_color,
    isEnabled: api.is_enabled,
    isDefault: api.is_default,
    expiresAfter: api.expires_after,
    expiresUnit: api.expires_unit,
    createdBy: api.created_by,
    createdAt: api.created_at,
    updatedBy: api.updated_by,
    updatedAt: api.updated_at,
  };
}

/**
 * Transform API notification schedule to internal format.
 */
export function transformNotificationSchedule(api: NotificationScheduleAPI): NotificationSchedule {
  return {
    timezone: api.timezone,
    allowedDays: api.allowed_days || [],
    startTime: api.start_time,
    endTime: api.end_time,
    batchDigest: api.batch_digest,
    digestTime: api.digest_time,
  };
}

/**
 * Transform API notification preference to internal format.
 */
export function transformNotificationPreference(api: NotificationPreferenceAPI): NotificationPreference {
  return {
    id: api.id,
    userId: api.user_id,
    category: api.category,
    channelPreferences: api.channel_preferences?.map((cp) => ({
      channel: cp.channel,
      enabled: cp.enabled,
      minPriority: cp.min_priority,
      schedule: cp.schedule ? transformNotificationSchedule(cp.schedule) : undefined,
    })) || [],
    mutedUntil: api.muted_until,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Transform API notification subscription to internal format.
 */
export function transformNotificationSubscription(api: NotificationSubscriptionAPI): NotificationSubscription {
  return {
    id: api.id,
    userId: api.user_id,
    entityType: api.entity_type,
    entityId: api.entity_id,
    entityName: api.entity_name,
    events: api.events || [],
    channels: api.channels || [],
    isEnabled: api.is_enabled,
    createdAt: api.created_at,
    expiresAt: api.expires_at,
  };
}

/**
 * Transform API notification stats to internal format.
 */
export function transformNotificationStats(api: NotificationStatsAPI): NotificationStats {
  return {
    period: api.period,
    fromDate: api.from_date,
    toDate: api.to_date,
    totalSent: api.total_sent,
    totalDelivered: api.total_delivered,
    totalRead: api.total_read,
    totalFailed: api.total_failed,
    byChannel: api.by_channel,
    byCategory: api.by_category,
    byPriority: api.by_priority,
    averageDeliveryTime: api.average_delivery_time,
    averageReadTime: api.average_read_time,
    readRate: api.read_rate,
  };
}

// ==========================================
// List Parameters
// ==========================================

/**
 * Parameters for listing notifications.
 */
export interface NotificationListParams {
  pageSize?: number;
  pageNo?: number;
  userId?: number;
  category?: NotificationCategory;
  categories?: NotificationCategory[];
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  isRead?: boolean;
  isArchived?: boolean;
  entityType?: string;
  entityId?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing notification templates.
 */
export interface NotificationTemplateListParams {
  pageSize?: number;
  pageNo?: number;
  search?: string;
  category?: NotificationCategory;
  channel?: NotificationChannel;
  isEnabled?: boolean;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for notification statistics.
 */
export interface NotificationStatsParams {
  fromDate: string;
  toDate: string;
  userId?: number;
  category?: NotificationCategory;
  channel?: NotificationChannel;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Parameters for listing notification preferences.
 */
export interface NotificationPreferenceListParams {
  userId?: number;
  category?: NotificationCategory;
}

/**
 * Parameters for listing notification subscriptions.
 */
export interface NotificationSubscriptionListParams {
  pageSize?: number;
  pageNo?: number;
  userId?: number;
  entityType?: string;
  entityId?: number;
  isEnabled?: boolean;
  orderBy?: string;
  orderDesc?: boolean;
}
