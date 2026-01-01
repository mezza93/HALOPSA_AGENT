// @ts-nocheck - Vitest tool execute() returns union types that require verbose narrowing
/**
 * Comprehensive tests for Agent AI Tools.
 *
 * Note: TypeScript checking disabled because:
 * 1. Vitest tool execute() returns union types (success | error)
 * 2. Tests verify runtime behavior which is correct
 * 3. Type narrowing would add unnecessary verbosity to tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgentTools } from '@/lib/ai/tools/agents';
import {
  createMockHaloContext,
  createAgent,
  createAgentWorkload,
  createTeam,
  resetFactoryIds,
} from '../../../../mocks/factories';
import type { HaloContext } from '@/lib/ai/tools/context';

// Helper types for tool results (avoids union type issues in tests)
type SuccessResult = Record<string, unknown> & { success: true };
type ErrorResult = { success: false; error: string };

describe('Agent AI Tools', () => {
  let ctx: ReturnType<typeof createMockHaloContext>;
  let tools: ReturnType<typeof createAgentTools>;

  beforeEach(() => {
    resetFactoryIds();
    ctx = createMockHaloContext();
    tools = createAgentTools(ctx as unknown as HaloContext);
  });

  // === AGENT OPERATIONS ===

  describe('listAgents', () => {
    it('should list active agents with workload by default', async () => {
      const result = await tools.listAgents.execute(
        { isActive: true, includeWorkload: true, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect('agents' in result && result.agents).toBeDefined();
      expect(ctx.agents.listActive).toHaveBeenCalled();
      expect(ctx.agents.getWorkloadStats).toHaveBeenCalled();
    });

    it('should list all agents when isActive is false', async () => {
      const result = await tools.listAgents.execute(
        { isActive: false, includeWorkload: false, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.list).toHaveBeenCalled();
    });

    it('should not include workload when includeWorkload is false', async () => {
      const result = await tools.listAgents.execute(
        { isActive: true, includeWorkload: false, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.getWorkloadStats).not.toHaveBeenCalled();
    });

    it('should include workload data in response', async () => {
      const result = await tools.listAgents.execute(
        { isActive: true, includeWorkload: true, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      if (result.success && 'agents' in result) {
        expect(result.agents[0]).toHaveProperty('id');
        expect(result.agents[0]).toHaveProperty('name');
        expect(result.agents[0]).toHaveProperty('email');
        expect(result.agents[0]).toHaveProperty('isActive');
        expect(result.agents[0]).toHaveProperty('openTickets');
        expect(result.agents[0]).toHaveProperty('overdueTickets');
      }
    });
  });

  describe('getAgent', () => {
    it('should get a specific agent with workload', async () => {
      const result = await tools.getAgent.execute(
        { agentId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(ctx.agents.get).toHaveBeenCalledWith(1);
      expect(ctx.agents.getAgentWorkload).toHaveBeenCalledWith(1);
    });

    it('should include all agent details', async () => {
      const result = await tools.getAgent.execute(
        { agentId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('teams');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('workload');
    });

    it('should include workload details', async () => {
      const result = await tools.getAgent.execute(
        { agentId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect((result.workload as Record<string, unknown>)).toHaveProperty('openTickets');
      expect((result.workload as Record<string, unknown>)).toHaveProperty('overdueTickets');
      expect((result.workload as Record<string, unknown>)).toHaveProperty('ticketsClosedToday');
      expect((result.workload as Record<string, unknown>)).toHaveProperty('ticketsClosedThisWeek');
    });
  });

  describe('getAgentWorkload', () => {
    it('should get workload for a specific agent', async () => {
      const result = await tools.getAgentWorkload.execute(
        { agentId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.getAgentWorkload).toHaveBeenCalledWith(1);
    });

    it('should get workload for all agents when no agentId provided', async () => {
      const result = await tools.getAgentWorkload.execute(
        {},
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.workloads).toBeDefined();
      expect(ctx.agents.getWorkloadStats).toHaveBeenCalled();
    });
  });

  // === TEAM OPERATIONS ===

  describe('listTeams', () => {
    it('should list active teams by default', async () => {
      const result = await tools.listTeams.execute(
        { isActive: true },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.teams).toBeDefined();
      expect(ctx.agents.teams.listActive).toHaveBeenCalled();
    });

    it('should list all teams when isActive is false', async () => {
      const result = await tools.listTeams.execute(
        { isActive: false },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.teams.list).toHaveBeenCalled();
    });

    it('should include team details', async () => {
      const result = await tools.listTeams.execute(
        { isActive: true },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect((result.teams as unknown[])[0]).toHaveProperty('id');
      expect((result.teams as unknown[])[0]).toHaveProperty('name');
      expect((result.teams as unknown[])[0]).toHaveProperty('description');
      expect((result.teams as unknown[])[0]).toHaveProperty('memberCount');
      expect((result.teams as unknown[])[0]).toHaveProperty('isActive');
    });
  });

  describe('getTeam', () => {
    it('should get a specific team', async () => {
      const result = await tools.getTeam.execute(
        { teamId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(ctx.agents.teams.get).toHaveBeenCalledWith(1);
    });

    it('should include all team details', async () => {
      const result = await tools.getTeam.execute(
        { teamId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('department');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('memberCount');
      expect(result).toHaveProperty('openTickets');
    });
  });

  // === CALENDAR & AVAILABILITY ===

  describe('getAgentAvailability', () => {
    it('should get agent availability', async () => {
      const result = await tools.getAgentAvailability.execute(
        { agentId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.agentId).toBe(1);
    });

    it('should use provided date range', async () => {
      const result = await tools.getAgentAvailability.execute(
        { agentId: 1, startDate: '2024-01-15', endDate: '2024-01-22' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.getAvailability).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ startDate: '2024-01-15', endDate: '2024-01-22' })
      );
    });

    it('should handle unavailable API gracefully', async () => {
      ctx.agents.getAvailability.mockRejectedValueOnce(new Error('API not available'));

      const result = await tools.getAgentAvailability.execute(
        { agentId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('not available');
    });
  });

  describe('listAgentCalendar', () => {
    it('should list calendar events', async () => {
      const result = await tools.listAgentCalendar.execute(
        { agentId: 1, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.events).toBeDefined();
      expect(ctx.agents.getCalendarEvents).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const result = await tools.listAgentCalendar.execute(
        { agentId: 1, count: 50, startDate: '2024-01-01', endDate: '2024-01-31' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.getCalendarEvents).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ startDate: '2024-01-01', endDate: '2024-01-31' })
      );
    });

    it('should handle 404 errors gracefully', async () => {
      ctx.agents.getCalendarEvents.mockRejectedValueOnce(new Error('404 not found'));

      const result = await tools.listAgentCalendar.execute(
        { agentId: 1, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.events).toEqual([]);
      expect(result.message).toContain('not available');
    });
  });

  describe('getTeamAvailability', () => {
    it('should get team availability', async () => {
      const result = await tools.getTeamAvailability.execute(
        { teamId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.teamId).toBe(1);
    });

    it('should use provided date', async () => {
      const result = await tools.getTeamAvailability.execute(
        { teamId: 1, date: '2024-01-15' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.teams.getAvailability).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ date: '2024-01-15' })
      );
    });

    it('should handle unavailable API gracefully', async () => {
      ctx.agents.teams.getAvailability.mockRejectedValueOnce(new Error('API not available'));

      const result = await tools.getTeamAvailability.execute(
        { teamId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('not available');
    });
  });

  describe('createAgentCalendarEvent', () => {
    it('should create a calendar event', async () => {
      const result = await tools.createAgentCalendarEvent.execute(
        {
          agentId: 1,
          title: 'Team Meeting',
          startDateTime: '2024-01-15T10:00:00Z',
          endDateTime: '2024-01-15T11:00:00Z',
          isAllDay: false,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.title).toBe('Team Meeting');
      expect(ctx.agents.createCalendarEvent).toHaveBeenCalled();
    });

    it('should create event with all options', async () => {
      const result = await tools.createAgentCalendarEvent.execute(
        {
          agentId: 1,
          title: 'Training Session',
          startDateTime: '2024-01-15T09:00:00Z',
          endDateTime: '2024-01-15T17:00:00Z',
          eventType: 'training',
          description: 'Annual training',
          isAllDay: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.createCalendarEvent).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Training Session',
          eventType: 'training',
          description: 'Annual training',
          isAllDay: true,
        })
      );
    });
  });

  describe('findAvailableAgents', () => {
    it('should find available agents', async () => {
      const result = await tools.findAvailableAgents.execute(
        {
          startDateTime: '2024-01-15T10:00:00Z',
          endDateTime: '2024-01-15T11:00:00Z',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.availableAgents).toBeDefined();
      expect(ctx.agents.findAvailable).toHaveBeenCalled();
    });

    it('should filter by team', async () => {
      const result = await tools.findAvailableAgents.execute(
        {
          startDateTime: '2024-01-15T10:00:00Z',
          endDateTime: '2024-01-15T11:00:00Z',
          teamId: 1,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.agents.findAvailable).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: 1 })
      );
    });

    it('should handle unavailable API gracefully', async () => {
      ctx.agents.findAvailable.mockRejectedValueOnce(new Error('API not available'));

      const result = await tools.findAvailableAgents.execute(
        {
          startDateTime: '2024-01-15T10:00:00Z',
          endDateTime: '2024-01-15T11:00:00Z',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.availableAgents).toBeDefined();
      expect(result.message).toContain('availability API not available');
    });
  });

  // === ERROR HANDLING ===

  describe('Error Handling', () => {
    it('should handle agent list errors', async () => {
      ctx.agents.listActive.mockRejectedValueOnce(new Error('Network error'));

      const result = await tools.listAgents.execute(
        { isActive: true, includeWorkload: false, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as ErrorResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle agent not found', async () => {
      ctx.agents.get.mockRejectedValueOnce(new Error('Agent not found'));

      const result = await tools.getAgent.execute(
        { agentId: 999 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as ErrorResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle team errors', async () => {
      ctx.agents.teams.listActive.mockRejectedValueOnce(new Error('Team error'));

      const result = await tools.listTeams.execute(
        { isActive: true },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as ErrorResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Team error');
    });

    it('should handle calendar event creation errors', async () => {
      ctx.agents.createCalendarEvent.mockRejectedValueOnce(new Error('Calendar error'));

      const result = await tools.createAgentCalendarEvent.execute(
        {
          agentId: 1,
          title: 'Event',
          startDateTime: '2024-01-15T10:00:00Z',
          endDateTime: '2024-01-15T11:00:00Z',
          isAllDay: false,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as ErrorResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Calendar error');
    });
  });

  // === TOOL DESCRIPTIONS ===

  describe('Tool Descriptions', () => {
    it('should have descriptions for all tools', () => {
      expect(tools.listAgents.description).toBeDefined();
      expect(tools.getAgent.description).toBeDefined();
      expect(tools.getAgentWorkload.description).toBeDefined();
      expect(tools.listTeams.description).toBeDefined();
      expect(tools.getTeam.description).toBeDefined();
      expect(tools.getAgentAvailability.description).toBeDefined();
      expect(tools.listAgentCalendar.description).toBeDefined();
      expect(tools.getTeamAvailability.description).toBeDefined();
      expect(tools.createAgentCalendarEvent.description).toBeDefined();
      expect(tools.findAvailableAgents.description).toBeDefined();
    });
  });
});
