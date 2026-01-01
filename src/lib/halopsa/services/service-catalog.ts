/**
 * Service Catalog services for HaloPSA API.
 */

import { BaseService } from './base';
import type { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  Service,
  ServiceApiResponse,
  ServiceCategory,
  ServiceCategoryApiResponse,
  ServiceStatus,
  ServiceStatusApiResponse,
  ServiceAvailability,
  ServiceAvailabilityApiResponse,
  ScheduledMaintenance,
  ScheduledMaintenanceApiResponse,
  ServiceSubscriber,
  ServiceSubscriberApiResponse,
  ServiceStatusType,
  ServiceCriticality,
  transformService,
  transformServiceCategory,
  transformServiceStatus,
  transformServiceAvailability,
  transformScheduledMaintenance,
  transformServiceSubscriber,
} from '../types/service-catalog';

/**
 * Service for managing services in the catalog.
 */
export class ServiceCatalogService extends BaseService<Service, ServiceApiResponse> {
  protected endpoint = '/Service';

  protected transform(data: ServiceApiResponse): Service {
    return transformService(data);
  }

  /**
   * List services with filters.
   */
  async listFiltered(filters: {
    categoryId?: number;
    status?: ServiceStatusType;
    criticality?: ServiceCriticality;
    ownerId?: number;
    teamId?: number;
    clientId?: number;
    isActive?: boolean;
    isPublic?: boolean;
    search?: string;
    count?: number;
  }): Promise<Service[]> {
    const params: ListParams = {};
    if (filters.categoryId) params.category_id = filters.categoryId;
    if (filters.status) params.status = filters.status;
    if (filters.criticality) params.criticality = filters.criticality;
    if (filters.ownerId) params.owner_id = filters.ownerId;
    if (filters.teamId) params.team_id = filters.teamId;
    if (filters.clientId) params.client_id = filters.clientId;
    if (filters.isActive !== undefined) params.is_active = filters.isActive;
    if (filters.isPublic !== undefined) params.is_public = filters.isPublic;
    if (filters.search) params.search = filters.search;
    if (filters.count) params.count = filters.count;
    return this.list(params);
  }

  /**
   * List active services.
   */
  async listActive(): Promise<Service[]> {
    return this.listFiltered({ isActive: true });
  }

  /**
   * List public services.
   */
  async listPublic(): Promise<Service[]> {
    return this.listFiltered({ isPublic: true, isActive: true });
  }

  /**
   * List services by status.
   */
  async listByStatus(status: ServiceStatusType): Promise<Service[]> {
    return this.listFiltered({ status });
  }

  /**
   * List critical services.
   */
  async listCritical(): Promise<Service[]> {
    return this.listFiltered({ criticality: 'critical' });
  }

  /**
   * List services with issues (not operational).
   */
  async listWithIssues(): Promise<Service[]> {
    const services = await this.listActive();
    return services.filter(s => s.status !== 'operational');
  }

  /**
   * Get service with dependencies and components.
   */
  async getWithDetails(serviceId: number): Promise<Service> {
    return this.get(serviceId, { includedependencies: true, includecomponents: true });
  }

  /**
   * Create a new service.
   */
  async createService(data: {
    name: string;
    description?: string;
    categoryId?: number;
    criticality?: ServiceCriticality;
    ownerId?: number;
    teamId?: number;
    clientId?: number;
    slaId?: number;
    isPublic?: boolean;
    url?: string;
    documentationUrl?: string;
    supportEmail?: string;
    supportPhone?: string;
  }): Promise<Service> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      status: 'operational' as ServiceStatusType,
      criticality: data.criticality || 'medium',
      ownerId: data.ownerId,
      teamId: data.teamId,
      clientId: data.clientId,
      slaId: data.slaId,
      isActive: true,
      isPublic: data.isPublic ?? false,
      url: data.url,
      documentationUrl: data.documentationUrl,
      supportEmail: data.supportEmail,
      supportPhone: data.supportPhone,
    }]);
    return result[0];
  }

  /**
   * Update service status.
   */
  async updateStatus(serviceId: number, status: ServiceStatusType): Promise<Service> {
    const result = await this.update([{ id: serviceId, status }]);
    return result[0];
  }

  /**
   * Search services.
   */
  async search(query: string): Promise<Service[]> {
    return this.listFiltered({ search: query });
  }
}

/**
 * Service for managing service categories.
 */
export class ServiceCategoryService extends BaseService<ServiceCategory, ServiceCategoryApiResponse> {
  protected endpoint = '/ServiceCategory';

  protected transform(data: ServiceCategoryApiResponse): ServiceCategory {
    return transformServiceCategory(data);
  }

  /**
   * List active categories.
   */
  async listActive(): Promise<ServiceCategory[]> {
    return this.list({ is_active: true });
  }

  /**
   * List root categories (no parent).
   */
  async listRoot(): Promise<ServiceCategory[]> {
    const categories = await this.listActive();
    return categories.filter(c => !c.parentId);
  }

  /**
   * List child categories.
   */
  async listChildren(parentId: number): Promise<ServiceCategory[]> {
    return this.list({ parent_id: parentId });
  }

  /**
   * Get category tree.
   */
  async getCategoryTree(): Promise<Array<ServiceCategory & { children: ServiceCategory[] }>> {
    const categories = await this.listActive();
    const rootCategories = categories.filter(c => !c.parentId);

    return rootCategories.map(parent => ({
      ...parent,
      children: categories.filter(c => c.parentId === parent.id),
    }));
  }

  /**
   * Create a new category.
   */
  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: number;
    order?: number;
  }): Promise<ServiceCategory> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      isActive: true,
      order: data.order,
    }]);
    return result[0];
  }
}

/**
 * Service for managing service status history.
 */
export class ServiceStatusService extends BaseService<ServiceStatus, ServiceStatusApiResponse> {
  protected endpoint = '/ServiceStatus';

  protected transform(data: ServiceStatusApiResponse): ServiceStatus {
    return transformServiceStatus(data);
  }

  /**
   * List status history for a service.
   */
  async listByService(serviceId: number, count?: number): Promise<ServiceStatus[]> {
    return this.list({ service_id: serviceId, count: count || 50 });
  }

  /**
   * Get current status for a service.
   */
  async getCurrentStatus(serviceId: number): Promise<ServiceStatus | null> {
    const statuses = await this.listByService(serviceId, 1);
    return statuses[0] || null;
  }

  /**
   * Record a status change.
   */
  async recordStatusChange(data: {
    serviceId: number;
    status: ServiceStatusType;
    statusMessage?: string;
    changedById?: number;
    incidentId?: number;
    maintenanceId?: number;
    isScheduled?: boolean;
    estimatedResolution?: string;
    affectedComponents?: number[];
  }): Promise<ServiceStatus> {
    const result = await this.create([{
      id: 0,
      serviceId: data.serviceId,
      status: data.status,
      statusMessage: data.statusMessage,
      changedAt: new Date().toISOString(),
      changedById: data.changedById,
      incidentId: data.incidentId,
      maintenanceId: data.maintenanceId,
      isScheduled: data.isScheduled ?? false,
      estimatedResolution: data.estimatedResolution,
      affectedComponents: data.affectedComponents,
    }]);
    return result[0];
  }

  /**
   * Get recent status changes across all services.
   */
  async getRecentChanges(count?: number): Promise<ServiceStatus[]> {
    return this.list({ count: count || 20 });
  }
}

/**
 * Service for managing service availability.
 */
export class ServiceAvailabilityService extends BaseService<ServiceAvailability, ServiceAvailabilityApiResponse> {
  protected endpoint = '/ServiceAvailability';

  protected transform(data: ServiceAvailabilityApiResponse): ServiceAvailability {
    return transformServiceAvailability(data);
  }

  /**
   * Get availability for a service in a period.
   */
  async getForService(serviceId: number, startDate: string, endDate: string): Promise<ServiceAvailability | null> {
    const results = await this.list({
      service_id: serviceId,
      start_date: startDate,
      end_date: endDate,
    });
    return results[0] || null;
  }

  /**
   * Get availability summary for multiple services.
   */
  async getSummary(serviceIds: number[], startDate: string, endDate: string): Promise<ServiceAvailability[]> {
    return this.list({
      service_ids: serviceIds.join(','),
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get services not meeting SLA.
   */
  async getSlaMissed(startDate: string, endDate: string): Promise<ServiceAvailability[]> {
    const results = await this.list({
      start_date: startDate,
      end_date: endDate,
      sla_met: false,
    });
    return results;
  }

  /**
   * Calculate availability percentage.
   */
  calculateUptimePercentage(downtimeMinutes: number, totalMinutes: number): number {
    if (totalMinutes <= 0) return 100;
    return ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;
  }
}

/**
 * Service for managing scheduled maintenance.
 */
export class ScheduledMaintenanceService extends BaseService<ScheduledMaintenance, ScheduledMaintenanceApiResponse> {
  protected endpoint = '/ScheduledMaintenance';

  protected transform(data: ScheduledMaintenanceApiResponse): ScheduledMaintenance {
    return transformScheduledMaintenance(data);
  }

  /**
   * List maintenance windows with filters.
   */
  async listFiltered(filters: {
    serviceId?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    startDate?: string;
    endDate?: string;
    count?: number;
  }): Promise<ScheduledMaintenance[]> {
    const params: ListParams = {};
    if (filters.serviceId) params.service_id = filters.serviceId;
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.count) params.count = filters.count;
    return this.list(params);
  }

  /**
   * Get upcoming maintenance windows.
   */
  async getUpcoming(count?: number): Promise<ScheduledMaintenance[]> {
    return this.listFiltered({
      status: 'scheduled',
      startDate: new Date().toISOString(),
      count,
    });
  }

  /**
   * Get current maintenance windows.
   */
  async getCurrent(): Promise<ScheduledMaintenance[]> {
    return this.listFiltered({ status: 'in_progress' });
  }

  /**
   * Get maintenance for a service.
   */
  async listByService(serviceId: number): Promise<ScheduledMaintenance[]> {
    return this.listFiltered({ serviceId });
  }

  /**
   * Schedule a maintenance window.
   */
  async scheduleMaintenance(data: {
    serviceId: number;
    title: string;
    description?: string;
    scheduledStart: string;
    scheduledEnd: string;
    impactLevel?: 'none' | 'minor' | 'major' | 'critical';
    affectedComponents?: number[];
    notifySubscribers?: boolean;
    createdById?: number;
  }): Promise<ScheduledMaintenance> {
    const result = await this.create([{
      id: 0,
      serviceId: data.serviceId,
      title: data.title,
      description: data.description,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      status: 'scheduled' as const,
      impactLevel: data.impactLevel || 'minor',
      affectedComponents: data.affectedComponents,
      notifySubscribers: data.notifySubscribers ?? true,
      createdById: data.createdById,
    }]);
    return result[0];
  }

  /**
   * Start maintenance.
   */
  async startMaintenance(maintenanceId: number): Promise<ScheduledMaintenance> {
    const result = await this.update([{
      id: maintenanceId,
      status: 'in_progress' as const,
      actualStart: new Date().toISOString(),
    }]);
    return result[0];
  }

  /**
   * Complete maintenance.
   */
  async completeMaintenance(maintenanceId: number): Promise<ScheduledMaintenance> {
    const result = await this.update([{
      id: maintenanceId,
      status: 'completed' as const,
      actualEnd: new Date().toISOString(),
    }]);
    return result[0];
  }

  /**
   * Cancel maintenance.
   */
  async cancelMaintenance(maintenanceId: number): Promise<ScheduledMaintenance> {
    const result = await this.update([{
      id: maintenanceId,
      status: 'cancelled' as const,
    }]);
    return result[0];
  }
}

/**
 * Service for managing service subscribers.
 */
export class ServiceSubscriberService {
  private client: HaloPSAClient;
  private endpoint = '/ServiceSubscriber';

  constructor(client: HaloPSAClient) {
    this.client = client;
  }

  /**
   * List subscribers for a service.
   */
  async listByService(serviceId: number): Promise<ServiceSubscriber[]> {
    const data = await this.client.get<ServiceSubscriberApiResponse[]>(this.endpoint, {
      service_id: serviceId,
    });
    return data.map(transformServiceSubscriber);
  }

  /**
   * Subscribe to a service.
   */
  async subscribe(data: {
    serviceId: number;
    userId?: number;
    email: string;
    name?: string;
    notifyOnStatusChange?: boolean;
    notifyOnMaintenance?: boolean;
  }): Promise<ServiceSubscriber> {
    const result = await this.client.post<ServiceSubscriberApiResponse[]>(this.endpoint, [{
      service_id: data.serviceId,
      user_id: data.userId,
      email: data.email,
      name: data.name,
      notify_on_status_change: data.notifyOnStatusChange ?? true,
      notify_on_maintenance: data.notifyOnMaintenance ?? true,
    }]);
    return transformServiceSubscriber(result[0]);
  }

  /**
   * Unsubscribe from a service.
   */
  async unsubscribe(serviceId: number, email: string): Promise<void> {
    await this.client.delete(`${this.endpoint}/${serviceId}/${encodeURIComponent(email)}`);
  }

  /**
   * Update notification preferences.
   */
  async updatePreferences(
    serviceId: number,
    email: string,
    notifyOnStatusChange: boolean,
    notifyOnMaintenance: boolean
  ): Promise<ServiceSubscriber> {
    const result = await this.client.post<ServiceSubscriberApiResponse[]>(this.endpoint, [{
      service_id: serviceId,
      email,
      notify_on_status_change: notifyOnStatusChange,
      notify_on_maintenance: notifyOnMaintenance,
    }]);
    return transformServiceSubscriber(result[0]);
  }
}

/**
 * Create service catalog services for a client.
 */
export function createServiceCatalogServices(client: HaloPSAClient) {
  return {
    services: new ServiceCatalogService(client),
    categories: new ServiceCategoryService(client),
    statuses: new ServiceStatusService(client),
    availability: new ServiceAvailabilityService(client),
    maintenance: new ScheduledMaintenanceService(client),
    subscribers: new ServiceSubscriberService(client),
  };
}
