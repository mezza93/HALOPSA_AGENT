/**
 * Ticket-related types for HaloPSA.
 */

import { HaloBaseEntity } from './common';

/**
 * Ticket type definition.
 */
export interface TicketType extends HaloBaseEntity {
  name: string;
}

/**
 * Ticket status definition.
 */
export interface TicketStatus extends HaloBaseEntity {
  name: string;
  statusType?: string;
}

/**
 * Priority level with SLA information.
 */
export interface Priority extends HaloBaseEntity {
  name: string;
  slaResponseMins?: number;
  slaFixMins?: number;
  colour?: string;
}

/**
 * Ticket action/update.
 */
export interface Action extends HaloBaseEntity {
  ticketId?: number;
  note?: string;
  who?: string;
  whoType?: number;
  outcome?: string;
  outcomeId?: number;
  actionTime?: Date | string;
  timeTaken?: number;
  hiddenFromUser: boolean;
}

/**
 * Raw action data from API (snake_case).
 */
export interface ActionApiResponse {
  id: number;
  ticket_id?: number;
  note?: string;
  who?: string;
  whotype?: number;
  outcome?: string;
  outcome_id?: number;
  actiontime?: string;
  timetaken?: number;
  hiddenfromuser?: boolean;
  [key: string]: unknown;
}

/**
 * Ticket/request entity.
 */
export interface Ticket extends HaloBaseEntity {
  summary: string;
  details?: string;

  // Type and classification
  ticketTypeId?: number;
  ticketTypeName?: string;
  category1?: string;
  category2?: string;
  category3?: string;

  // Status and priority
  statusId?: number;
  statusName?: string;
  priorityId?: number;
  priorityName?: string;

  // Client/User
  clientId?: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;
  userId?: number;
  userName?: string;

  // Assignment
  agentId?: number;
  agentName?: string;
  teamId?: number;
  teamName?: string;

  // Dates
  dateCreated?: Date | string;
  dateClosed?: Date | string;
  dueDate?: Date | string;
  responseDate?: Date | string;

  // SLA tracking
  slaResponseTime?: number;
  slaFixTime?: number;
  slaResponseState?: number | string;
  slaFixState?: number | string;

  // Custom fields
  customFields?: Record<string, unknown>[];

  // Actions/updates
  actions?: Action[];
}

/**
 * Raw ticket data from API (snake_case).
 */
export interface TicketApiResponse {
  id: number;
  summary: string;
  details?: string;
  tickettype_id?: number;
  tickettype_name?: string;
  category_1?: string;
  category_2?: string;
  category_3?: string;
  status_id?: number;
  status_name?: string;
  priority_id?: number;
  priority_name?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  user_id?: number;
  user_name?: string;
  agent_id?: number;
  agent_name?: string;
  team_id?: number;
  team?: string;
  datecreated?: string;
  dateclosed?: string;
  duedate?: string;
  responsedate?: string;
  slaresponsetime?: number;
  slafixtime?: number;
  slaresponsestate?: number | string;
  slafixstate?: number | string;
  customfields?: Record<string, unknown>[];
  actions?: ActionApiResponse[];
  [key: string]: unknown;
}

/**
 * Ticket summary statistics.
 */
export interface TicketStats {
  total: number;
  open: number;
  closed: number;
  slaBreached: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAgent: Record<string, number>;
  byClient: Record<string, number>;
}

/**
 * Merge result from merging tickets.
 */
export interface MergeResult {
  primaryTicketId: number;
  mergedTickets: Array<{
    id: number;
    summary: string;
    actionsCopied: number;
  }>;
  actionsCopied: number;
  errors: Array<{
    ticketId: number;
    error: string;
  }>;
}

/**
 * Duplicate ticket candidate.
 */
export interface DuplicateCandidate {
  ticketId: number;
  summary: string;
  status?: string;
  created?: Date | string;
  similarityScore: number;
  matchingWords: string[];
}

/**
 * Helper functions for ticket data
 */
export function isTicketOpen(ticket: Ticket): boolean {
  return ticket.dateClosed === null || ticket.dateClosed === undefined;
}

export function isSlaBreach(ticket: Ticket): boolean {
  const breachedValues = [2, '2', 'B', 'b'];
  return (
    breachedValues.includes(ticket.slaResponseState as string | number) ||
    breachedValues.includes(ticket.slaFixState as string | number)
  );
}

/**
 * Transform API response to Ticket interface.
 */
export function transformTicket(data: TicketApiResponse): Ticket {
  return {
    id: data.id,
    summary: data.summary,
    details: data.details,
    ticketTypeId: data.tickettype_id,
    ticketTypeName: data.tickettype_name,
    category1: data.category_1,
    category2: data.category_2,
    category3: data.category_3,
    statusId: data.status_id,
    statusName: data.status_name,
    priorityId: data.priority_id,
    priorityName: data.priority_name,
    clientId: data.client_id,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    userId: data.user_id,
    userName: data.user_name,
    agentId: data.agent_id,
    agentName: data.agent_name,
    teamId: data.team_id,
    teamName: data.team,
    dateCreated: data.datecreated,
    dateClosed: data.dateclosed,
    dueDate: data.duedate,
    responseDate: data.responsedate,
    slaResponseTime: data.slaresponsetime,
    slaFixTime: data.slafixtime,
    slaResponseState: data.slaresponsestate,
    slaFixState: data.slafixstate,
    customFields: data.customfields,
    actions: data.actions?.map(transformAction),
  };
}

/**
 * Transform API response to Action interface.
 */
export function transformAction(data: ActionApiResponse): Action {
  return {
    id: data.id,
    ticketId: data.ticket_id,
    note: data.note,
    who: data.who,
    whoType: data.whotype,
    outcome: data.outcome,
    outcomeId: data.outcome_id,
    actionTime: data.actiontime,
    timeTaken: data.timetaken,
    hiddenFromUser: data.hiddenfromuser ?? false,
  };
}
