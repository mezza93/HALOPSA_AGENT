/**
 * Ticket-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Ticket, Action } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_ACTION_LIMIT = 10;

export function createTicketTools(ctx: HaloContext) {
  return {
    // === READ OPERATIONS ===
    listTickets: tool({
      description: 'List tickets from HaloPSA with optional filters. Use this to see open, closed, or all tickets.',
      parameters: z.object({
        status: z.enum(['open', 'closed', 'all']).optional().default('open').describe('Filter by ticket status'),
        clientId: z.number().optional().describe('Filter by client ID'),
        agentId: z.number().optional().describe('Filter by assigned agent ID'),
        search: z.string().optional().describe('Search term to filter tickets'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number of tickets to return'),
      }),
      execute: async ({ status, clientId, agentId, search, count }) => {
        const limit = Math.min(count || DEFAULT_COUNT, MAX_PAGE_SIZE);

        let tickets: Ticket[];
        if (search) {
          tickets = await ctx.tickets.search(search, limit);
        } else if (status === 'open') {
          tickets = await ctx.tickets.listOpen({ clientId, agentId, count: limit });
        } else if (status === 'closed') {
          tickets = await ctx.tickets.listClosed({ clientId, count: limit });
        } else {
          tickets = await ctx.tickets.list({ client_id: clientId, agent_id: agentId, count: limit });
        }

        return tickets.map((t: Ticket) => ({
          id: t.id,
          summary: t.summary,
          status: t.statusName,
          priority: t.priorityName,
          client: t.clientName,
          agent: t.agentName,
          created: t.dateCreated,
          isSlaBreached: t.isSlaBreached,
        }));
      },
    }),

    getTicket: tool({
      description: 'Get detailed information about a specific ticket including recent actions/notes.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to retrieve'),
      }),
      execute: async ({ ticketId }) => {
        const ticket = await ctx.tickets.getWithActions(ticketId);
        return {
          id: ticket.id,
          summary: ticket.summary,
          details: ticket.details,
          status: ticket.statusName,
          priority: ticket.priorityName,
          client: ticket.clientName,
          site: ticket.siteName,
          user: ticket.userName,
          agent: ticket.agentName,
          team: ticket.teamName,
          created: ticket.dateCreated,
          closed: ticket.dateClosed,
          isSlaBreached: ticket.isSlaBreached,
          actions: (ticket.actions || []).slice(0, DEFAULT_ACTION_LIMIT).map((a: Action) => ({
            id: a.id,
            note: a.note,
            who: a.who,
            time: a.actionTime,
          })),
        };
      },
    }),

    getTicketStats: tool({
      description: 'Get ticket statistics including counts by status, priority, SLA breaches, etc.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter stats by client ID'),
        agentId: z.number().optional().describe('Filter stats by agent ID'),
      }),
      execute: async ({ clientId, agentId }) => {
        return ctx.tickets.getSummaryStats({ clientId, agentId });
      },
    }),

    listSlaBreachedTickets: tool({
      description: 'List tickets that have breached their SLA. Use this to identify urgent tickets.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number of tickets to return'),
      }),
      execute: async ({ count }) => {
        const tickets = await ctx.tickets.listSlaBreached(count || DEFAULT_COUNT);
        return tickets.map((t: Ticket) => ({
          id: t.id,
          summary: t.summary,
          status: t.statusName,
          client: t.clientName,
          agent: t.agentName,
          created: t.dateCreated,
        }));
      },
    }),

    listUnassignedTickets: tool({
      description: 'List tickets that have not been assigned to any agent.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number of tickets to return'),
      }),
      execute: async ({ count }) => {
        const tickets = await ctx.tickets.listUnassigned(count || DEFAULT_COUNT);
        return tickets.map((t: Ticket) => ({
          id: t.id,
          summary: t.summary,
          status: t.statusName,
          client: t.clientName,
          created: t.dateCreated,
        }));
      },
    }),

    // === WRITE OPERATIONS ===
    addTicketNote: tool({
      description: 'Add a note/action to an existing ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to add a note to'),
        note: z.string().describe('The note content'),
        hiddenFromUser: z.boolean().optional().default(false).describe('Whether to hide this note from the end user'),
      }),
      execute: async ({ ticketId, note, hiddenFromUser }) => {
        const action = await ctx.tickets.addAction(ticketId, note, { hiddenFromUser: hiddenFromUser || false });
        return { success: true, actionId: action.id };
      },
    }),

    createTicket: tool({
      description: 'Create a new ticket in HaloPSA.',
      parameters: z.object({
        summary: z.string().describe('Ticket summary/title'),
        details: z.string().describe('Ticket description/details'),
        clientId: z.number().describe('Client ID'),
        ticketTypeId: z.number().optional().default(1).describe('Ticket type ID (1 = incident)'),
        priorityId: z.number().optional().default(3).describe('Priority ID (1=P1 Critical, 2=P2 High, 3=P3 Medium, 4=P4 Low)'),
        userId: z.number().optional().describe('User ID (contact at the client)'),
        siteId: z.number().optional().describe('Site ID'),
        agentId: z.number().optional().describe('Agent ID to assign to'),
        teamId: z.number().optional().describe('Team ID to assign to'),
        category1: z.string().optional().describe('Primary category'),
        category2: z.string().optional().describe('Secondary category'),
      }),
      execute: async ({ summary, details, clientId, ticketTypeId, priorityId, userId, siteId, agentId, teamId, category1, category2 }) => {
        const ticketData: Record<string, unknown> = {
          summary,
          details,
          clientId,
          tickettypeId: ticketTypeId || 1,
          priorityId: priorityId || 3,
        };

        if (userId) ticketData.userId = userId;
        if (siteId) ticketData.siteId = siteId;
        if (agentId) ticketData.agentId = agentId;
        if (teamId) ticketData.teamId = teamId;
        if (category1) ticketData.category1 = category1;
        if (category2) ticketData.category2 = category2;

        const tickets = await ctx.tickets.create([ticketData]);
        if (tickets && tickets.length > 0) {
          const t = tickets[0];
          return {
            success: true,
            ticketId: t.id,
            summary: t.summary,
            client: t.clientName,
            status: t.statusName,
            message: `Ticket #${t.id} created successfully`,
          };
        }
        return { success: false, error: 'Failed to create ticket' };
      },
    }),

    updateTicket: tool({
      description: 'Update an existing ticket in HaloPSA.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to update'),
        summary: z.string().optional().describe('New summary/title'),
        details: z.string().optional().describe('New details'),
        statusId: z.number().optional().describe('New status ID'),
        priorityId: z.number().optional().describe('New priority ID'),
        agentId: z.number().optional().describe('New agent ID'),
        teamId: z.number().optional().describe('New team ID'),
        category1: z.string().optional().describe('New primary category'),
        category2: z.string().optional().describe('New secondary category'),
      }),
      execute: async ({ ticketId, summary, details, statusId, priorityId, agentId, teamId, category1, category2 }) => {
        const updateData: Record<string, unknown> = { id: ticketId };

        if (summary !== undefined) updateData.summary = summary;
        if (details !== undefined) updateData.details = details;
        if (statusId !== undefined) updateData.statusId = statusId;
        if (priorityId !== undefined) updateData.priorityId = priorityId;
        if (agentId !== undefined) updateData.agentId = agentId;
        if (teamId !== undefined) updateData.teamId = teamId;
        if (category1 !== undefined) updateData.category1 = category1;
        if (category2 !== undefined) updateData.category2 = category2;

        const tickets = await ctx.tickets.update([updateData]);
        if (tickets && tickets.length > 0) {
          const t = tickets[0];
          return {
            success: true,
            ticketId: t.id,
            summary: t.summary,
            status: t.statusName,
            message: `Ticket #${t.id} updated successfully`,
          };
        }
        return { success: false, error: 'Failed to update ticket' };
      },
    }),

    assignTicket: tool({
      description: 'Assign a ticket to an agent or team.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to assign'),
        agentId: z.number().optional().describe('Agent ID to assign to'),
        teamId: z.number().optional().describe('Team ID to assign to'),
      }),
      execute: async ({ ticketId, agentId, teamId }) => {
        const ticket = await ctx.tickets.assign(ticketId, { agentId, teamId });
        return {
          success: true,
          ticketId: ticket.id,
          agent: ticket.agentName,
          team: ticket.teamName,
          message: `Ticket #${ticket.id} assigned successfully`,
        };
      },
    }),

    closeTicket: tool({
      description: 'Close a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to close'),
        note: z.string().optional().describe('Closing note/resolution'),
      }),
      execute: async ({ ticketId, note }) => {
        const ticket = await ctx.tickets.close(ticketId, note);
        return {
          success: true,
          ticketId: ticket.id,
          status: ticket.statusName,
          message: `Ticket #${ticket.id} closed successfully`,
        };
      },
    }),

    changeTicketStatus: tool({
      description: 'Change the status of a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID'),
        statusId: z.number().describe('New status ID'),
        note: z.string().optional().describe('Note explaining the status change'),
      }),
      execute: async ({ ticketId, statusId, note }) => {
        if (note) {
          await ctx.tickets.addAction(ticketId, note, { hiddenFromUser: false });
        }

        const tickets = await ctx.tickets.update([{ id: ticketId, statusId }]);
        if (tickets && tickets.length > 0) {
          const t = tickets[0];
          return {
            success: true,
            ticketId: t.id,
            status: t.statusName,
            message: `Ticket #${t.id} status changed successfully`,
          };
        }
        return { success: false, error: 'Failed to change ticket status' };
      },
    }),

    changeTicketPriority: tool({
      description: 'Change the priority of a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID'),
        priorityId: z.number().describe('New priority ID (1=P1 Critical, 2=P2 High, 3=P3 Medium, 4=P4 Low)'),
      }),
      execute: async ({ ticketId, priorityId }) => {
        const tickets = await ctx.tickets.update([{ id: ticketId, priorityId }]);
        if (tickets && tickets.length > 0) {
          const t = tickets[0];
          return {
            success: true,
            ticketId: t.id,
            priority: t.priorityName,
            message: `Ticket #${t.id} priority changed successfully`,
          };
        }
        return { success: false, error: 'Failed to change ticket priority' };
      },
    }),

    // === BULK OPERATIONS ===
    bulkUpdateTickets: tool({
      description: 'Update multiple tickets at once with the same changes.',
      parameters: z.object({
        ticketIds: z.array(z.number()).describe('Array of ticket IDs to update'),
        statusId: z.number().optional().describe('New status ID for all tickets'),
        priorityId: z.number().optional().describe('New priority ID for all tickets'),
        agentId: z.number().optional().describe('New agent ID for all tickets'),
        teamId: z.number().optional().describe('New team ID for all tickets'),
      }),
      execute: async ({ ticketIds, statusId, priorityId, agentId, teamId }) => {
        const updateData: Record<string, unknown> = {};
        if (statusId !== undefined) updateData.statusId = statusId;
        if (priorityId !== undefined) updateData.priorityId = priorityId;
        if (agentId !== undefined) updateData.agentId = agentId;
        if (teamId !== undefined) updateData.teamId = teamId;

        const updates = ticketIds.map(id => ({ id, ...updateData }));
        const tickets = await ctx.tickets.update(updates);

        return {
          success: true,
          updatedCount: tickets.length,
          message: `Updated ${tickets.length} tickets`,
        };
      },
    }),

    bulkCloseTickets: tool({
      description: 'Close multiple tickets at once.',
      parameters: z.object({
        ticketIds: z.array(z.number()).describe('Array of ticket IDs to close'),
        note: z.string().optional().describe('Closing note for all tickets'),
      }),
      execute: async ({ ticketIds, note }) => {
        const results = [];
        for (const ticketId of ticketIds) {
          const ticket = await ctx.tickets.close(ticketId, note);
          results.push(ticket.id);
        }

        return {
          success: true,
          closedCount: results.length,
          message: `Closed ${results.length} tickets`,
        };
      },
    }),

    // === MERGE OPERATIONS ===
    mergeTickets: tool({
      description: 'Merge multiple tickets into a primary ticket. Actions from secondary tickets are copied to the primary.',
      parameters: z.object({
        primaryTicketId: z.number().describe('The ticket ID to merge into (will remain open)'),
        secondaryTicketIds: z.array(z.number()).describe('Ticket IDs to merge from (will be closed)'),
        mergeNote: z.string().optional().describe('Note explaining the merge'),
      }),
      execute: async ({ primaryTicketId, secondaryTicketIds, mergeNote }) => {
        const result = await ctx.tickets.mergeTickets(primaryTicketId, secondaryTicketIds, mergeNote);
        return {
          success: result.errors.length === 0,
          primaryTicketId,
          mergedCount: result.mergedTickets.length,
          actionsCopied: result.actionsCopied,
          errors: result.errors,
          message: `Merged ${result.mergedTickets.length} tickets into #${primaryTicketId}. ${result.actionsCopied} actions copied.`,
        };
      },
    }),

    findDuplicateTickets: tool({
      description: 'Find potential duplicate tickets for a given ticket based on similarity.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to find duplicates for'),
        hoursLookback: z.number().optional().default(72).describe('Hours to look back for duplicates'),
        similarityThreshold: z.number().optional().default(0.7).describe('Similarity threshold (0-1)'),
      }),
      execute: async ({ ticketId, hoursLookback, similarityThreshold }) => {
        return ctx.tickets.findDuplicates(ticketId, {
          hoursLookback: hoursLookback || 72,
          similarityThreshold: similarityThreshold || 0.7,
        });
      },
    }),
  };
}
