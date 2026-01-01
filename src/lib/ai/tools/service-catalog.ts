/**
 * Service Catalog AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Service, ServiceCategory, ServiceStatus, ServiceAvailability, ScheduledMaintenance, ServiceDependency, ServiceComponent, ServiceSubscriber } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createServiceCatalogTools(ctx: HaloContext) {
  return {
    // === SERVICE OPERATIONS ===
    listServices: tool({
      description: 'List services in the service catalog.',
      parameters: z.object({
        categoryId: z.number().optional().describe('Filter by category'),
        status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance', 'unknown']).optional().describe('Filter by status'),
        criticality: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Filter by criticality'),
        ownerId: z.number().optional().describe('Filter by owner'),
        teamId: z.number().optional().describe('Filter by team'),
        clientId: z.number().optional().describe('Filter by client'),
        isPublic: z.boolean().optional().describe('Filter by public visibility'),
        search: z.string().optional().describe('Search services'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ categoryId, status, criticality, ownerId, teamId, clientId, isPublic, search, count }) => {
        try {
          const services = await ctx.serviceCatalog.listFiltered({
            categoryId,
            status,
            criticality,
            ownerId,
            teamId,
            clientId,
            isPublic,
            search,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: services.length,
            data: services.map((s: Service) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              category: s.categoryName,
              status: s.status,
              criticality: s.criticality,
              owner: s.ownerName,
              team: s.teamName,
              sla: s.slaName,
              isPublic: s.isPublic,
            })),
          };
        } catch (error) {
          return formatError(error, 'listServices');
        }
      },
    }),

    getService: tool({
      description: 'Get detailed service information with dependencies and components.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
      }),
      execute: async ({ serviceId }) => {
        try {
          const service = await ctx.serviceCatalog.getWithDetails(serviceId);

          return {
            success: true,
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.categoryName,
            status: service.status,
            criticality: service.criticality,
            owner: service.ownerName,
            team: service.teamName,
            client: service.clientName,
            sla: service.slaName,
            isActive: service.isActive,
            isPublic: service.isPublic,
            url: service.url,
            documentationUrl: service.documentationUrl,
            supportEmail: service.supportEmail,
            supportPhone: service.supportPhone,
            dependencies: service.dependencies?.map((d: ServiceDependency) => ({
              serviceId: d.dependsOnServiceId,
              service: d.dependsOnServiceName,
              type: d.dependencyType,
            })),
            components: service.components?.map((c: ServiceComponent) => ({
              id: c.id,
              name: c.name,
              status: c.status,
              isCore: c.isCore,
            })),
          };
        } catch (error) {
          return formatError(error, 'getService');
        }
      },
    }),

    getServicesWithIssues: tool({
      description: 'Get services that are not fully operational.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const services = await ctx.serviceCatalog.listWithIssues();

          return {
            success: true,
            count: services.length,
            data: services.map((s: Service) => ({
              id: s.id,
              name: s.name,
              status: s.status,
              criticality: s.criticality,
              owner: s.ownerName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getServicesWithIssues');
        }
      },
    }),

    getCriticalServices: tool({
      description: 'Get critical services.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const services = await ctx.serviceCatalog.listCritical();

          return {
            success: true,
            count: services.length,
            data: services.map((s: Service) => ({
              id: s.id,
              name: s.name,
              status: s.status,
              owner: s.ownerName,
              sla: s.slaName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCriticalServices');
        }
      },
    }),

    createService: tool({
      description: 'Create a new service in the catalog.',
      parameters: z.object({
        name: z.string().describe('Service name'),
        description: z.string().optional().describe('Service description'),
        categoryId: z.number().optional().describe('Category ID'),
        criticality: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Criticality level'),
        ownerId: z.number().optional().describe('Owner agent ID'),
        teamId: z.number().optional().describe('Team ID'),
        clientId: z.number().optional().describe('Client ID'),
        slaId: z.number().optional().describe('SLA ID'),
        isPublic: z.boolean().optional().describe('Public visibility'),
        url: z.string().optional().describe('Service URL'),
        documentationUrl: z.string().optional().describe('Documentation URL'),
        supportEmail: z.string().optional().describe('Support email'),
        supportPhone: z.string().optional().describe('Support phone'),
      }),
      execute: async ({ name, description, categoryId, criticality, ownerId, teamId, clientId, slaId, isPublic, url, documentationUrl, supportEmail, supportPhone }) => {
        try {
          const service = await ctx.serviceCatalog.createService({
            name,
            description,
            categoryId,
            criticality,
            ownerId,
            teamId,
            clientId,
            slaId,
            isPublic,
            url,
            documentationUrl,
            supportEmail,
            supportPhone,
          });

          return {
            success: true,
            serviceId: service.id,
            name: service.name,
            message: `Service "${service.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createService');
        }
      },
    }),

    updateServiceStatus: tool({
      description: 'Update the status of a service.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance', 'unknown']).describe('New status'),
      }),
      execute: async ({ serviceId, status }) => {
        try {
          const service = await ctx.serviceCatalog.updateStatus(serviceId, status);

          return {
            success: true,
            serviceId: service.id,
            name: service.name,
            status: service.status,
            message: `Service status updated to ${status}`,
          };
        } catch (error) {
          return formatError(error, 'updateServiceStatus');
        }
      },
    }),

    searchServices: tool({
      description: 'Search for services.',
      parameters: z.object({
        query: z.string().describe('Search query'),
      }),
      execute: async ({ query }) => {
        try {
          const services = await ctx.serviceCatalog.search(query);

          return {
            success: true,
            count: services.length,
            data: services.map((s: Service) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              status: s.status,
              category: s.categoryName,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchServices');
        }
      },
    }),

    // === SERVICE CATEGORY OPERATIONS ===
    listServiceCategories: tool({
      description: 'List service categories.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active categories'),
      }),
      execute: async ({ activeOnly }) => {
        try {
          const categories = activeOnly
            ? await ctx.serviceCategories.listActive()
            : await ctx.serviceCategories.list();

          return {
            success: true,
            count: categories.length,
            data: categories.map((c: ServiceCategory) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              parent: c.parentName,
              serviceCount: c.serviceCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listServiceCategories');
        }
      },
    }),

    getServiceCategoryTree: tool({
      description: 'Get service categories in a hierarchical tree structure.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const tree = await ctx.serviceCategories.getCategoryTree();

          return {
            success: true,
            data: tree.map((parent: ServiceCategory & { children: ServiceCategory[] }) => ({
              id: parent.id,
              name: parent.name,
              serviceCount: parent.serviceCount,
              children: parent.children.map((child: ServiceCategory) => ({
                id: child.id,
                name: child.name,
                serviceCount: child.serviceCount,
              })),
            })),
          };
        } catch (error) {
          return formatError(error, 'getServiceCategoryTree');
        }
      },
    }),

    // === SERVICE STATUS OPERATIONS ===
    getServiceStatusHistory: tool({
      description: 'Get status history for a service.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        count: z.number().optional().default(50).describe('Number of records to return'),
      }),
      execute: async ({ serviceId, count }) => {
        try {
          const history = await ctx.serviceStatuses.listByService(serviceId, count);

          return {
            success: true,
            count: history.length,
            data: history.map((s: ServiceStatus) => ({
              id: s.id,
              status: s.status,
              message: s.statusMessage,
              changedAt: s.changedAt,
              changedBy: s.changedByName,
              previousStatus: s.previousStatus,
              incidentNumber: s.incidentNumber,
              isScheduled: s.isScheduled,
            })),
          };
        } catch (error) {
          return formatError(error, 'getServiceStatusHistory');
        }
      },
    }),

    recordServiceStatusChange: tool({
      description: 'Record a status change for a service.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance', 'unknown']).describe('New status'),
        statusMessage: z.string().optional().describe('Status message'),
        changedById: z.number().optional().describe('Agent ID making the change'),
        incidentId: z.number().optional().describe('Related incident ID'),
        isScheduled: z.boolean().optional().describe('Whether change was scheduled'),
        estimatedResolution: z.string().optional().describe('Estimated resolution time'),
        affectedComponents: z.array(z.number()).optional().describe('Affected component IDs'),
      }),
      execute: async ({ serviceId, status, statusMessage, changedById, incidentId, isScheduled, estimatedResolution, affectedComponents }) => {
        try {
          const statusRecord = await ctx.serviceStatuses.recordStatusChange({
            serviceId,
            status,
            statusMessage,
            changedById,
            incidentId,
            isScheduled,
            estimatedResolution,
            affectedComponents,
          });

          return {
            success: true,
            statusId: statusRecord.id,
            status: statusRecord.status,
            changedAt: statusRecord.changedAt,
            message: `Status change recorded: ${status}`,
          };
        } catch (error) {
          return formatError(error, 'recordServiceStatusChange');
        }
      },
    }),

    getRecentStatusChanges: tool({
      description: 'Get recent status changes across all services.',
      parameters: z.object({
        count: z.number().optional().default(20).describe('Number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const changes = await ctx.serviceStatuses.getRecentChanges(count);

          return {
            success: true,
            count: changes.length,
            data: changes.map((s: ServiceStatus) => ({
              serviceId: s.serviceId,
              service: s.serviceName,
              status: s.status,
              previousStatus: s.previousStatus,
              changedAt: s.changedAt,
              changedBy: s.changedByName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getRecentStatusChanges');
        }
      },
    }),

    // === SERVICE AVAILABILITY OPERATIONS ===
    getServiceAvailability: tool({
      description: 'Get availability metrics for a service.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ serviceId, startDate, endDate }) => {
        try {
          const availability = await ctx.serviceAvailability.getForService(serviceId, startDate, endDate);

          if (!availability) {
            return {
              success: true,
              message: 'No availability data found for this period',
              data: null,
            };
          }

          return {
            success: true,
            serviceId: availability.serviceId,
            service: availability.serviceName,
            periodStart: availability.periodStart,
            periodEnd: availability.periodEnd,
            uptimePercentage: availability.uptimePercentage,
            downtimeMinutes: availability.downtimeMinutes,
            incidentCount: availability.incidentCount,
            maintenanceMinutes: availability.maintenanceMinutes,
            slaTarget: availability.slaTarget,
            slaMet: availability.slaMet,
            byDay: availability.byDay,
          };
        } catch (error) {
          return formatError(error, 'getServiceAvailability');
        }
      },
    }),

    getServicesNotMeetingSLA: tool({
      description: 'Get services that are not meeting their SLA targets.',
      parameters: z.object({
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ startDate, endDate }) => {
        try {
          const results = await ctx.serviceAvailability.getSlaMissed(startDate, endDate);

          return {
            success: true,
            count: results.length,
            data: results.map((a: ServiceAvailability) => ({
              serviceId: a.serviceId,
              service: a.serviceName,
              uptimePercentage: a.uptimePercentage,
              slaTarget: a.slaTarget,
              gap: a.slaTarget ? a.slaTarget - a.uptimePercentage : null,
              incidentCount: a.incidentCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'getServicesNotMeetingSLA');
        }
      },
    }),

    // === SCHEDULED MAINTENANCE OPERATIONS ===
    listScheduledMaintenance: tool({
      description: 'List scheduled maintenance windows.',
      parameters: z.object({
        serviceId: z.number().optional().describe('Filter by service'),
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional().describe('Filter by status'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ serviceId, status, startDate, endDate, count }) => {
        try {
          const maintenance = await ctx.scheduledMaintenance.listFiltered({
            serviceId,
            status,
            startDate,
            endDate,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: maintenance.length,
            data: maintenance.map((m: ScheduledMaintenance) => ({
              id: m.id,
              service: m.serviceName,
              title: m.title,
              scheduledStart: m.scheduledStart,
              scheduledEnd: m.scheduledEnd,
              status: m.status,
              impactLevel: m.impactLevel,
            })),
          };
        } catch (error) {
          return formatError(error, 'listScheduledMaintenance');
        }
      },
    }),

    getUpcomingMaintenance: tool({
      description: 'Get upcoming scheduled maintenance windows.',
      parameters: z.object({
        count: z.number().optional().default(10).describe('Number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const maintenance = await ctx.scheduledMaintenance.getUpcoming(count);

          return {
            success: true,
            count: maintenance.length,
            data: maintenance.map((m: ScheduledMaintenance) => ({
              id: m.id,
              service: m.serviceName,
              title: m.title,
              description: m.description,
              scheduledStart: m.scheduledStart,
              scheduledEnd: m.scheduledEnd,
              impactLevel: m.impactLevel,
            })),
          };
        } catch (error) {
          return formatError(error, 'getUpcomingMaintenance');
        }
      },
    }),

    getCurrentMaintenance: tool({
      description: 'Get currently active maintenance windows.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const maintenance = await ctx.scheduledMaintenance.getCurrent();

          return {
            success: true,
            count: maintenance.length,
            data: maintenance.map((m: ScheduledMaintenance) => ({
              id: m.id,
              service: m.serviceName,
              title: m.title,
              scheduledStart: m.scheduledStart,
              scheduledEnd: m.scheduledEnd,
              actualStart: m.actualStart,
              impactLevel: m.impactLevel,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCurrentMaintenance');
        }
      },
    }),

    scheduleMaintenance: tool({
      description: 'Schedule a maintenance window.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        title: z.string().describe('Maintenance title'),
        description: z.string().optional().describe('Maintenance description'),
        scheduledStart: z.string().describe('Scheduled start (ISO 8601)'),
        scheduledEnd: z.string().describe('Scheduled end (ISO 8601)'),
        impactLevel: z.enum(['none', 'minor', 'major', 'critical']).optional().describe('Expected impact'),
        affectedComponents: z.array(z.number()).optional().describe('Affected component IDs'),
        notifySubscribers: z.boolean().optional().describe('Notify subscribers'),
        createdById: z.number().optional().describe('Creating agent ID'),
      }),
      execute: async ({ serviceId, title, description, scheduledStart, scheduledEnd, impactLevel, affectedComponents, notifySubscribers, createdById }) => {
        try {
          const maintenance = await ctx.scheduledMaintenance.scheduleMaintenance({
            serviceId,
            title,
            description,
            scheduledStart,
            scheduledEnd,
            impactLevel,
            affectedComponents,
            notifySubscribers,
            createdById,
          });

          return {
            success: true,
            maintenanceId: maintenance.id,
            title: maintenance.title,
            scheduledStart: maintenance.scheduledStart,
            scheduledEnd: maintenance.scheduledEnd,
            message: `Maintenance "${maintenance.title}" scheduled`,
          };
        } catch (error) {
          return formatError(error, 'scheduleMaintenance');
        }
      },
    }),

    startMaintenance: tool({
      description: 'Start a scheduled maintenance window.',
      parameters: z.object({
        maintenanceId: z.number().describe('Maintenance ID'),
      }),
      execute: async ({ maintenanceId }) => {
        try {
          const maintenance = await ctx.scheduledMaintenance.startMaintenance(maintenanceId);

          return {
            success: true,
            maintenanceId: maintenance.id,
            status: maintenance.status,
            actualStart: maintenance.actualStart,
            message: 'Maintenance started',
          };
        } catch (error) {
          return formatError(error, 'startMaintenance');
        }
      },
    }),

    completeMaintenance: tool({
      description: 'Complete a maintenance window.',
      parameters: z.object({
        maintenanceId: z.number().describe('Maintenance ID'),
      }),
      execute: async ({ maintenanceId }) => {
        try {
          const maintenance = await ctx.scheduledMaintenance.completeMaintenance(maintenanceId);

          return {
            success: true,
            maintenanceId: maintenance.id,
            status: maintenance.status,
            actualEnd: maintenance.actualEnd,
            message: 'Maintenance completed',
          };
        } catch (error) {
          return formatError(error, 'completeMaintenance');
        }
      },
    }),

    cancelMaintenance: tool({
      description: 'Cancel a scheduled maintenance window.',
      parameters: z.object({
        maintenanceId: z.number().describe('Maintenance ID'),
      }),
      execute: async ({ maintenanceId }) => {
        try {
          const maintenance = await ctx.scheduledMaintenance.cancelMaintenance(maintenanceId);

          return {
            success: true,
            maintenanceId: maintenance.id,
            status: maintenance.status,
            message: 'Maintenance cancelled',
          };
        } catch (error) {
          return formatError(error, 'cancelMaintenance');
        }
      },
    }),

    // === SERVICE SUBSCRIBER OPERATIONS ===
    listServiceSubscribers: tool({
      description: 'List subscribers for a service.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
      }),
      execute: async ({ serviceId }) => {
        try {
          const subscribers = await ctx.serviceSubscribers.listByService(serviceId);

          return {
            success: true,
            count: subscribers.length,
            data: subscribers.map((s: ServiceSubscriber) => ({
              email: s.email,
              name: s.name,
              notifyOnStatusChange: s.notifyOnStatusChange,
              notifyOnMaintenance: s.notifyOnMaintenance,
              subscribedAt: s.subscribedAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'listServiceSubscribers');
        }
      },
    }),

    subscribeToService: tool({
      description: 'Subscribe to service notifications.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        email: z.string().describe('Email address'),
        name: z.string().optional().describe('Subscriber name'),
        userId: z.number().optional().describe('User ID'),
        notifyOnStatusChange: z.boolean().optional().describe('Notify on status changes'),
        notifyOnMaintenance: z.boolean().optional().describe('Notify on maintenance'),
      }),
      execute: async ({ serviceId, email, name, userId, notifyOnStatusChange, notifyOnMaintenance }) => {
        try {
          const subscriber = await ctx.serviceSubscribers.subscribe({
            serviceId,
            email,
            name,
            userId,
            notifyOnStatusChange,
            notifyOnMaintenance,
          });

          return {
            success: true,
            email: subscriber.email,
            message: `Subscribed ${subscriber.email} to service notifications`,
          };
        } catch (error) {
          return formatError(error, 'subscribeToService');
        }
      },
    }),

    unsubscribeFromService: tool({
      description: 'Unsubscribe from service notifications.',
      parameters: z.object({
        serviceId: z.number().describe('Service ID'),
        email: z.string().describe('Email address'),
      }),
      execute: async ({ serviceId, email }) => {
        try {
          await ctx.serviceSubscribers.unsubscribe(serviceId, email);

          return {
            success: true,
            message: `Unsubscribed ${email} from service notifications`,
          };
        } catch (error) {
          return formatError(error, 'unsubscribeFromService');
        }
      },
    }),
  };
}
