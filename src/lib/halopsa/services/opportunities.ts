/**
 * Opportunity/Sales pipeline services for HaloPSA API operations.
 */

import { BaseService } from './base';
import {
  Opportunity,
  OpportunityApiResponse,
  OpportunityStatus,
  PipelineStage,
  PipelineStageApiResponse,
  PipelineStats,
  transformOpportunity,
  transformPipelineStage,
} from '../types/opportunity';
import { ListParams } from '../types/common';

/**
 * Service for opportunity/deal operations.
 */
export class OpportunityService extends BaseService<Opportunity, OpportunityApiResponse> {
  protected endpoint = '/Opportunities';

  protected transform(data: OpportunityApiResponse): Opportunity {
    return transformOpportunity(data);
  }

  /**
   * List opportunities with filters.
   */
  async listFiltered(options: {
    status?: OpportunityStatus | 'all';
    agentId?: number;
    clientId?: number;
    stageId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    count?: number;
  } = {}): Promise<Opportunity[]> {
    const { status, agentId, clientId, stageId, search, startDate, endDate, count = 50 } = options;

    const params: ListParams = { count };

    if (status === 'open') params.open_only = true;
    else if (status === 'won') params.won = true;
    else if (status === 'lost') params.lost = true;

    if (agentId) params.agent_id = agentId;
    if (clientId) params.client_id = clientId;
    if (stageId) params.stage_id = stageId;
    if (search) params.search = search;
    if (startDate) params.startdate = startDate;
    if (endDate) params.enddate = endDate;

    return this.list(params);
  }

  /**
   * List open opportunities.
   */
  async listOpen(options: {
    agentId?: number;
    clientId?: number;
    count?: number;
  } = {}): Promise<Opportunity[]> {
    return this.listFiltered({ ...options, status: 'open' });
  }

  /**
   * List won opportunities.
   */
  async listWon(options: {
    startDate?: string;
    endDate?: string;
    count?: number;
  } = {}): Promise<Opportunity[]> {
    return this.listFiltered({ ...options, status: 'won' });
  }

  /**
   * List lost opportunities.
   */
  async listLost(options: {
    startDate?: string;
    endDate?: string;
    count?: number;
  } = {}): Promise<Opportunity[]> {
    return this.listFiltered({ ...options, status: 'lost' });
  }

  /**
   * List opportunities by pipeline stage.
   */
  async listByStage(stageId: number, count = 50): Promise<Opportunity[]> {
    return this.listFiltered({ stageId, count });
  }

  /**
   * List opportunities by agent.
   */
  async listByAgent(agentId: number, count = 50): Promise<Opportunity[]> {
    return this.listFiltered({ agentId, count });
  }

  /**
   * List opportunities by client.
   */
  async listByClient(clientId: number, count = 50): Promise<Opportunity[]> {
    return this.listFiltered({ clientId, count });
  }

  /**
   * Move opportunity to a different pipeline stage.
   */
  async moveToStage(opportunityId: number, stageId: number, note?: string): Promise<Opportunity> {
    const updateData: Record<string, unknown> = {
      id: opportunityId,
      stage_id: stageId,
    };
    if (note) updateData.note = note;

    const results = await this.update([updateData as Partial<Opportunity>]);
    return results[0];
  }

  /**
   * Mark opportunity as won.
   */
  async markAsWon(opportunityId: number, options: {
    closingNote?: string;
    actualCloseDate?: string;
    value?: number;
  } = {}): Promise<Opportunity> {
    const { closingNote, actualCloseDate, value } = options;

    const updateData: Record<string, unknown> = {
      id: opportunityId,
      is_won: true,
      is_lost: false,
      actual_close_date: actualCloseDate || new Date().toISOString(),
    };

    if (closingNote) updateData.note = closingNote;
    if (value !== undefined) updateData.value = value;

    const results = await this.update([updateData as Partial<Opportunity>]);
    return results[0];
  }

  /**
   * Mark opportunity as lost.
   */
  async markAsLost(opportunityId: number, options: {
    lossReason?: string;
    closingNote?: string;
    competitorId?: number;
  } = {}): Promise<Opportunity> {
    const { lossReason, closingNote, competitorId } = options;

    const updateData: Record<string, unknown> = {
      id: opportunityId,
      is_won: false,
      is_lost: true,
      actual_close_date: new Date().toISOString(),
    };

    if (lossReason) updateData.loss_reason = lossReason;
    if (closingNote) updateData.note = closingNote;
    if (competitorId) updateData.competitor_id = competitorId;

    const results = await this.update([updateData as Partial<Opportunity>]);
    return results[0];
  }

  /**
   * Reopen a closed opportunity.
   */
  async reopen(opportunityId: number): Promise<Opportunity> {
    const updateData: Record<string, unknown> = {
      id: opportunityId,
      is_won: false,
      is_lost: false,
      actual_close_date: null,
    };

    const results = await this.update([updateData as Partial<Opportunity>]);
    return results[0];
  }

  /**
   * Get pipeline statistics.
   */
  async getPipelineStats(options: {
    agentId?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PipelineStats> {
    const opportunities = await this.listFiltered({
      ...options,
      status: 'all',
      count: 1000,
    });

    const openOpps = opportunities.filter(o => !o.isWon && !o.isLost);
    const wonOpps = opportunities.filter(o => o.isWon);
    const lostOpps = opportunities.filter(o => o.isLost);

    // Group by stage
    const byStage: Map<number, { stageName: string; count: number; value: number; weightedValue: number }> = new Map();
    for (const opp of openOpps) {
      const stageId = opp.stageId || 0;
      const existing = byStage.get(stageId) || { stageName: opp.stageName || 'Unknown', count: 0, value: 0, weightedValue: 0 };
      existing.count++;
      existing.value += opp.value || 0;
      existing.weightedValue += opp.weightedValue || 0;
      byStage.set(stageId, existing);
    }

    const totalValue = openOpps.reduce((sum, o) => sum + (o.value || 0), 0);
    const weightedValue = openOpps.reduce((sum, o) => sum + (o.weightedValue || 0), 0);
    const wonValue = wonOpps.reduce((sum, o) => sum + (o.value || 0), 0);
    const lostValue = lostOpps.reduce((sum, o) => sum + (o.value || 0), 0);

    const totalClosed = wonOpps.length + lostOpps.length;
    const winRate = totalClosed > 0 ? (wonOpps.length / totalClosed) * 100 : 0;
    const averageDealSize = wonOpps.length > 0 ? wonValue / wonOpps.length : 0;

    return {
      totalOpportunities: opportunities.length,
      openOpportunities: openOpps.length,
      totalValue,
      weightedValue,
      byStage: Array.from(byStage.entries()).map(([stageId, data]) => ({
        stageId,
        stageName: data.stageName,
        count: data.count,
        value: data.value,
        weightedValue: data.weightedValue,
      })),
      wonThisPeriod: wonOpps.length,
      wonValue,
      lostThisPeriod: lostOpps.length,
      lostValue,
      winRate: Math.round(winRate * 100) / 100,
      averageDealSize: Math.round(averageDealSize * 100) / 100,
      averageSalesCycle: 0, // Would need to calculate from dates
    };
  }
}

/**
 * Service for pipeline stage operations.
 */
export class PipelineStageService extends BaseService<PipelineStage, PipelineStageApiResponse> {
  protected endpoint = '/OpportunityStage';

  protected transform(data: PipelineStageApiResponse): PipelineStage {
    return transformPipelineStage(data);
  }

  /**
   * List all pipeline stages in order.
   */
  async listOrdered(): Promise<PipelineStage[]> {
    const stages = await this.list();
    return stages.sort((a, b) => a.order - b.order);
  }

  /**
   * Get the default stage for new opportunities.
   */
  async getDefault(): Promise<PipelineStage | null> {
    const stages = await this.list();
    return stages.find(s => s.isDefault) || stages[0] || null;
  }

  /**
   * Get won stage.
   */
  async getWonStage(): Promise<PipelineStage | null> {
    const stages = await this.list();
    return stages.find(s => s.isWon) || null;
  }

  /**
   * Get lost stage.
   */
  async getLostStage(): Promise<PipelineStage | null> {
    const stages = await this.list();
    return stages.find(s => s.isLost) || null;
  }
}
