/**
 * Release Management AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Release, ReleaseType, ReleasePipeline, ReleasePipelineStage } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createReleaseTools(ctx: HaloContext) {
  return {
    // === RELEASE OPERATIONS ===
    listReleases: tool({
      description: 'List releases with optional filters.',
      parameters: z.object({
        status: z.enum(['draft', 'planning', 'scheduled', 'in_progress', 'deployed', 'completed', 'cancelled', 'rolled_back']).optional().describe('Filter by status'),
        risk: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Filter by risk level'),
        typeId: z.number().optional().describe('Filter by release type'),
        pipelineId: z.number().optional().describe('Filter by pipeline'),
        ownerId: z.number().optional().describe('Filter by owner'),
        teamId: z.number().optional().describe('Filter by team'),
        clientId: z.number().optional().describe('Filter by client'),
        cabRequired: z.boolean().optional().describe('Filter by CAB requirement'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ status, risk, typeId, pipelineId, ownerId, teamId, clientId, cabRequired, startDate, endDate, count }) => {
        try {
          const releases = await ctx.releases.listFiltered({
            status,
            risk,
            typeId,
            pipelineId,
            ownerId,
            teamId,
            clientId,
            cabRequired,
            startDate,
            endDate,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: releases.length,
            data: releases.map((r: Release) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              status: r.status,
              risk: r.risk,
              type: r.typeName,
              stage: r.stageName,
              owner: r.ownerName,
              plannedStart: r.plannedStartDate,
              plannedEnd: r.plannedEndDate,
              cabRequired: r.cabRequired,
              cabApproved: r.cabApproved,
              ticketCount: r.ticketCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listReleases');
        }
      },
    }),

    getRelease: tool({
      description: 'Get detailed information about a release.',
      parameters: z.object({
        releaseId: z.number().describe('The release ID'),
      }),
      execute: async ({ releaseId }) => {
        try {
          const r = await ctx.releases.get(releaseId);
          return {
            success: true,
            id: r.id,
            name: r.name,
            description: r.description,
            version: r.version,
            status: r.status,
            risk: r.risk,
            type: r.typeName,
            pipeline: r.pipelineName,
            stage: r.stageName,
            owner: r.ownerName,
            team: r.teamName,
            client: r.clientName,
            plannedStart: r.plannedStartDate,
            plannedEnd: r.plannedEndDate,
            actualStart: r.actualStartDate,
            actualEnd: r.actualEndDate,
            cabRequired: r.cabRequired,
            cabApproved: r.cabApproved,
            cabApprovedAt: r.cabApprovedAt,
            cabNotes: r.cabNotes,
            ticketIds: r.ticketIds,
            ticketCount: r.ticketCount,
            rollbackPlan: r.rollbackPlan,
            testPlan: r.testPlan,
            deploymentNotes: r.deploymentNotes,
            impactAssessment: r.impactAssessment,
          };
        } catch (error) {
          return formatError(error, 'getRelease');
        }
      },
    }),

    createRelease: tool({
      description: 'Create a new release.',
      parameters: z.object({
        name: z.string().describe('Release name'),
        description: z.string().optional().describe('Release description'),
        version: z.string().optional().describe('Version number'),
        typeId: z.number().optional().describe('Release type ID'),
        pipelineId: z.number().optional().describe('Pipeline ID'),
        risk: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Risk level'),
        plannedStartDate: z.string().optional().describe('Planned start date'),
        plannedEndDate: z.string().optional().describe('Planned end date'),
        ownerId: z.number().optional().describe('Owner agent ID'),
        teamId: z.number().optional().describe('Team ID'),
        clientId: z.number().optional().describe('Client ID'),
        ticketIds: z.array(z.number()).optional().describe('Ticket IDs to include'),
        cabRequired: z.boolean().optional().describe('Whether CAB approval is required'),
        rollbackPlan: z.string().optional().describe('Rollback plan'),
        testPlan: z.string().optional().describe('Test plan'),
      }),
      execute: async ({ name, description, version, typeId, pipelineId, risk, plannedStartDate, plannedEndDate, ownerId, teamId, clientId, ticketIds, cabRequired, rollbackPlan, testPlan }) => {
        try {
          const release = await ctx.releases.createRelease({
            name,
            description,
            version,
            typeId,
            pipelineId,
            risk,
            plannedStartDate,
            plannedEndDate,
            ownerId,
            teamId,
            clientId,
            ticketIds,
            cabRequired,
            rollbackPlan,
            testPlan,
          });

          return {
            success: true,
            releaseId: release.id,
            name: release.name,
            status: release.status,
            message: `Release "${release.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createRelease');
        }
      },
    }),

    updateReleaseStatus: tool({
      description: 'Update a release status.',
      parameters: z.object({
        releaseId: z.number().describe('Release ID'),
        status: z.enum(['draft', 'planning', 'scheduled', 'in_progress', 'deployed', 'completed', 'cancelled', 'rolled_back']).describe('New status'),
      }),
      execute: async ({ releaseId, status }) => {
        try {
          const release = await ctx.releases.updateStatus(releaseId, status);

          return {
            success: true,
            releaseId: release.id,
            name: release.name,
            status: release.status,
            message: `Release status updated to ${status}`,
          };
        } catch (error) {
          return formatError(error, 'updateReleaseStatus');
        }
      },
    }),

    advanceReleaseStage: tool({
      description: 'Move a release to the next pipeline stage.',
      parameters: z.object({
        releaseId: z.number().describe('Release ID'),
        nextStageId: z.number().describe('Next stage ID'),
      }),
      execute: async ({ releaseId, nextStageId }) => {
        try {
          const release = await ctx.releases.advanceStage(releaseId, nextStageId);

          return {
            success: true,
            releaseId: release.id,
            name: release.name,
            stage: release.stageName,
            message: `Release advanced to stage "${release.stageName}"`,
          };
        } catch (error) {
          return formatError(error, 'advanceReleaseStage');
        }
      },
    }),

    setCABApproval: tool({
      description: 'Set CAB approval status for a release.',
      parameters: z.object({
        releaseId: z.number().describe('Release ID'),
        approved: z.boolean().describe('Whether CAB approved'),
        notes: z.string().optional().describe('CAB notes'),
      }),
      execute: async ({ releaseId, approved, notes }) => {
        try {
          const release = await ctx.releases.setCABApproval(releaseId, approved, notes);

          return {
            success: true,
            releaseId: release.id,
            name: release.name,
            cabApproved: release.cabApproved,
            message: approved ? 'Release approved by CAB' : 'Release not approved by CAB',
          };
        } catch (error) {
          return formatError(error, 'setCABApproval');
        }
      },
    }),

    addTicketsToRelease: tool({
      description: 'Add tickets to a release.',
      parameters: z.object({
        releaseId: z.number().describe('Release ID'),
        ticketIds: z.array(z.number()).describe('Ticket IDs to add'),
      }),
      execute: async ({ releaseId, ticketIds }) => {
        try {
          const release = await ctx.releases.addTickets(releaseId, ticketIds);

          return {
            success: true,
            releaseId: release.id,
            ticketCount: release.ticketIds?.length || 0,
            message: `Added ${ticketIds.length} tickets to release`,
          };
        } catch (error) {
          return formatError(error, 'addTicketsToRelease');
        }
      },
    }),

    removeTicketsFromRelease: tool({
      description: 'Remove tickets from a release.',
      parameters: z.object({
        releaseId: z.number().describe('Release ID'),
        ticketIds: z.array(z.number()).describe('Ticket IDs to remove'),
      }),
      execute: async ({ releaseId, ticketIds }) => {
        try {
          const release = await ctx.releases.removeTickets(releaseId, ticketIds);

          return {
            success: true,
            releaseId: release.id,
            ticketCount: release.ticketIds?.length || 0,
            message: `Removed ${ticketIds.length} tickets from release`,
          };
        } catch (error) {
          return formatError(error, 'removeTicketsFromRelease');
        }
      },
    }),

    getReleasesRequiringCAB: tool({
      description: 'Get releases that require CAB approval but are not yet approved.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const releases = await ctx.releases.listRequiringCAB();

          return {
            success: true,
            count: releases.length,
            data: releases.map((r: Release) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              status: r.status,
              risk: r.risk,
              plannedStart: r.plannedStartDate,
              owner: r.ownerName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getReleasesRequiringCAB');
        }
      },
    }),

    getHighRiskReleases: tool({
      description: 'Get high and critical risk releases.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const releases = await ctx.releases.listHighRisk();

          return {
            success: true,
            count: releases.length,
            data: releases.map((r: Release) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              status: r.status,
              risk: r.risk,
              plannedStart: r.plannedStartDate,
              owner: r.ownerName,
              rollbackPlan: r.rollbackPlan ? 'Yes' : 'No',
            })),
          };
        } catch (error) {
          return formatError(error, 'getHighRiskReleases');
        }
      },
    }),

    getReleaseCalendar: tool({
      description: 'Get release calendar view for a date range.',
      parameters: z.object({
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ startDate, endDate }) => {
        try {
          const calendar = await ctx.releases.getCalendar(startDate, endDate);

          return {
            success: true,
            startDate: calendar.startDate,
            endDate: calendar.endDate,
            releaseCount: calendar.releases.length,
            byStatus: calendar.byStatus,
            byRisk: calendar.byRisk,
            releases: calendar.releases.map((r: Release) => ({
              id: r.id,
              name: r.name,
              status: r.status,
              risk: r.risk,
              plannedStart: r.plannedStartDate,
              plannedEnd: r.plannedEndDate,
            })),
          };
        } catch (error) {
          return formatError(error, 'getReleaseCalendar');
        }
      },
    }),

    searchReleases: tool({
      description: 'Search releases by name or description.',
      parameters: z.object({
        query: z.string().describe('Search query'),
      }),
      execute: async ({ query }) => {
        try {
          const releases = await ctx.releases.search(query);

          return {
            success: true,
            count: releases.length,
            data: releases.map((r: Release) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              status: r.status,
              risk: r.risk,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchReleases');
        }
      },
    }),

    // === RELEASE TYPE OPERATIONS ===
    listReleaseTypes: tool({
      description: 'List release types.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active types'),
      }),
      execute: async ({ activeOnly }) => {
        try {
          const types = activeOnly
            ? await ctx.releaseTypes.listActive()
            : await ctx.releaseTypes.list();

          return {
            success: true,
            count: types.length,
            data: types.map((t: ReleaseType) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              color: t.color,
              defaultRisk: t.defaultRisk,
              cabRequired: t.cabRequired,
            })),
          };
        } catch (error) {
          return formatError(error, 'listReleaseTypes');
        }
      },
    }),

    // === PIPELINE OPERATIONS ===
    listReleasePipelines: tool({
      description: 'List release pipelines.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active pipelines'),
      }),
      execute: async ({ activeOnly }) => {
        try {
          const pipelines = activeOnly
            ? await ctx.releasePipelines.listActive()
            : await ctx.releasePipelines.list();

          return {
            success: true,
            count: pipelines.length,
            data: pipelines.map((p: ReleasePipeline) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              stageCount: p.stages?.length || 0,
            })),
          };
        } catch (error) {
          return formatError(error, 'listReleasePipelines');
        }
      },
    }),

    getPipelineWithStages: tool({
      description: 'Get a release pipeline with its stages.',
      parameters: z.object({
        pipelineId: z.number().describe('Pipeline ID'),
      }),
      execute: async ({ pipelineId }) => {
        try {
          const pipeline = await ctx.releasePipelines.getWithStages(pipelineId);

          return {
            success: true,
            id: pipeline.id,
            name: pipeline.name,
            description: pipeline.description,
            isActive: pipeline.isActive,
            stages: pipeline.stages.map((s: ReleasePipelineStage) => ({
              id: s.id,
              name: s.name,
              order: s.order,
              color: s.color,
              requiresApproval: s.requiresApproval,
              isFinal: s.isFinal,
              isDeployStage: s.isDeployStage,
            })),
          };
        } catch (error) {
          return formatError(error, 'getPipelineWithStages');
        }
      },
    }),

    createReleasePipeline: tool({
      description: 'Create a new release pipeline.',
      parameters: z.object({
        name: z.string().describe('Pipeline name'),
        description: z.string().optional().describe('Pipeline description'),
        stages: z.array(z.object({
          name: z.string().describe('Stage name'),
          order: z.number().describe('Stage order'),
          color: z.string().optional().describe('Stage color'),
          requiresApproval: z.boolean().optional().describe('Requires approval'),
          isFinal: z.boolean().optional().describe('Is final stage'),
          isDeployStage: z.boolean().optional().describe('Is deployment stage'),
        })).optional().describe('Pipeline stages'),
      }),
      execute: async ({ name, description, stages }) => {
        try {
          const pipeline = await ctx.releasePipelines.createPipeline({
            name,
            description,
            stages,
          });

          return {
            success: true,
            pipelineId: pipeline.id,
            name: pipeline.name,
            stageCount: pipeline.stages?.length || 0,
            message: `Pipeline "${pipeline.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createReleasePipeline');
        }
      },
    }),

    listPipelineStages: tool({
      description: 'List stages for a pipeline.',
      parameters: z.object({
        pipelineId: z.number().describe('Pipeline ID'),
      }),
      execute: async ({ pipelineId }) => {
        try {
          const stages = await ctx.releasePipelineStages.listByPipeline(pipelineId);

          return {
            success: true,
            count: stages.length,
            data: stages.map((s: ReleasePipelineStage) => ({
              id: s.id,
              name: s.name,
              order: s.order,
              color: s.color,
              requiresApproval: s.requiresApproval,
              isFinal: s.isFinal,
              isDeployStage: s.isDeployStage,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPipelineStages');
        }
      },
    }),
  };
}
