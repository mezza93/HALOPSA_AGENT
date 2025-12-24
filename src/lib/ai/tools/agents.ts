/**
 * Agent-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Agent, AgentWorkload, Team } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 50;

export function createAgentTools(ctx: HaloContext) {
  return {
    listAgents: tool({
      description: 'List agents/technicians and optionally include their workload.',
      parameters: z.object({
        includeWorkload: z.boolean().optional().default(true).describe('Include ticket counts per agent'),
        isActive: z.boolean().optional().default(true).describe('Filter by active status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ includeWorkload, isActive, count }) => {
        const agents = isActive
          ? await ctx.agents.listActive(count || DEFAULT_COUNT)
          : await ctx.agents.list({ count: count || DEFAULT_COUNT });

        if (includeWorkload) {
          const workloads = await ctx.agents.getWorkloadStats();
          return agents.map((a: Agent) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            isActive: !a.inactive,
            teams: a.teamNames,
            openTickets: workloads.find((w: AgentWorkload) => w.agentId === a.id)?.openTickets || 0,
            overdueTickets: workloads.find((w: AgentWorkload) => w.agentId === a.id)?.overdueTickets || 0,
          }));
        }

        return agents.map((a: Agent) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          isActive: !a.inactive,
          teams: a.teamNames,
        }));
      },
    }),

    getAgent: tool({
      description: 'Get detailed information about a specific agent.',
      parameters: z.object({
        agentId: z.number().describe('The agent ID to retrieve'),
      }),
      execute: async ({ agentId }) => {
        const agent = await ctx.agents.get(agentId);
        const workload = await ctx.agents.getAgentWorkload(agentId);

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phoneNumber,
          mobile: agent.mobileNumber,
          isActive: !agent.inactive,
          teams: agent.teamNames,
          role: agent.role,
          department: agent.departmentName,
          workload: {
            openTickets: workload.openTickets,
            overdueTickets: workload.overdueTickets,
            ticketsClosedToday: workload.ticketsClosedToday,
            ticketsClosedThisWeek: workload.ticketsClosedThisWeek,
          },
        };
      },
    }),

    getAgentWorkload: tool({
      description: 'Get workload statistics for all agents or a specific agent.',
      parameters: z.object({
        agentId: z.number().optional().describe('Agent ID (if not provided, returns all agents)'),
      }),
      execute: async ({ agentId }) => {
        if (agentId) {
          return ctx.agents.getAgentWorkload(agentId);
        }
        return ctx.agents.getWorkloadStats();
      },
    }),

    listTeams: tool({
      description: 'List all teams.',
      parameters: z.object({
        isActive: z.boolean().optional().default(true).describe('Filter by active status'),
      }),
      execute: async ({ isActive }) => {
        const teams = isActive
          ? await ctx.agents.teams.listActive()
          : await ctx.agents.teams.list();

        return teams.map((t: Team) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          memberCount: t.agentCount,
          isActive: !t.inactive,
        }));
      },
    }),

    getTeam: tool({
      description: 'Get detailed information about a team.',
      parameters: z.object({
        teamId: z.number().describe('The team ID to retrieve'),
      }),
      execute: async ({ teamId }) => {
        const team = await ctx.agents.teams.get(teamId);

        return {
          id: team.id,
          name: team.name,
          description: team.description,
          department: team.departmentName,
          isActive: !team.inactive,
          memberCount: team.agentCount,
          openTickets: team.openTicketCount,
        };
      },
    }),
  };
}
