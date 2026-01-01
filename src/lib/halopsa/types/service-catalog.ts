/**
 * Service Catalog types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * Service status type.
 */
export type ServiceStatusType = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance' | 'unknown';

/**
 * Service criticality level.
 */
export type ServiceCriticality = 'low' | 'medium' | 'high' | 'critical';

/**
 * Service entity.
 */
export interface Service extends HaloBaseEntity {
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  status: ServiceStatusType;
  criticality: ServiceCriticality;
  ownerId?: number;
  ownerName?: string;
  teamId?: number;
  teamName?: string;
  clientId?: number;
  clientName?: string;
  slaId?: number;
  slaName?: string;
  isActive: boolean;
  isPublic: boolean;
  url?: string;
  documentationUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  dependencies?: ServiceDependency[];
  components?: ServiceComponent[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw service from API.
 */
export interface ServiceApiResponse {
  id: number;
  name?: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  status?: string;
  criticality?: string;
  owner_id?: number;
  owner_name?: string;
  team_id?: number;
  team_name?: string;
  client_id?: number;
  client_name?: string;
  sla_id?: number;
  sla_name?: string;
  is_active?: boolean;
  is_public?: boolean;
  url?: string;
  documentation_url?: string;
  support_email?: string;
  support_phone?: string;
  dependencies?: ServiceDependencyApiResponse[];
  components?: ServiceComponentApiResponse[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Service dependency.
 */
export interface ServiceDependency extends HaloBaseEntity {
  serviceId: number;
  dependsOnServiceId: number;
  dependsOnServiceName?: string;
  dependencyType: 'hard' | 'soft';
  description?: string;
}

/**
 * Raw service dependency from API.
 */
export interface ServiceDependencyApiResponse {
  id: number;
  service_id?: number;
  depends_on_service_id?: number;
  depends_on_service_name?: string;
  dependency_type?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Service component.
 */
export interface ServiceComponent extends HaloBaseEntity {
  serviceId: number;
  name: string;
  description?: string;
  status: ServiceStatusType;
  isCore: boolean;
  order?: number;
}

/**
 * Raw service component from API.
 */
export interface ServiceComponentApiResponse {
  id: number;
  service_id?: number;
  name?: string;
  description?: string;
  status?: string;
  is_core?: boolean;
  order?: number;
  [key: string]: unknown;
}

/**
 * Service category.
 */
export interface ServiceCategory extends HaloBaseEntity {
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  isActive: boolean;
  order?: number;
  serviceCount?: number;
}

/**
 * Raw service category from API.
 */
export interface ServiceCategoryApiResponse {
  id: number;
  name?: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  is_active?: boolean;
  order?: number;
  service_count?: number;
  [key: string]: unknown;
}

/**
 * Service status record.
 */
export interface ServiceStatus extends HaloBaseEntity {
  serviceId: number;
  serviceName?: string;
  status: ServiceStatusType;
  statusMessage?: string;
  changedAt: string;
  changedById?: number;
  changedByName?: string;
  previousStatus?: ServiceStatusType;
  incidentId?: number;
  incidentNumber?: string;
  maintenanceId?: number;
  isScheduled: boolean;
  estimatedResolution?: string;
  affectedComponents?: number[];
}

/**
 * Raw service status from API.
 */
export interface ServiceStatusApiResponse {
  id: number;
  service_id?: number;
  service_name?: string;
  status?: string;
  status_message?: string;
  changed_at?: string;
  changed_by_id?: number;
  changed_by_name?: string;
  previous_status?: string;
  incident_id?: number;
  incident_number?: string;
  maintenance_id?: number;
  is_scheduled?: boolean;
  estimated_resolution?: string;
  affected_components?: number[];
  [key: string]: unknown;
}

/**
 * Service availability record.
 */
export interface ServiceAvailability extends HaloBaseEntity {
  serviceId: number;
  serviceName?: string;
  periodStart: string;
  periodEnd: string;
  uptimePercentage: number;
  downtimeMinutes: number;
  incidentCount: number;
  maintenanceMinutes: number;
  slaTarget?: number;
  slaMet: boolean;
  byDay?: DailyAvailability[];
}

/**
 * Raw service availability from API.
 */
export interface ServiceAvailabilityApiResponse {
  id: number;
  service_id?: number;
  service_name?: string;
  period_start?: string;
  period_end?: string;
  uptime_percentage?: number;
  downtime_minutes?: number;
  incident_count?: number;
  maintenance_minutes?: number;
  sla_target?: number;
  sla_met?: boolean;
  by_day?: DailyAvailabilityApiResponse[];
  [key: string]: unknown;
}

/**
 * Daily availability record.
 */
export interface DailyAvailability {
  date: string;
  uptimePercentage: number;
  downtimeMinutes: number;
  incidentCount: number;
  status: ServiceStatusType;
}

/**
 * Raw daily availability from API.
 */
export interface DailyAvailabilityApiResponse {
  date?: string;
  uptime_percentage?: number;
  downtime_minutes?: number;
  incident_count?: number;
  status?: string;
  [key: string]: unknown;
}

/**
 * Scheduled maintenance.
 */
export interface ScheduledMaintenance extends HaloBaseEntity {
  serviceId: number;
  serviceName?: string;
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  impactLevel: 'none' | 'minor' | 'major' | 'critical';
  affectedComponents?: number[];
  notifySubscribers: boolean;
  createdById?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw scheduled maintenance from API.
 */
export interface ScheduledMaintenanceApiResponse {
  id: number;
  service_id?: number;
  service_name?: string;
  title?: string;
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  status?: string;
  impact_level?: string;
  affected_components?: number[];
  notify_subscribers?: boolean;
  created_by_id?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Service subscriber.
 */
export interface ServiceSubscriber {
  serviceId: number;
  userId?: number;
  email: string;
  name?: string;
  notifyOnStatusChange: boolean;
  notifyOnMaintenance: boolean;
  subscribedAt: string;
}

/**
 * Raw service subscriber from API.
 */
export interface ServiceSubscriberApiResponse {
  service_id?: number;
  user_id?: number;
  email?: string;
  name?: string;
  notify_on_status_change?: boolean;
  notify_on_maintenance?: boolean;
  subscribed_at?: string;
  [key: string]: unknown;
}

/**
 * Transform API response to Service interface.
 */
export function transformService(data: ServiceApiResponse): Service {
  const statusMap: Record<string, ServiceStatusType> = {
    operational: 'operational',
    degraded: 'degraded',
    partial_outage: 'partial_outage',
    major_outage: 'major_outage',
    maintenance: 'maintenance',
    unknown: 'unknown',
  };

  const criticalityMap: Record<string, ServiceCriticality> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };

  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    categoryId: data.category_id,
    categoryName: data.category_name,
    status: statusMap[data.status || ''] || 'unknown',
    criticality: criticalityMap[data.criticality || ''] || 'medium',
    ownerId: data.owner_id,
    ownerName: data.owner_name,
    teamId: data.team_id,
    teamName: data.team_name,
    clientId: data.client_id,
    clientName: data.client_name,
    slaId: data.sla_id,
    slaName: data.sla_name,
    isActive: data.is_active ?? true,
    isPublic: data.is_public ?? false,
    url: data.url,
    documentationUrl: data.documentation_url,
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
    dependencies: data.dependencies?.map(transformServiceDependency),
    components: data.components?.map(transformServiceComponent),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ServiceDependency interface.
 */
export function transformServiceDependency(data: ServiceDependencyApiResponse): ServiceDependency {
  return {
    id: data.id,
    serviceId: data.service_id || 0,
    dependsOnServiceId: data.depends_on_service_id || 0,
    dependsOnServiceName: data.depends_on_service_name,
    dependencyType: (data.dependency_type === 'hard' || data.dependency_type === 'soft')
      ? data.dependency_type
      : 'soft',
    description: data.description,
  };
}

/**
 * Transform API response to ServiceComponent interface.
 */
export function transformServiceComponent(data: ServiceComponentApiResponse): ServiceComponent {
  const statusMap: Record<string, ServiceStatusType> = {
    operational: 'operational',
    degraded: 'degraded',
    partial_outage: 'partial_outage',
    major_outage: 'major_outage',
    maintenance: 'maintenance',
    unknown: 'unknown',
  };

  return {
    id: data.id,
    serviceId: data.service_id || 0,
    name: data.name || '',
    description: data.description,
    status: statusMap[data.status || ''] || 'unknown',
    isCore: data.is_core ?? false,
    order: data.order,
  };
}

/**
 * Transform API response to ServiceCategory interface.
 */
export function transformServiceCategory(data: ServiceCategoryApiResponse): ServiceCategory {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    parentId: data.parent_id,
    parentName: data.parent_name,
    isActive: data.is_active ?? true,
    order: data.order,
    serviceCount: data.service_count,
  };
}

/**
 * Transform API response to ServiceStatus interface.
 */
export function transformServiceStatus(data: ServiceStatusApiResponse): ServiceStatus {
  const statusMap: Record<string, ServiceStatusType> = {
    operational: 'operational',
    degraded: 'degraded',
    partial_outage: 'partial_outage',
    major_outage: 'major_outage',
    maintenance: 'maintenance',
    unknown: 'unknown',
  };

  return {
    id: data.id,
    serviceId: data.service_id || 0,
    serviceName: data.service_name,
    status: statusMap[data.status || ''] || 'unknown',
    statusMessage: data.status_message,
    changedAt: data.changed_at || '',
    changedById: data.changed_by_id,
    changedByName: data.changed_by_name,
    previousStatus: statusMap[data.previous_status || ''],
    incidentId: data.incident_id,
    incidentNumber: data.incident_number,
    maintenanceId: data.maintenance_id,
    isScheduled: data.is_scheduled ?? false,
    estimatedResolution: data.estimated_resolution,
    affectedComponents: data.affected_components,
  };
}

/**
 * Transform API response to ServiceAvailability interface.
 */
export function transformServiceAvailability(data: ServiceAvailabilityApiResponse): ServiceAvailability {
  return {
    id: data.id,
    serviceId: data.service_id || 0,
    serviceName: data.service_name,
    periodStart: data.period_start || '',
    periodEnd: data.period_end || '',
    uptimePercentage: data.uptime_percentage || 0,
    downtimeMinutes: data.downtime_minutes || 0,
    incidentCount: data.incident_count || 0,
    maintenanceMinutes: data.maintenance_minutes || 0,
    slaTarget: data.sla_target,
    slaMet: data.sla_met ?? true,
    byDay: data.by_day?.map(transformDailyAvailability),
  };
}

/**
 * Transform API response to DailyAvailability interface.
 */
export function transformDailyAvailability(data: DailyAvailabilityApiResponse): DailyAvailability {
  const statusMap: Record<string, ServiceStatusType> = {
    operational: 'operational',
    degraded: 'degraded',
    partial_outage: 'partial_outage',
    major_outage: 'major_outage',
    maintenance: 'maintenance',
    unknown: 'unknown',
  };

  return {
    date: data.date || '',
    uptimePercentage: data.uptime_percentage || 0,
    downtimeMinutes: data.downtime_minutes || 0,
    incidentCount: data.incident_count || 0,
    status: statusMap[data.status || ''] || 'unknown',
  };
}

/**
 * Transform API response to ScheduledMaintenance interface.
 */
export function transformScheduledMaintenance(data: ScheduledMaintenanceApiResponse): ScheduledMaintenance {
  const statusMap: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = {
    scheduled: 'scheduled',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  const impactMap: Record<string, 'none' | 'minor' | 'major' | 'critical'> = {
    none: 'none',
    minor: 'minor',
    major: 'major',
    critical: 'critical',
  };

  return {
    id: data.id,
    serviceId: data.service_id || 0,
    serviceName: data.service_name,
    title: data.title || '',
    description: data.description,
    scheduledStart: data.scheduled_start || '',
    scheduledEnd: data.scheduled_end || '',
    actualStart: data.actual_start,
    actualEnd: data.actual_end,
    status: statusMap[data.status || ''] || 'scheduled',
    impactLevel: impactMap[data.impact_level || ''] || 'minor',
    affectedComponents: data.affected_components,
    notifySubscribers: data.notify_subscribers ?? true,
    createdById: data.created_by_id,
    createdByName: data.created_by_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ServiceSubscriber interface.
 */
export function transformServiceSubscriber(data: ServiceSubscriberApiResponse): ServiceSubscriber {
  return {
    serviceId: data.service_id || 0,
    userId: data.user_id,
    email: data.email || '',
    name: data.name,
    notifyOnStatusChange: data.notify_on_status_change ?? true,
    notifyOnMaintenance: data.notify_on_maintenance ?? true,
    subscribedAt: data.subscribed_at || '',
  };
}
