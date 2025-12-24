/**
 * Agent/technician service for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Agent,
  AgentApiResponse,
  Team,
  TeamApiResponse,
  AgentWorkload,
  AgentWorkloadStats,
  transformAgent,
  transformTeam,
  getAgentFullName,
} from '../types/agent';
import { ListParams } from '../types/common';

/**
 * Service for team operations.
 */
export class TeamService extends BaseService<Team, TeamApiResponse> {
  protected endpoint = '/Team';

  protected transform(data: TeamApiResponse): Team {
    return transformTeam(data);
  }

  /**
   * List active teams.
   */
  async listActive(params: ListParams = {}): Promise<Team[]> {
    const teams = await this.list(params);
    return teams.filter((t) => !t.inactive);
  }
}

/**
 * Service for agent/technician operations.
 */
export class AgentService extends BaseService<Agent, AgentApiResponse> {
  protected endpoint = '/Agent';

  public teams: TeamService;

  constructor(client: HaloPSAClient) {
    super(client);
    this.teams = new TeamService(client);
  }

  protected transform(data: AgentApiResponse): Agent {
    return transformAgent(data);
  }

  /**
   * List active agents.
   */
  async listActive(count = 100, params: ListParams = {}): Promise<Agent[]> {
    return this.list({
      includeenabled: true,
      includedisabled: false,
      count,
      ...params,
    });
  }

  /**
   * List agents in a specific team.
   */
  async listByTeam(teamId: number, params: ListParams = {}): Promise<Agent[]> {
    return this.list({ team_id: teamId, ...params });
  }

  /**
   * List agents in a specific department.
   */
  async listByDepartment(departmentId: number, params: ListParams = {}): Promise<Agent[]> {
    return this.list({ department_id: departmentId, ...params });
  }

  /**
   * Search agents by name.
   */
  async search(query: string, count = 50, params: ListParams = {}): Promise<Agent[]> {
    return this.list({ search: query, count, ...params });
  }

  /**
   * Get the currently authenticated agent.
   */
  async getCurrent(): Promise<Agent> {
    const data = await this.client.get<AgentApiResponse>('/Agent/me');
    return this.transform(data);
  }

  /**
   * Get workload statistics for agents.
   */
  async getWorkloadStats(): Promise<AgentWorkload[]> {
    const agents = await this.listActive();

    return agents.map((agent) => ({
      agentId: agent.id,
      agentName: getAgentFullName(agent),
      openTickets: agent.openTicketCount || 0,
      overdueTickets: agent.ticketsDueToday || 0, // Using due today as proxy for overdue
      ticketsClosedToday: 0, // Would need separate API call
      ticketsClosedThisWeek: 0, // Would need separate API call
    }));
  }

  /**
   * Get workload for a specific agent.
   */
  async getAgentWorkload(agentId: number): Promise<AgentWorkload> {
    const agent = await this.get(agentId);

    return {
      agentId: agent.id,
      agentName: getAgentFullName(agent),
      openTickets: agent.openTicketCount || 0,
      overdueTickets: agent.ticketsDueToday || 0,
      ticketsClosedToday: 0,
      ticketsClosedThisWeek: 0,
    };
  }

  /**
   * Get aggregate workload statistics.
   */
  async getWorkloadSummary(agentId?: number): Promise<AgentWorkloadStats> {
    let agents: Agent[];

    if (agentId) {
      agents = [await this.get(agentId)];
    } else {
      agents = await this.listActive();
    }

    const stats = agents.map((agent) => ({
      id: agent.id,
      name: getAgentFullName(agent),
      openTickets: agent.openTicketCount || 0,
      ticketsDueToday: agent.ticketsDueToday || 0,
    }));

    const totalOpenTickets = stats.reduce((sum, s) => sum + s.openTickets, 0);
    const totalDueToday = stats.reduce((sum, s) => sum + s.ticketsDueToday, 0);

    return {
      agents: stats,
      totalOpenTickets,
      totalDueToday,
      averageTicketsPerAgent: stats.length > 0 ? totalOpenTickets / stats.length : 0,
    };
  }
}
