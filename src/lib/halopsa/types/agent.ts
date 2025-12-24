/**
 * Agent/technician-related types for HaloPSA.
 */

import { HaloBaseEntity } from './common';

/**
 * Team/group of agents.
 */
export interface Team extends HaloBaseEntity {
  name: string;
  description?: string;

  // Team settings
  departmentId?: number;
  departmentName?: string;

  // Status
  inactive: boolean;

  // Stats
  agentCount?: number;
  openTicketCount?: number;
}

/**
 * Raw team data from API (snake_case).
 */
export interface TeamApiResponse {
  id: number;
  name: string;
  description?: string;
  department_id?: number;
  department_name?: string;
  inactive?: boolean;
  agent_count?: number;
  open_ticket_count?: number;
  [key: string]: unknown;
}

/**
 * Team membership for an agent.
 */
export interface AgentTeamMembership {
  agentId?: number;
  teamId?: number;
  teamName?: string;
  departmentId?: number;
  roleId?: string;
  unassignedAccess: boolean;
  otherAgentAccess: boolean;
  forTickets: boolean;
  forProjects: boolean;
  forOpps: boolean;
  overrideTeamEmail: boolean;
  inSection: boolean;
}

/**
 * Raw team membership data from API.
 */
export interface AgentTeamMembershipApiResponse {
  agent_id?: number;
  team_id?: number;
  team_name?: string;
  department_id?: number;
  role_id?: string;
  unassigned_access?: boolean;
  otheragent_access?: boolean;
  fortickets?: boolean;
  forprojects?: boolean;
  foropps?: boolean;
  override_team_email?: boolean;
  in_section?: boolean;
  [key: string]: unknown;
}

/**
 * Agent/technician in HaloPSA.
 */
export interface Agent extends HaloBaseEntity {
  name: string;
  firstName?: string;
  surname?: string;

  // Contact information
  email?: string;
  phoneNumber?: string;
  mobileNumber?: string;

  // Status
  inactive: boolean;
  isEnabledForUnifiedWrite: boolean;

  // Role/type
  role?: string;
  isAdmin: boolean;

  // Organization
  departmentId?: number;
  departmentName?: string;

  // Teams
  teams: AgentTeamMembership[];
  teamNames: string[];

  // Ticket/workload stats
  openTicketCount?: number;
  ticketsDueToday?: number;

  // Time tracking
  hoursWorkedToday?: number;
  utilizationPercentage?: number;

  // Dates
  dateCreated?: Date | string;
  lastLoginDate?: Date | string;
}

/**
 * Raw agent data from API (snake_case).
 */
export interface AgentApiResponse {
  id: number;
  name: string;
  firstname?: string;
  surname?: string;
  email?: string;
  phonenumber?: string;
  mobilenumber?: string;
  inactive?: boolean;
  isenabledforunifiedwrite?: boolean;
  role?: string;
  isadmin?: boolean;
  department_id?: number;
  department_name?: string;
  teams?: (AgentTeamMembershipApiResponse | number | Record<string, unknown>)[];
  team_names?: string[];
  open_ticket_count?: number;
  tickets_due_today?: number;
  hours_worked_today?: number;
  utilization_percentage?: number;
  datecreated?: string;
  lastlogindate?: string;
  [key: string]: unknown;
}

/**
 * Agent workload statistics.
 */
export interface AgentWorkloadStats {
  agents: Array<{
    id: number;
    name: string;
    openTickets: number;
    ticketsDueToday: number;
  }>;
  totalOpenTickets: number;
  totalDueToday: number;
  averageTicketsPerAgent: number;
}

/**
 * Transform team membership API response.
 */
export function transformTeamMembership(
  data: AgentTeamMembershipApiResponse | number | Record<string, unknown>
): AgentTeamMembership {
  if (typeof data === 'number') {
    return {
      teamId: data,
      unassignedAccess: false,
      otherAgentAccess: false,
      forTickets: false,
      forProjects: false,
      forOpps: false,
      overrideTeamEmail: false,
      inSection: false,
    };
  }

  const raw = data as AgentTeamMembershipApiResponse;
  return {
    agentId: raw.agent_id,
    teamId: raw.team_id,
    teamName: raw.team_name,
    departmentId: raw.department_id,
    roleId: raw.role_id,
    unassignedAccess: raw.unassigned_access ?? false,
    otherAgentAccess: raw.otheragent_access ?? false,
    forTickets: raw.fortickets ?? false,
    forProjects: raw.forprojects ?? false,
    forOpps: raw.foropps ?? false,
    overrideTeamEmail: raw.override_team_email ?? false,
    inSection: raw.in_section ?? false,
  };
}

/**
 * Transform API response to Team interface.
 */
export function transformTeam(data: TeamApiResponse): Team {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    departmentId: data.department_id,
    departmentName: data.department_name,
    inactive: data.inactive ?? false,
    agentCount: data.agent_count,
    openTicketCount: data.open_ticket_count,
  };
}

/**
 * Transform API response to Agent interface.
 */
export function transformAgent(data: AgentApiResponse): Agent {
  return {
    id: data.id,
    name: data.name,
    firstName: data.firstname,
    surname: data.surname,
    email: data.email,
    phoneNumber: data.phonenumber,
    mobileNumber: data.mobilenumber,
    inactive: data.inactive ?? false,
    isEnabledForUnifiedWrite: data.isenabledforunifiedwrite ?? false,
    role: data.role,
    isAdmin: data.isadmin ?? false,
    departmentId: data.department_id,
    departmentName: data.department_name,
    teams: data.teams?.map(transformTeamMembership) ?? [],
    teamNames: data.team_names ?? [],
    openTicketCount: data.open_ticket_count,
    ticketsDueToday: data.tickets_due_today,
    hoursWorkedToday: data.hours_worked_today,
    utilizationPercentage: data.utilization_percentage,
    dateCreated: data.datecreated,
    lastLoginDate: data.lastlogindate,
  };
}

/**
 * Get full name of agent.
 */
export function getAgentFullName(agent: Agent): string {
  if (agent.firstName && agent.surname) {
    return `${agent.firstName} ${agent.surname}`;
  }
  return agent.name;
}

/**
 * Check if agent is active.
 */
export function isAgentActive(agent: Agent): boolean {
  return !agent.inactive;
}
