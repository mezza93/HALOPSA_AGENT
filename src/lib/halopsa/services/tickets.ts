/**
 * Ticket service for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Ticket,
  TicketApiResponse,
  Action,
  ActionApiResponse,
  TicketStats,
  MergeResult,
  DuplicateCandidate,
  transformTicket,
  transformAction,
  isTicketOpen,
  isSlaBreach,
} from '../types/ticket';
import { ListParams } from '../types/common';

/**
 * Parameters for listing open tickets.
 */
export interface ListOpenParams extends ListParams {
  clientId?: number;
  agentId?: number;
  teamId?: number;
}

/**
 * Parameters for listing closed tickets.
 */
export interface ListClosedParams extends ListParams {
  startDate?: string;
  endDate?: string;
  clientId?: number;
}

/**
 * Service for ticket/fault operations.
 */
export class TicketService extends BaseService<Ticket, TicketApiResponse> {
  protected endpoint = '/Tickets';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: TicketApiResponse): Ticket {
    return transformTicket(data);
  }

  /**
   * List open tickets with optional filters.
   */
  async listOpen(params: ListOpenParams = {}): Promise<Ticket[]> {
    const { clientId, agentId, teamId, count = 50, ...rest } = params;

    const queryParams: ListParams = {
      count,
      open_only: true,
      ...rest,
    };

    if (clientId) queryParams.client_id = clientId;
    if (agentId) queryParams.agent_id = agentId;
    if (teamId) queryParams.team_id = teamId;

    return this.list(queryParams);
  }

  /**
   * List closed tickets within a date range.
   */
  async listClosed(params: ListClosedParams = {}): Promise<Ticket[]> {
    const { startDate, endDate, clientId, count = 50, ...rest } = params;

    const queryParams: ListParams = {
      count,
      closed_only: true,
      datesearch: 'datecleared',
      ...rest,
    };

    if (startDate) {
      queryParams.startdate = startDate;
    }
    if (endDate) {
      queryParams.enddate = endDate;
    }
    if (clientId) queryParams.client_id = clientId;

    return this.list(queryParams);
  }

  /**
   * List tickets by status.
   */
  async listByStatus(statusId: number, count = 50, params: ListParams = {}): Promise<Ticket[]> {
    return this.list({ status_id: statusId, count, ...params });
  }

  /**
   * List tickets with breached SLAs.
   */
  async listSlaBreached(count = 50, params: ListParams = {}): Promise<Ticket[]> {
    return this.list({ slabreached: true, count, ...params });
  }

  /**
   * List unassigned tickets.
   */
  async listUnassigned(count = 50, params: ListParams = {}): Promise<Ticket[]> {
    return this.list({ unassigned: true, count, ...params });
  }

  /**
   * Search tickets by text.
   */
  async search(query: string, count = 50, params: ListParams = {}): Promise<Ticket[]> {
    return this.list({ search: query, count, ...params });
  }

  /**
   * Get a ticket with its actions/notes.
   */
  async getWithActions(id: number): Promise<Ticket> {
    const ticket = await this.get(id, { includedetails: true });

    const actionsData = await this.client.get<ActionApiResponse[] | { actions: ActionApiResponse[] }>(
      '/Actions',
      { ticket_id: id, excludesys: false }
    );

    let actionsList: ActionApiResponse[];
    if (Array.isArray(actionsData)) {
      actionsList = actionsData;
    } else if (actionsData && 'actions' in actionsData) {
      actionsList = actionsData.actions;
    } else {
      actionsList = [];
    }

    ticket.actions = actionsList.map(transformAction);
    return ticket;
  }

  /**
   * Add an action/note to a ticket.
   */
  async addAction(
    ticketId: number,
    note: string,
    options: {
      outcomeId?: number;
      hiddenFromUser?: boolean;
      timeTaken?: number;
    } = {}
  ): Promise<Action> {
    const { outcomeId, hiddenFromUser = false, timeTaken } = options;

    const actionData: Record<string, unknown> = {
      ticket_id: ticketId,
      note,
      hiddenfromuser: hiddenFromUser,
    };

    if (outcomeId) actionData.outcome_id = outcomeId;
    if (timeTaken) actionData.timetaken = timeTaken;

    const response = await this.client.post<ActionApiResponse | ActionApiResponse[]>(
      '/Actions',
      [actionData]
    );

    if (Array.isArray(response) && response.length > 0) {
      return transformAction(response[0]);
    }
    return transformAction(response as ActionApiResponse);
  }

  /**
   * Assign a ticket to an agent or team.
   */
  async assign(
    ticketId: number,
    options: { agentId?: number; teamId?: number }
  ): Promise<Ticket> {
    const { agentId, teamId } = options;

    const updateData: Record<string, number> = { id: ticketId };
    if (agentId !== undefined) updateData.agent_id = agentId;
    if (teamId !== undefined) updateData.team_id = teamId;

    const results = await this.update([updateData as Partial<Ticket>]);
    return results.length > 0 ? results[0] : this.get(ticketId);
  }

  /**
   * Close a ticket.
   */
  async close(ticketId: number, note?: string): Promise<Ticket> {
    // First add closing note if provided
    if (note) {
      await this.addAction(ticketId, note);
    }

    // Update ticket status to closed (status_id 9 is typically "Closed")
    const updateData = {
      id: ticketId,
      status_id: 9, // This may need to be configurable
    };

    const results = await this.update([updateData as Partial<Ticket>]);
    return results.length > 0 ? results[0] : this.get(ticketId);
  }

  /**
   * Get summary statistics for tickets.
   */
  async getSummaryStats(options: {
    clientId?: number;
    agentId?: number;
  } = {}): Promise<TicketStats> {
    const { clientId, agentId } = options;

    const params: ListParams = { count: 1000 };
    if (clientId) params.client_id = clientId;
    if (agentId) params.agent_id = agentId;

    const allTickets = await this.list(params);
    const openTickets = allTickets.filter(isTicketOpen);
    const closedTickets = allTickets.filter((t) => !isTicketOpen(t));
    const breachedTickets = openTickets.filter(isSlaBreach);

    return {
      total: allTickets.length,
      open: openTickets.length,
      closed: closedTickets.length,
      slaBreached: breachedTickets.length,
      byStatus: this.groupByField(allTickets, 'statusName'),
      byPriority: this.groupByField(allTickets, 'priorityName'),
      byAgent: this.groupByField(openTickets, 'agentName'),
      byClient: this.groupByField(allTickets, 'clientName'),
    };
  }

  /**
   * Group tickets by a field and count.
   */
  private groupByField(tickets: Ticket[], field: keyof Ticket): Record<string, number> {
    const result: Record<string, number> = {};

    for (const ticket of tickets) {
      const value = (ticket[field] as string) || 'Unassigned';
      result[value] = (result[value] || 0) + 1;
    }

    return result;
  }

  /**
   * Merge multiple tickets into one.
   * All actions from secondary tickets are copied to the primary ticket.
   * Secondary tickets are closed with a reference to the merge.
   */
  async mergeTickets(
    primaryTicketId: number,
    secondaryTicketIds: number[],
    mergeNote?: string
  ): Promise<MergeResult> {
    const results: MergeResult = {
      primaryTicketId,
      mergedTickets: [],
      actionsCopied: 0,
      errors: [],
    };

    // Get primary ticket
    await this.getWithActions(primaryTicketId);

    // Add merge note to primary
    const note =
      mergeNote || `Merged tickets: ${secondaryTicketIds.map((id) => `#${id}`).join(', ')}`;

    await this.addAction(primaryTicketId, `--- TICKET MERGE ---\n${note}`, {
      hiddenFromUser: false,
    });

    // Process each secondary ticket
    for (const secId of secondaryTicketIds) {
      try {
        const secondary = await this.getWithActions(secId);

        // Copy all actions from secondary to primary
        for (const action of secondary.actions || []) {
          if (action.note) {
            const mergedNote =
              `[Merged from Ticket #${secId}]\n` +
              `Original author: ${action.who || 'Unknown'}\n` +
              `Original time: ${action.actionTime || 'Unknown'}\n\n` +
              action.note;

            await this.addAction(primaryTicketId, mergedNote, {
              hiddenFromUser: action.hiddenFromUser,
            });
            results.actionsCopied += 1;
          }
        }

        // Close secondary ticket with merge reference
        const closeNote =
          `This ticket has been merged into Ticket #${primaryTicketId}.\n` +
          `All notes and attachments have been copied to the primary ticket.`;
        await this.close(secId, closeNote);

        results.mergedTickets.push({
          id: secId,
          summary: secondary.summary,
          actionsCopied: (secondary.actions || []).filter((a) => a.note).length,
        });
      } catch (error) {
        results.errors.push({
          ticketId: secId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Find potentially duplicate tickets.
   */
  async findDuplicates(
    ticketId: number,
    options: {
      hoursLookback?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<DuplicateCandidate[]> {
    const { hoursLookback = 72, similarityThreshold = 0.7 } = options;

    // Get the source ticket
    const source = await this.get(ticketId);

    if (!source.clientId) {
      return [];
    }

    // Get recent tickets for the same client
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hoursLookback * 60 * 60 * 1000);

    const candidates = await this.list({
      client_id: source.clientId,
      startdate: startDate.toISOString(),
      count: 100,
    });

    // Filter out the source ticket
    const filteredCandidates = candidates.filter((t) => t.id !== ticketId);

    // Calculate similarity scores
    const duplicates: DuplicateCandidate[] = [];
    const sourceWords = new Set(
      source.summary?.toLowerCase().split(/\s+/) || []
    );

    for (const candidate of filteredCandidates) {
      const candidateWords = new Set(
        candidate.summary?.toLowerCase().split(/\s+/) || []
      );

      if (sourceWords.size === 0 || candidateWords.size === 0) {
        continue;
      }

      // Calculate Jaccard similarity
      const intersection = new Set(
        [...sourceWords].filter((w) => candidateWords.has(w))
      );
      const union = new Set([...sourceWords, ...candidateWords]);
      let similarity = intersection.size / union.size;

      // Boost similarity if same category or priority
      if (source.category1 && candidate.category1 === source.category1) {
        similarity += 0.1;
      }
      if (source.priorityId && candidate.priorityId === source.priorityId) {
        similarity += 0.05;
      }

      // Cap at 1.0
      similarity = Math.min(similarity, 1.0);

      if (similarity >= similarityThreshold) {
        duplicates.push({
          ticketId: candidate.id,
          summary: candidate.summary,
          status: candidate.statusName,
          created: candidate.dateCreated,
          similarityScore: Math.round(similarity * 100) / 100,
          matchingWords: [...intersection],
        });
      }
    }

    // Sort by similarity descending
    duplicates.sort((a, b) => b.similarityScore - a.similarityScore);

    return duplicates;
  }
}
