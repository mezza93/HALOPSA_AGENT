// @ts-nocheck - Vitest tool execute() returns union types that require verbose narrowing
/**
 * Comprehensive tests for Ticket AI Tools.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTicketTools } from '@/lib/ai/tools/tickets';
import {
  createMockHaloContext,
  createTicket,
  createAction,
  createTicketStats,
  createMergeResult,
  createDuplicateCandidate,
  resetFactoryIds,
} from '../../../../mocks/factories';
import type { HaloContext } from '@/lib/ai/tools/context';

describe('Ticket AI Tools', () => {
  let ctx: ReturnType<typeof createMockHaloContext>;
  let tools: ReturnType<typeof createTicketTools>;

  beforeEach(() => {
    resetFactoryIds();
    ctx = createMockHaloContext();
    tools = createTicketTools(ctx as unknown as HaloContext);
  });

  // === READ OPERATIONS ===

  describe('listTickets', () => {
    it('should list open tickets by default', async () => {
      const result = await tools.listTickets.execute({ status: 'open' }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.tickets).toBeDefined();
      expect(ctx.tickets.listOpen).toHaveBeenCalled();
    });

    it('should list closed tickets', async () => {
      const result = await tools.listTickets.execute({ status: 'closed' }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.listClosed).toHaveBeenCalled();
    });

    it('should list all tickets', async () => {
      const result = await tools.listTickets.execute({ status: 'all' }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.list).toHaveBeenCalled();
    });

    it('should search tickets when search term provided', async () => {
      const result = await tools.listTickets.execute({ search: 'server' }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.search).toHaveBeenCalledWith('server', expect.any(Number));
    });

    it('should filter by clientId', async () => {
      const result = await tools.listTickets.execute({ status: 'open', clientId: 5 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.listOpen).toHaveBeenCalledWith(expect.objectContaining({ clientId: 5 }));
    });

    it('should filter by agentId', async () => {
      const result = await tools.listTickets.execute({ status: 'open', agentId: 3 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.listOpen).toHaveBeenCalledWith(expect.objectContaining({ agentId: 3 }));
    });

    it('should respect count parameter', async () => {
      const result = await tools.listTickets.execute({ status: 'open', count: 5 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.listOpen).toHaveBeenCalledWith(expect.objectContaining({ count: 5 }));
    });
  });

  describe('getTicket', () => {
    it('should get a specific ticket with actions', async () => {
      const result = await tools.getTicket.execute({ ticketId: 123 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.id).toBe(123);
      expect(result.actions).toBeDefined();
      expect(ctx.tickets.getWithActions).toHaveBeenCalledWith(123);
    });

    it('should include ticket details', async () => {
      const result = await tools.getTicket.execute({ ticketId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.client).toBeDefined();
    });
  });

  describe('getTicketStats', () => {
    it('should get ticket statistics', async () => {
      const result = await tools.getTicketStats.execute({}, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.open).toBeDefined();
      expect(result.closed).toBeDefined();
      expect(result.slaBreached).toBeDefined();
    });

    it('should filter stats by clientId', async () => {
      const result = await tools.getTicketStats.execute({ clientId: 5 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.getSummaryStats).toHaveBeenCalledWith(expect.objectContaining({ clientId: 5 }));
    });

    it('should filter stats by agentId', async () => {
      const result = await tools.getTicketStats.execute({ agentId: 3 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.getSummaryStats).toHaveBeenCalledWith(expect.objectContaining({ agentId: 3 }));
    });
  });

  describe('listSlaBreachedTickets', () => {
    it('should list SLA breached tickets', async () => {
      const result = await tools.listSlaBreachedTickets.execute({}, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.tickets).toBeDefined();
      expect(ctx.tickets.listSlaBreached).toHaveBeenCalled();
    });

    it('should respect count parameter', async () => {
      const result = await tools.listSlaBreachedTickets.execute({ count: 10 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.tickets.listSlaBreached).toHaveBeenCalledWith(10);
    });
  });

  describe('listUnassignedTickets', () => {
    it('should list unassigned tickets', async () => {
      const result = await tools.listUnassignedTickets.execute({}, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.tickets).toBeDefined();
      expect(ctx.tickets.listUnassigned).toHaveBeenCalled();
    });
  });

  // === WRITE OPERATIONS ===

  describe('addTicketNote', () => {
    it('should add a note to a ticket', async () => {
      const result = await tools.addTicketNote.execute(
        { ticketId: 1, note: 'Test note' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.actionId).toBeDefined();
      expect(result.message).toContain('Note added');
      expect(ctx.tickets.addAction).toHaveBeenCalledWith(1, 'Test note', expect.objectContaining({ hiddenFromUser: false }));
    });

    it('should add a hidden note', async () => {
      const result = await tools.addTicketNote.execute(
        { ticketId: 1, note: 'Internal note', hiddenFromUser: true },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.addAction).toHaveBeenCalledWith(1, 'Internal note', expect.objectContaining({ hiddenFromUser: true }));
    });
  });

  describe('createTicket', () => {
    it('should create a new ticket', async () => {
      const result = await tools.createTicket.execute(
        {
          summary: 'New issue',
          details: 'Issue description',
          clientId: 1,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.ticketId).toBeDefined();
      expect(result.message).toContain('created successfully');
      expect(ctx.tickets.create).toHaveBeenCalled();
    });

    it('should create ticket with all optional fields', async () => {
      const result = await tools.createTicket.execute(
        {
          summary: 'Full ticket',
          details: 'Full description',
          clientId: 1,
          ticketTypeId: 2,
          priorityId: 1,
          userId: 5,
          siteId: 3,
          agentId: 7,
          teamId: 2,
          category1: 'Hardware',
          category2: 'Desktop',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.create).toHaveBeenCalledWith([
        expect.objectContaining({
          summary: 'Full ticket',
          details: 'Full description',
          clientId: 1,
          tickettypeId: 2,
          priorityId: 1,
          userId: 5,
          siteId: 3,
          agentId: 7,
          teamId: 2,
          category1: 'Hardware',
          category2: 'Desktop',
        }),
      ]);
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket', async () => {
      const result = await tools.updateTicket.execute(
        { ticketId: 1, summary: 'Updated summary' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.ticketId).toBe(1);
      expect(result.message).toContain('updated successfully');
    });

    it('should update multiple fields', async () => {
      const result = await tools.updateTicket.execute(
        {
          ticketId: 1,
          summary: 'New summary',
          details: 'New details',
          statusId: 2,
          priorityId: 1,
          agentId: 5,
          teamId: 3,
          category1: 'Software',
          category2: 'Application',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.update).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          summary: 'New summary',
          details: 'New details',
          statusId: 2,
          priorityId: 1,
          agentId: 5,
          teamId: 3,
          category1: 'Software',
          category2: 'Application',
        }),
      ]);
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to an agent', async () => {
      const result = await tools.assignTicket.execute(
        { ticketId: 1, agentId: 5 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('assigned successfully');
      expect(ctx.tickets.assign).toHaveBeenCalledWith(1, expect.objectContaining({ agentId: 5 }));
    });

    it('should assign ticket to a team', async () => {
      const result = await tools.assignTicket.execute(
        { ticketId: 1, teamId: 3 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.assign).toHaveBeenCalledWith(1, expect.objectContaining({ teamId: 3 }));
    });

    it('should assign ticket to both agent and team', async () => {
      const result = await tools.assignTicket.execute(
        { ticketId: 1, agentId: 5, teamId: 3 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.assign).toHaveBeenCalledWith(1, { agentId: 5, teamId: 3 });
    });
  });

  describe('closeTicket', () => {
    it('should close a ticket', async () => {
      const result = await tools.closeTicket.execute(
        { ticketId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('Closed');
      expect(result.message).toContain('closed successfully');
      expect(ctx.tickets.close).toHaveBeenCalledWith(1, undefined);
    });

    it('should close a ticket with a note', async () => {
      const result = await tools.closeTicket.execute(
        { ticketId: 1, note: 'Issue resolved' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.close).toHaveBeenCalledWith(1, 'Issue resolved');
    });
  });

  describe('changeTicketStatus', () => {
    it('should change ticket status', async () => {
      const result = await tools.changeTicketStatus.execute(
        { ticketId: 1, statusId: 5 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('status changed');
      expect(ctx.tickets.update).toHaveBeenCalledWith([{ id: 1, statusId: 5 }]);
    });

    it('should add a note when changing status', async () => {
      const result = await tools.changeTicketStatus.execute(
        { ticketId: 1, statusId: 5, note: 'Moving to in-progress' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.addAction).toHaveBeenCalledWith(1, 'Moving to in-progress', { hiddenFromUser: false });
      expect(ctx.tickets.update).toHaveBeenCalledWith([{ id: 1, statusId: 5 }]);
    });
  });

  describe('changeTicketPriority', () => {
    it('should change ticket priority', async () => {
      const result = await tools.changeTicketPriority.execute(
        { ticketId: 1, priorityId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('priority changed');
      expect(ctx.tickets.update).toHaveBeenCalledWith([{ id: 1, priorityId: 1 }]);
    });
  });

  // === BULK OPERATIONS ===

  describe('bulkUpdateTickets', () => {
    it('should update multiple tickets at once', async () => {
      const result = await tools.bulkUpdateTickets.execute(
        { ticketIds: [1, 2, 3], statusId: 5 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBeDefined();
      expect(ctx.tickets.update).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, statusId: 5 }),
        expect.objectContaining({ id: 2, statusId: 5 }),
        expect.objectContaining({ id: 3, statusId: 5 }),
      ]);
    });

    it('should bulk update with multiple fields', async () => {
      const result = await tools.bulkUpdateTickets.execute(
        { ticketIds: [1, 2], statusId: 3, priorityId: 2, agentId: 5, teamId: 2 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.update).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, statusId: 3, priorityId: 2, agentId: 5, teamId: 2 }),
        expect.objectContaining({ id: 2, statusId: 3, priorityId: 2, agentId: 5, teamId: 2 }),
      ]);
    });
  });

  describe('bulkCloseTickets', () => {
    it('should close multiple tickets', async () => {
      const result = await tools.bulkCloseTickets.execute(
        { ticketIds: [1, 2, 3] },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.closedCount).toBe(3);
      expect(ctx.tickets.close).toHaveBeenCalledTimes(3);
    });

    it('should close multiple tickets with a note', async () => {
      const result = await tools.bulkCloseTickets.execute(
        { ticketIds: [1, 2], note: 'Bulk closure' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.close).toHaveBeenCalledWith(1, 'Bulk closure');
      expect(ctx.tickets.close).toHaveBeenCalledWith(2, 'Bulk closure');
    });
  });

  // === MERGE OPERATIONS ===

  describe('mergeTickets', () => {
    it('should merge tickets into a primary ticket', async () => {
      const result = await tools.mergeTickets.execute(
        { primaryTicketId: 1, secondaryTicketIds: [2, 3] },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.primaryTicketId).toBe(1);
      expect(result.mergedCount).toBe(2);
      expect(result.actionsCopied).toBeDefined();
      expect(ctx.tickets.mergeTickets).toHaveBeenCalledWith(1, [2, 3], undefined);
    });

    it('should merge with a note', async () => {
      const result = await tools.mergeTickets.execute(
        { primaryTicketId: 1, secondaryTicketIds: [2], mergeNote: 'Duplicate issue' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.mergeTickets).toHaveBeenCalledWith(1, [2], 'Duplicate issue');
    });
  });

  describe('findDuplicateTickets', () => {
    it('should find duplicate tickets', async () => {
      const result = await tools.findDuplicateTickets.execute(
        { ticketId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.findDuplicates).toHaveBeenCalledWith(1, expect.objectContaining({
        hoursLookback: 72,
        similarityThreshold: 0.7,
      }));
    });

    it('should use custom parameters', async () => {
      const result = await tools.findDuplicateTickets.execute(
        { ticketId: 1, hoursLookback: 24, similarityThreshold: 0.8 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.tickets.findDuplicates).toHaveBeenCalledWith(1, expect.objectContaining({
        hoursLookback: 24,
        similarityThreshold: 0.8,
      }));
    });
  });

  // === ERROR HANDLING ===

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      ctx.tickets.list.mockRejectedValueOnce(new Error('Network error'));

      const result = await tools.listTickets.execute({ status: 'all' }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle missing ticket errors', async () => {
      ctx.tickets.getWithActions.mockRejectedValueOnce(new Error('Ticket not found'));

      const result = await tools.getTicket.execute({ ticketId: 999 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle create ticket failures', async () => {
      ctx.tickets.create.mockResolvedValueOnce([]);

      const result = await tools.createTicket.execute(
        { summary: 'Test', details: 'Test', clientId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('no response');
    });

    it('should handle update ticket failures', async () => {
      ctx.tickets.update.mockResolvedValueOnce([]);

      const result = await tools.updateTicket.execute(
        { ticketId: 1, summary: 'Update' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update');
    });

    it('should handle merge errors', async () => {
      ctx.tickets.mergeTickets.mockResolvedValueOnce(createMergeResult({
        errors: [{ ticketId: 2, error: 'Cannot merge closed ticket' }],
      }));

      const result = await tools.mergeTickets.execute(
        { primaryTicketId: 1, secondaryTicketIds: [2] },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // === TOOL DESCRIPTIONS ===

  describe('Tool Descriptions', () => {
    it('should have descriptions for all tools', () => {
      expect(tools.listTickets.description).toBeDefined();
      expect(tools.getTicket.description).toBeDefined();
      expect(tools.getTicketStats.description).toBeDefined();
      expect(tools.listSlaBreachedTickets.description).toBeDefined();
      expect(tools.listUnassignedTickets.description).toBeDefined();
      expect(tools.addTicketNote.description).toBeDefined();
      expect(tools.createTicket.description).toBeDefined();
      expect(tools.updateTicket.description).toBeDefined();
      expect(tools.assignTicket.description).toBeDefined();
      expect(tools.closeTicket.description).toBeDefined();
      expect(tools.changeTicketStatus.description).toBeDefined();
      expect(tools.changeTicketPriority.description).toBeDefined();
      expect(tools.bulkUpdateTickets.description).toBeDefined();
      expect(tools.bulkCloseTickets.description).toBeDefined();
      expect(tools.mergeTickets.description).toBeDefined();
      expect(tools.findDuplicateTickets.description).toBeDefined();
    });
  });
});
