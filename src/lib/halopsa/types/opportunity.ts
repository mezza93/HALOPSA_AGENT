/**
 * Opportunity/Sales types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * Opportunity status.
 */
export type OpportunityStatus = 'open' | 'won' | 'lost';

/**
 * Opportunity entity.
 */
export interface Opportunity extends HaloBaseEntity {
  name: string;
  clientId: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;
  value?: number;
  probability?: number;
  weightedValue?: number;
  stageId?: number;
  stageName?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  agentId?: number;
  agentName?: string;
  teamId?: number;
  teamName?: string;
  description?: string;
  status: OpportunityStatus;
  isWon: boolean;
  isLost: boolean;
  lossReason?: string;
  sourceId?: number;
  sourceName?: string;
  competitorId?: number;
  competitorName?: string;
  productIds?: number[];
  contractValue?: number;
  contractTermMonths?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw opportunity from API.
 */
export interface OpportunityApiResponse {
  id: number;
  name?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  value?: number;
  probability?: number;
  weighted_value?: number;
  stage_id?: number;
  stage_name?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  agent_id?: number;
  agent_name?: string;
  team_id?: number;
  team_name?: string;
  description?: string;
  is_won?: boolean;
  is_lost?: boolean;
  loss_reason?: string;
  source_id?: number;
  source_name?: string;
  competitor_id?: number;
  competitor_name?: string;
  product_ids?: number[];
  contract_value?: number;
  contract_term_months?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Pipeline stage.
 */
export interface PipelineStage extends HaloBaseEntity {
  name: string;
  order: number;
  probability?: number;
  color?: string;
  isDefault?: boolean;
  isClosed?: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

/**
 * Pipeline stage from API.
 */
export interface PipelineStageApiResponse {
  id: number;
  name?: string;
  order?: number;
  probability?: number;
  color?: string;
  is_default?: boolean;
  is_closed?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  [key: string]: unknown;
}

/**
 * Pipeline statistics.
 */
export interface PipelineStats {
  totalOpportunities: number;
  openOpportunities: number;
  totalValue: number;
  weightedValue: number;
  byStage: {
    stageId: number;
    stageName: string;
    count: number;
    value: number;
    weightedValue: number;
  }[];
  wonThisPeriod: number;
  wonValue: number;
  lostThisPeriod: number;
  lostValue: number;
  winRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
}

/**
 * Transform API response to Opportunity interface.
 */
export function transformOpportunity(data: OpportunityApiResponse): Opportunity {
  const isWon = data.is_won ?? false;
  const isLost = data.is_lost ?? false;

  let status: OpportunityStatus = 'open';
  if (isWon) status = 'won';
  else if (isLost) status = 'lost';

  return {
    id: data.id,
    name: data.name || '',
    clientId: data.client_id || 0,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    value: data.value,
    probability: data.probability,
    weightedValue: data.weighted_value,
    stageId: data.stage_id,
    stageName: data.stage_name,
    expectedCloseDate: data.expected_close_date,
    actualCloseDate: data.actual_close_date,
    agentId: data.agent_id,
    agentName: data.agent_name,
    teamId: data.team_id,
    teamName: data.team_name,
    description: data.description,
    status,
    isWon,
    isLost,
    lossReason: data.loss_reason,
    sourceId: data.source_id,
    sourceName: data.source_name,
    competitorId: data.competitor_id,
    competitorName: data.competitor_name,
    productIds: data.product_ids,
    contractValue: data.contract_value,
    contractTermMonths: data.contract_term_months,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to PipelineStage interface.
 */
export function transformPipelineStage(data: PipelineStageApiResponse): PipelineStage {
  return {
    id: data.id,
    name: data.name || '',
    order: data.order || 0,
    probability: data.probability,
    color: data.color,
    isDefault: data.is_default,
    isClosed: data.is_closed,
    isWon: data.is_won,
    isLost: data.is_lost,
  };
}
