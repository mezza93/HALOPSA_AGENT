/**
 * Agent-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Agent, AgentWorkload, Team } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

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
        try {
          const agents = isActive
            ? await ctx.agents.listActive(count || DEFAULT_COUNT)
            : await ctx.agents.list({ count: count || DEFAULT_COUNT });

          if (includeWorkload) {
            const workloads = await ctx.agents.getWorkloadStats();
            return {
              success: true,
              agents: agents.map((a: Agent) => ({
                id: a.id,
                name: a.name,
                email: a.email,
                isActive: !a.inactive,
                teams: a.teamNames,
                openTickets: workloads.find((w: AgentWorkload) => w.agentId === a.id)?.openTickets || 0,
                overdueTickets: workloads.find((w: AgentWorkload) => w.agentId === a.id)?.overdueTickets || 0,
              })),
            };
          }

          return {
            success: true,
            agents: agents.map((a: Agent) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              isActive: !a.inactive,
              teams: a.teamNames,
            })),
          };
        } catch (error) {
          return formatError(error, 'listAgents');
        }
      },
    }),

    getAgent: tool({
      description: 'Get detailed information about a specific agent.',
      parameters: z.object({
        agentId: z.number().describe('The agent ID to retrieve'),
      }),
      execute: async ({ agentId }) => {
        try {
          const agent = await ctx.agents.get(agentId);
          const workload = await ctx.agents.getAgentWorkload(agentId);

          return {
            success: true,
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
        } catch (error) {
          return formatError(error, 'getAgent');
        }
      },
    }),

    getAgentWorkload: tool({
      description: 'Get workload statistics for all agents or a specific agent.',
      parameters: z.object({
        agentId: z.number().optional().describe('Agent ID (if not provided, returns all agents)'),
      }),
      execute: async ({ agentId }) => {
        try {
          if (agentId) {
            const workload = await ctx.agents.getAgentWorkload(agentId);
            return { success: true, ...workload };
          }
          const workloads = await ctx.agents.getWorkloadStats();
          return { success: true, workloads };
        } catch (error) {
          return formatError(error, 'getAgentWorkload');
        }
      },
    }),

    listTeams: tool({
      description: 'List all teams.',
      parameters: z.object({
        isActive: z.boolean().optional().default(true).describe('Filter by active status'),
      }),
      execute: async ({ isActive }) => {
        try {
          const teams = isActive
            ? await ctx.agents.teams.listActive()
            : await ctx.agents.teams.list();

          return {
            success: true,
            teams: teams.map((t: Team) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              memberCount: t.agentCount,
              isActive: !t.inactive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTeams');
        }
      },
    }),

    getTeam: tool({
      description: 'Get detailed information about a team.',
      parameters: z.object({
        teamId: z.number().describe('The team ID to retrieve'),
      }),
      execute: async ({ teamId }) => {
        try {
          const team = await ctx.agents.teams.get(teamId);

          return {
            success: true,
            id: team.id,
            name: team.name,
            description: team.description,
            department: team.departmentName,
            isActive: !team.inactive,
            memberCount: team.agentCount,
            openTickets: team.openTicketCount,
          };
        } catch (error) {
          return formatError(error, 'getTeam');
        }
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
        try {
          const start = startDate || new Date().toISOString().split('T')[0];
          const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          try {
            const availability = await ctx.agents.getAvailability(agentId, { startDate: start, endDate: end });
            return { success: true, ...availability };
          } catch {
            // Fallback if availability API not available
            const agent = await ctx.agents.get(agentId);
            return {
              success: true,
              agentId: agent.id,
              agentName: agent.name,
              startDate: start,
              endDate: end,
              isAvailable: !agent.inactive,
              message: 'Detailed availability data not available',
            };
          }
        } catch (error) {
          return formatError(error, 'getAgentAvailability');
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
          return { success: true, events };
        } catch (error) {
          // Check if this is just a "not available" situation
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes('404') || message.includes('not found')) {
            return {
              success: true,
              agentId,
              events: [],
              message: 'Calendar data not available',
            };
          }
          return formatError(error, 'listAgentCalendar');
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
        try {
          const checkDate = date || new Date().toISOString().split('T')[0];

          try {
            const availability = await ctx.agents.teams.getAvailability(teamId, { date: checkDate });
            return { success: true, ...availability };
          } catch {
            // Fallback
            const team = await ctx.agents.teams.get(teamId);
            return {
              success: true,
              teamId: team.id,
              teamName: team.name,
              date: checkDate,
              totalAgents: team.agentCount,
              message: 'Detailed availability data not available',
            };
          }
        } catch (error) {
          return formatError(error, 'getTeamAvailability');
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
          return formatError(error, 'createAgentCalendarEvent');
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
          try {
            const available = await ctx.agents.findAvailable({
              startDateTime,
              endDateTime,
              teamId,
              skillRequired,
            });
            return {
              success: true,
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
              success: true,
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
        } catch (error) {
          return formatError(error, 'findAvailableAgents');
        }
      },
    }),
  };
}
