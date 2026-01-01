/**
 * Opportunity/Sales pipeline AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Opportunity, PipelineStage } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createOpportunityTools(ctx: HaloContext) {
  return {
    // === OPPORTUNITY OPERATIONS ===
    listOpportunities: tool({
      description: 'List sales opportunities/deals with optional filters. Use this to view the sales pipeline.',
      parameters: z.object({
        status: z.enum(['open', 'won', 'lost', 'all']).optional().default('open').describe('Filter by opportunity status'),
        agentId: z.number().optional().describe('Filter by sales agent ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        stageId: z.number().optional().describe('Filter by pipeline stage ID'),
        search: z.string().optional().describe('Search by opportunity name'),
        startDate: z.string().optional().describe('Filter by date range start (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('Filter by date range end (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ status, agentId, clientId, stageId, search, startDate, endDate, count }) => {
        try {
          const opportunities = await ctx.opportunities.listFiltered({
            status: status === 'all' ? undefined : status,
            agentId,
            clientId,
            stageId,
            search,
            startDate,
            endDate,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: opportunities.length,
            data: opportunities.map((o: Opportunity) => ({
              id: o.id,
              name: o.name,
              client: o.clientName,
              value: o.value,
              probability: o.probability,
              weightedValue: o.weightedValue,
              stage: o.stageName,
              status: o.status,
              expectedClose: o.expectedCloseDate,
              agent: o.agentName,
            })),
          };
        } catch (error) {
          return formatError(error, 'listOpportunities');
        }
      },
    }),

    getOpportunity: tool({
      description: 'Get detailed information about a specific sales opportunity.',
      parameters: z.object({
        opportunityId: z.number().describe('The opportunity ID'),
      }),
      execute: async ({ opportunityId }) => {
        try {
          const opp = await ctx.opportunities.get(opportunityId);
          return {
            success: true,
            id: opp.id,
            name: opp.name,
            client: opp.clientName,
            clientId: opp.clientId,
            value: opp.value,
            probability: opp.probability,
            weightedValue: opp.weightedValue,
            stage: opp.stageName,
            stageId: opp.stageId,
            status: opp.status,
            expectedCloseDate: opp.expectedCloseDate,
            actualCloseDate: opp.actualCloseDate,
            agent: opp.agentName,
            agentId: opp.agentId,
            description: opp.description,
            isWon: opp.isWon,
            isLost: opp.isLost,
            lossReason: opp.lossReason,
            source: opp.sourceName,
            competitor: opp.competitorName,
            createdAt: opp.createdAt,
          };
        } catch (error) {
          return formatError(error, 'getOpportunity');
        }
      },
    }),

    createOpportunity: tool({
      description: 'Create a new sales opportunity in the pipeline.',
      parameters: z.object({
        name: z.string().describe('Opportunity name/title'),
        clientId: z.number().describe('Client ID'),
        value: z.number().optional().describe('Deal value'),
        probability: z.number().min(0).max(100).optional().describe('Win probability (0-100)'),
        stageId: z.number().optional().describe('Pipeline stage ID'),
        expectedCloseDate: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
        description: z.string().optional().describe('Opportunity description'),
        agentId: z.number().optional().describe('Assigned sales agent ID'),
        sourceId: z.number().optional().describe('Lead source ID'),
      }),
      execute: async ({ name, clientId, value, probability, stageId, expectedCloseDate, description, agentId, sourceId }) => {
        try {
          const oppData: Record<string, unknown> = {
            name,
            client_id: clientId,
          };

          if (value !== undefined) oppData.value = value;
          if (probability !== undefined) oppData.probability = probability;
          if (stageId !== undefined) oppData.stage_id = stageId;
          if (expectedCloseDate) oppData.expected_close_date = expectedCloseDate;
          if (description) oppData.description = description;
          if (agentId !== undefined) oppData.agent_id = agentId;
          if (sourceId !== undefined) oppData.source_id = sourceId;

          const opps = await ctx.opportunities.create([oppData]);
          if (opps && opps.length > 0) {
            return {
              success: true,
              opportunityId: opps[0].id,
              name: opps[0].name,
              message: `Opportunity "${opps[0].name}" created successfully`,
            };
          }
          return { success: false, error: 'Failed to create opportunity' };
        } catch (error) {
          return formatError(error, 'createOpportunity');
        }
      },
    }),

    updateOpportunity: tool({
      description: 'Update an existing sales opportunity.',
      parameters: z.object({
        opportunityId: z.number().describe('The opportunity ID'),
        name: z.string().optional().describe('New name'),
        value: z.number().optional().describe('New deal value'),
        probability: z.number().min(0).max(100).optional().describe('New win probability'),
        expectedCloseDate: z.string().optional().describe('New expected close date'),
        description: z.string().optional().describe('New description'),
        agentId: z.number().optional().describe('New assigned agent ID'),
      }),
      execute: async ({ opportunityId, name, value, probability, expectedCloseDate, description, agentId }) => {
        try {
          const updateData: Record<string, unknown> = { id: opportunityId };

          if (name !== undefined) updateData.name = name;
          if (value !== undefined) updateData.value = value;
          if (probability !== undefined) updateData.probability = probability;
          if (expectedCloseDate !== undefined) updateData.expected_close_date = expectedCloseDate;
          if (description !== undefined) updateData.description = description;
          if (agentId !== undefined) updateData.agent_id = agentId;

          const opps = await ctx.opportunities.update([updateData]);
          if (opps && opps.length > 0) {
            return {
              success: true,
              opportunityId: opps[0].id,
              name: opps[0].name,
              message: 'Opportunity updated successfully',
            };
          }
          return { success: false, error: 'Failed to update opportunity' };
        } catch (error) {
          return formatError(error, 'updateOpportunity');
        }
      },
    }),

    moveOpportunityStage: tool({
      description: 'Move an opportunity to a different pipeline stage.',
      parameters: z.object({
        opportunityId: z.number().describe('The opportunity ID'),
        stageId: z.number().describe('The new stage ID'),
        note: z.string().optional().describe('Note about the stage change'),
      }),
      execute: async ({ opportunityId, stageId, note }) => {
        try {
          const opp = await ctx.opportunities.moveToStage(opportunityId, stageId, note);
          return {
            success: true,
            opportunityId: opp.id,
            newStage: opp.stageName,
            message: `Opportunity moved to stage "${opp.stageName}"`,
          };
        } catch (error) {
          return formatError(error, 'moveOpportunityStage');
        }
      },
    }),

    closeOpportunity: tool({
      description: 'Close an opportunity as won or lost.',
      parameters: z.object({
        opportunityId: z.number().describe('The opportunity ID'),
        outcome: z.enum(['won', 'lost']).describe('Whether the deal was won or lost'),
        note: z.string().optional().describe('Closing note'),
        lossReason: z.string().optional().describe('Reason for loss (if lost)'),
        competitorId: z.number().optional().describe('Competitor who won (if lost)'),
        value: z.number().optional().describe('Final deal value (if won)'),
      }),
      execute: async ({ opportunityId, outcome, note, lossReason, competitorId, value }) => {
        try {
          let opp;
          if (outcome === 'won') {
            opp = await ctx.opportunities.markAsWon(opportunityId, {
              closingNote: note,
              value,
            });
          } else {
            opp = await ctx.opportunities.markAsLost(opportunityId, {
              lossReason,
              closingNote: note,
              competitorId,
            });
          }

          return {
            success: true,
            opportunityId: opp.id,
            status: opp.status,
            message: outcome === 'won'
              ? `Congratulations! Opportunity "${opp.name}" marked as won`
              : `Opportunity "${opp.name}" marked as lost`,
          };
        } catch (error) {
          return formatError(error, 'closeOpportunity');
        }
      },
    }),

    reopenOpportunity: tool({
      description: 'Reopen a closed opportunity.',
      parameters: z.object({
        opportunityId: z.number().describe('The opportunity ID to reopen'),
      }),
      execute: async ({ opportunityId }) => {
        try {
          const opp = await ctx.opportunities.reopen(opportunityId);
          return {
            success: true,
            opportunityId: opp.id,
            status: opp.status,
            message: `Opportunity "${opp.name}" has been reopened`,
          };
        } catch (error) {
          return formatError(error, 'reopenOpportunity');
        }
      },
    }),

    getPipelineStats: tool({
      description: 'Get sales pipeline statistics and forecast data.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        startDate: z.string().optional().describe('Start date for period (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date for period (YYYY-MM-DD)'),
      }),
      execute: async ({ agentId, startDate, endDate }) => {
        try {
          const stats = await ctx.opportunities.getPipelineStats({ agentId, startDate, endDate });
          return {
            success: true,
            totalOpportunities: stats.totalOpportunities,
            openOpportunities: stats.openOpportunities,
            totalValue: stats.totalValue,
            weightedValue: stats.weightedValue,
            wonThisPeriod: stats.wonThisPeriod,
            wonValue: stats.wonValue,
            lostThisPeriod: stats.lostThisPeriod,
            lostValue: stats.lostValue,
            winRate: stats.winRate,
            averageDealSize: stats.averageDealSize,
            byStage: stats.byStage,
          };
        } catch (error) {
          return formatError(error, 'getPipelineStats');
        }
      },
    }),

    // === PIPELINE STAGE OPERATIONS ===
    listPipelineStages: tool({
      description: 'List all available pipeline stages for opportunities.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const stages = await ctx.pipelineStages.listOrdered();
          return {
            success: true,
            data: stages.map((s: PipelineStage) => ({
              id: s.id,
              name: s.name,
              order: s.order,
              probability: s.probability,
              isDefault: s.isDefault,
              isWon: s.isWon,
              isLost: s.isLost,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPipelineStages');
        }
      },
    }),
  };
}
