/**
 * Release Management types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * Release status.
 */
export type ReleaseStatus = 'draft' | 'planning' | 'scheduled' | 'in_progress' | 'deployed' | 'completed' | 'cancelled' | 'rolled_back';

/**
 * Release risk level.
 */
export type ReleaseRisk = 'low' | 'medium' | 'high' | 'critical';

/**
 * Release entity.
 */
export interface Release extends HaloBaseEntity {
  name: string;
  description?: string;
  version?: string;
  status: ReleaseStatus;
  typeId?: number;
  typeName?: string;
  pipelineId?: number;
  pipelineName?: string;
  stageId?: number;
  stageName?: string;
  risk: ReleaseRisk;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  ownerId?: number;
  ownerName?: string;
  teamId?: number;
  teamName?: string;
  clientId?: number;
  clientName?: string;
  ticketIds?: number[];
  ticketCount?: number;
  changeCount?: number;
  cabRequired: boolean;
  cabApproved?: boolean;
  cabApprovedAt?: string;
  cabNotes?: string;
  rollbackPlan?: string;
  testPlan?: string;
  deploymentNotes?: string;
  impactAssessment?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw release from API.
 */
export interface ReleaseApiResponse {
  id: number;
  name?: string;
  description?: string;
  version?: string;
  status?: string;
  type_id?: number;
  type_name?: string;
  pipeline_id?: number;
  pipeline_name?: string;
  stage_id?: number;
  stage_name?: string;
  risk?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  owner_id?: number;
  owner_name?: string;
  team_id?: number;
  team_name?: string;
  client_id?: number;
  client_name?: string;
  ticket_ids?: number[];
  ticket_count?: number;
  change_count?: number;
  cab_required?: boolean;
  cab_approved?: boolean;
  cab_approved_at?: string;
  cab_notes?: string;
  rollback_plan?: string;
  test_plan?: string;
  deployment_notes?: string;
  impact_assessment?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Release type definition.
 */
export interface ReleaseType extends HaloBaseEntity {
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  defaultPipelineId?: number;
  defaultRisk?: ReleaseRisk;
  cabRequired: boolean;
  order?: number;
}

/**
 * Raw release type from API.
 */
export interface ReleaseTypeApiResponse {
  id: number;
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  default_pipeline_id?: number;
  default_risk?: string;
  cab_required?: boolean;
  order?: number;
  [key: string]: unknown;
}

/**
 * Release pipeline definition.
 */
export interface ReleasePipeline extends HaloBaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
  stages: ReleasePipelineStage[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw release pipeline from API.
 */
export interface ReleasePipelineApiResponse {
  id: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  stages?: ReleasePipelineStageApiResponse[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Release pipeline stage.
 */
export interface ReleasePipelineStage extends HaloBaseEntity {
  pipelineId: number;
  name: string;
  order: number;
  color?: string;
  requiresApproval: boolean;
  isFinal: boolean;
  isDeployStage: boolean;
}

/**
 * Raw release pipeline stage from API.
 */
export interface ReleasePipelineStageApiResponse {
  id: number;
  pipeline_id?: number;
  name?: string;
  order?: number;
  color?: string;
  requires_approval?: boolean;
  is_final?: boolean;
  is_deploy_stage?: boolean;
  [key: string]: unknown;
}

/**
 * Release calendar view.
 */
export interface ReleaseCalendar {
  startDate: string;
  endDate: string;
  releases: Release[];
  byStatus: {
    status: ReleaseStatus;
    count: number;
  }[];
  byRisk: {
    risk: ReleaseRisk;
    count: number;
  }[];
}

/**
 * Transform API response to Release interface.
 */
export function transformRelease(data: ReleaseApiResponse): Release {
  const statusMap: Record<string, ReleaseStatus> = {
    draft: 'draft',
    planning: 'planning',
    scheduled: 'scheduled',
    in_progress: 'in_progress',
    deployed: 'deployed',
    completed: 'completed',
    cancelled: 'cancelled',
    rolled_back: 'rolled_back',
  };

  const riskMap: Record<string, ReleaseRisk> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };

  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    version: data.version,
    status: statusMap[data.status || ''] || 'draft',
    typeId: data.type_id,
    typeName: data.type_name,
    pipelineId: data.pipeline_id,
    pipelineName: data.pipeline_name,
    stageId: data.stage_id,
    stageName: data.stage_name,
    risk: riskMap[data.risk || ''] || 'low',
    plannedStartDate: data.planned_start_date,
    plannedEndDate: data.planned_end_date,
    actualStartDate: data.actual_start_date,
    actualEndDate: data.actual_end_date,
    ownerId: data.owner_id,
    ownerName: data.owner_name,
    teamId: data.team_id,
    teamName: data.team_name,
    clientId: data.client_id,
    clientName: data.client_name,
    ticketIds: data.ticket_ids,
    ticketCount: data.ticket_count,
    changeCount: data.change_count,
    cabRequired: data.cab_required ?? false,
    cabApproved: data.cab_approved,
    cabApprovedAt: data.cab_approved_at,
    cabNotes: data.cab_notes,
    rollbackPlan: data.rollback_plan,
    testPlan: data.test_plan,
    deploymentNotes: data.deployment_notes,
    impactAssessment: data.impact_assessment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ReleaseType interface.
 */
export function transformReleaseType(data: ReleaseTypeApiResponse): ReleaseType {
  const riskMap: Record<string, ReleaseRisk> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };

  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    color: data.color,
    isActive: data.is_active ?? true,
    defaultPipelineId: data.default_pipeline_id,
    defaultRisk: riskMap[data.default_risk || ''],
    cabRequired: data.cab_required ?? false,
    order: data.order,
  };
}

/**
 * Transform API response to ReleasePipeline interface.
 */
export function transformReleasePipeline(data: ReleasePipelineApiResponse): ReleasePipeline {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    isActive: data.is_active ?? true,
    stages: data.stages?.map(transformReleasePipelineStage) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ReleasePipelineStage interface.
 */
export function transformReleasePipelineStage(data: ReleasePipelineStageApiResponse): ReleasePipelineStage {
  return {
    id: data.id,
    pipelineId: data.pipeline_id || 0,
    name: data.name || '',
    order: data.order || 0,
    color: data.color,
    requiresApproval: data.requires_approval ?? false,
    isFinal: data.is_final ?? false,
    isDeployStage: data.is_deploy_stage ?? false,
  };
}
