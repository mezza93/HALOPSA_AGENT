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

    // === CALENDAR & AVAILABILITY ===
    getAgentAvailability: tool({
      description: 'Get availability information for a specific agent.',
      parameters: z.object({
        agentId: z.number().describe('The agent ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD), defaults to today'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD), defaults to 7 days from start'),
      }),
      execute: async ({ agentId, startDate, endDate }) => {
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
          const availability = await ctx.agents.getAvailability(agentId, { startDate: start, endDate: end });
          return availability;
        } catch {
          // Fallback if availability API not available
          const agent = await ctx.agents.get(agentId);
          return {
            agentId: agent.id,
            agentName: agent.name,
            startDate: start,
            endDate: end,
            isAvailable: !agent.inactive,
            message: 'Detailed availability data not available',
          };
        }
      },
    }),

    listAgentCalendar: tool({
      description: 'List calendar events for an agent.',
      parameters: z.object({
        agentId: z.number().describe('The agent ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(50).describe('Maximum events to return'),
      }),
      execute: async ({ agentId, startDate, endDate, count }) => {
        try {
          const events = await ctx.agents.getCalendarEvents(agentId, {
            startDate,
            endDate,
            count: count || 50,
          });
          return events;
        } catch {
          return {
            agentId,
            events: [],
            message: 'Calendar data not available',
          };
        }
      },
    }),

    getTeamAvailability: tool({
      description: 'Get availability summary for all agents in a team.',
      parameters: z.object({
        teamId: z.number().describe('The team ID'),
        date: z.string().optional().describe('Date to check (YYYY-MM-DD), defaults to today'),
      }),
      execute: async ({ teamId, date }) => {
        const checkDate = date || new Date().toISOString().split('T')[0];

        try {
          const availability = await ctx.agents.teams.getAvailability(teamId, { date: checkDate });
          return availability;
        } catch {
          // Fallback
          const team = await ctx.agents.teams.get(teamId);
          return {
            teamId: team.id,
            teamName: team.name,
            date: checkDate,
            totalAgents: team.agentCount,
            message: 'Detailed availability data not available',
          };
        }
      },
    }),

    createAgentCalendarEvent: tool({
      description: 'Create a calendar event for an agent.',
      parameters: z.object({
        agentId: z.number().describe('The agent ID'),
        title: z.string().describe('Event title'),
        startDateTime: z.string().describe('Start date/time (ISO format)'),
        endDateTime: z.string().describe('End date/time (ISO format)'),
        eventType: z.enum(['appointment', 'meeting', 'leave', 'training', 'other']).optional().describe('Type of event'),
        description: z.string().optional().describe('Event description'),
        isAllDay: z.boolean().optional().default(false).describe('All day event'),
      }),
      execute: async ({ agentId, title, startDateTime, endDateTime, eventType, description, isAllDay }) => {
        try {
          const event = await ctx.agents.createCalendarEvent(agentId, {
            title,
            startDateTime,
            endDateTime,
            eventType: eventType || 'other',
            description,
            isAllDay,
          });
          return {
            success: true,
            eventId: event.id,
            title: event.title,
            message: `Calendar event '${title}' created for agent`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create calendar event',
          };
        }
      },
    }),

    findAvailableAgents: tool({
      description: 'Find agents available during a specific time slot.',
      parameters: z.object({
        startDateTime: z.string().describe('Start date/time (ISO format)'),
        endDateTime: z.string().describe('End date/time (ISO format)'),
        teamId: z.number().optional().describe('Filter by team ID'),
        skillRequired: z.string().optional().describe('Required skill/specialty'),
      }),
      execute: async ({ startDateTime, endDateTime, teamId, skillRequired }) => {
        try {
          const available = await ctx.agents.findAvailable({
            startDateTime,
            endDateTime,
            teamId,
            skillRequired,
          });
          return {
            startDateTime,
            endDateTime,
            availableAgents: available,
          };
        } catch {
          // Fallback: return active agents
          const agents = teamId
            ? await ctx.agents.listByTeam(teamId)
            : await ctx.agents.listActive(100);

          return {
            startDateTime,
            endDateTime,
            availableAgents: agents.map((a: Agent) => ({
              id: a.id,
              name: a.name,
              email: a.email,
            })),
            message: 'Showing active agents (availability API not available)',
          };
        }
      },
    }),
  };
}
