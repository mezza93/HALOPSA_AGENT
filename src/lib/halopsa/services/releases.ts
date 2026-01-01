/**
 * Release Management services for HaloPSA API.
 */

import { BaseService } from './base';
import type { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  Release,
  ReleaseApiResponse,
  ReleaseType,
  ReleaseTypeApiResponse,
  ReleasePipeline,
  ReleasePipelineApiResponse,
  ReleasePipelineStage,
  ReleasePipelineStageApiResponse,
  ReleaseStatus,
  ReleaseRisk,
  ReleaseCalendar,
  transformRelease,
  transformReleaseType,
  transformReleasePipeline,
  transformReleasePipelineStage,
} from '../types/release';

/**
 * Service for managing releases.
 */
export class ReleaseService extends BaseService<Release, ReleaseApiResponse> {
  protected endpoint = '/Release';

  protected transform(data: ReleaseApiResponse): Release {
    return transformRelease(data);
  }

  /**
   * List releases with filters.
   */
  async listFiltered(filters: {
    status?: ReleaseStatus;
    risk?: ReleaseRisk;
    typeId?: number;
    pipelineId?: number;
    stageId?: number;
    ownerId?: number;
    teamId?: number;
    clientId?: number;
    cabRequired?: boolean;
    cabApproved?: boolean;
    startDate?: string;
    endDate?: string;
    count?: number;
  }): Promise<Release[]> {
    const params: ListParams = {};
    if (filters.status) params.status = filters.status;
    if (filters.risk) params.risk = filters.risk;
    if (filters.typeId) params.type_id = filters.typeId;
    if (filters.pipelineId) params.pipeline_id = filters.pipelineId;
    if (filters.stageId) params.stage_id = filters.stageId;
    if (filters.ownerId) params.owner_id = filters.ownerId;
    if (filters.teamId) params.team_id = filters.teamId;
    if (filters.clientId) params.client_id = filters.clientId;
    if (filters.cabRequired !== undefined) params.cab_required = filters.cabRequired;
    if (filters.cabApproved !== undefined) params.cab_approved = filters.cabApproved;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.count) params.count = filters.count;
    return this.list(params);
  }

  /**
   * Get releases by status.
   */
  async listByStatus(status: ReleaseStatus): Promise<Release[]> {
    return this.listFiltered({ status });
  }

  /**
   * Get releases requiring CAB approval.
   */
  async listRequiringCAB(): Promise<Release[]> {
    return this.listFiltered({ cabRequired: true, cabApproved: false });
  }

  /**
   * Get high-risk releases.
   */
  async listHighRisk(): Promise<Release[]> {
    return this.list({ risk: 'high,critical' });
  }

  /**
   * Create a new release.
   */
  async createRelease(data: {
    name: string;
    description?: string;
    version?: string;
    typeId?: number;
    pipelineId?: number;
    risk?: ReleaseRisk;
    plannedStartDate?: string;
    plannedEndDate?: string;
    ownerId?: number;
    teamId?: number;
    clientId?: number;
    ticketIds?: number[];
    cabRequired?: boolean;
    rollbackPlan?: string;
    testPlan?: string;
    deploymentNotes?: string;
    impactAssessment?: string;
  }): Promise<Release> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      version: data.version,
      status: 'draft' as ReleaseStatus,
      typeId: data.typeId,
      pipelineId: data.pipelineId,
      risk: data.risk || 'low',
      plannedStartDate: data.plannedStartDate,
      plannedEndDate: data.plannedEndDate,
      ownerId: data.ownerId,
      teamId: data.teamId,
      clientId: data.clientId,
      ticketIds: data.ticketIds,
      cabRequired: data.cabRequired ?? false,
      rollbackPlan: data.rollbackPlan,
      testPlan: data.testPlan,
      deploymentNotes: data.deploymentNotes,
      impactAssessment: data.impactAssessment,
    }]);
    return result[0];
  }

  /**
   * Update release status.
   */
  async updateStatus(releaseId: number, status: ReleaseStatus): Promise<Release> {
    const updates: Partial<Release> = { id: releaseId, status };
    if (status === 'in_progress') {
      updates.actualStartDate = new Date().toISOString();
    } else if (status === 'deployed' || status === 'completed' || status === 'rolled_back') {
      updates.actualEndDate = new Date().toISOString();
    }
    const result = await this.update([updates]);
    return result[0];
  }

  /**
   * Move release to next pipeline stage.
   */
  async advanceStage(releaseId: number, nextStageId: number): Promise<Release> {
    const result = await this.update([{ id: releaseId, stageId: nextStageId }]);
    return result[0];
  }

  /**
   * Set CAB approval status.
   */
  async setCABApproval(releaseId: number, approved: boolean, notes?: string): Promise<Release> {
    const result = await this.update([{
      id: releaseId,
      cabApproved: approved,
      cabApprovedAt: approved ? new Date().toISOString() : undefined,
      cabNotes: notes,
    }]);
    return result[0];
  }

  /**
   * Add tickets to a release.
   */
  async addTickets(releaseId: number, ticketIds: number[]): Promise<Release> {
    const release = await this.get(releaseId);
    const existingTickets = release.ticketIds || [];
    const newTickets = [...new Set([...existingTickets, ...ticketIds])];
    const result = await this.update([{ id: releaseId, ticketIds: newTickets }]);
    return result[0];
  }

  /**
   * Remove tickets from a release.
   */
  async removeTickets(releaseId: number, ticketIds: number[]): Promise<Release> {
    const release = await this.get(releaseId);
    const existingTickets = release.ticketIds || [];
    const newTickets = existingTickets.filter(id => !ticketIds.includes(id));
    const result = await this.update([{ id: releaseId, ticketIds: newTickets }]);
    return result[0];
  }

  /**
   * Get release calendar view.
   */
  async getCalendar(startDate: string, endDate: string): Promise<ReleaseCalendar> {
    const releases = await this.listFiltered({ startDate, endDate });

    const byStatus = new Map<ReleaseStatus, number>();
    const byRisk = new Map<ReleaseRisk, number>();

    for (const release of releases) {
      byStatus.set(release.status, (byStatus.get(release.status) || 0) + 1);
      byRisk.set(release.risk, (byRisk.get(release.risk) || 0) + 1);
    }

    return {
      startDate,
      endDate,
      releases,
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      byRisk: Array.from(byRisk.entries()).map(([risk, count]) => ({ risk, count })),
    };
  }

  /**
   * Search releases.
   */
  async search(query: string): Promise<Release[]> {
    return this.list({ search: query });
  }
}

/**
 * Service for managing release types.
 */
export class ReleaseTypeService extends BaseService<ReleaseType, ReleaseTypeApiResponse> {
  protected endpoint = '/ReleaseType';

  protected transform(data: ReleaseTypeApiResponse): ReleaseType {
    return transformReleaseType(data);
  }

  /**
   * List active release types.
   */
  async listActive(): Promise<ReleaseType[]> {
    return this.list({ is_active: true });
  }

  /**
   * Get types that require CAB approval.
   */
  async listCABRequired(): Promise<ReleaseType[]> {
    return this.list({ cab_required: true });
  }

  /**
   * Create a new release type.
   */
  async createType(data: {
    name: string;
    description?: string;
    color?: string;
    defaultPipelineId?: number;
    defaultRisk?: ReleaseRisk;
    cabRequired?: boolean;
    order?: number;
  }): Promise<ReleaseType> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      color: data.color,
      isActive: true,
      defaultPipelineId: data.defaultPipelineId,
      defaultRisk: data.defaultRisk,
      cabRequired: data.cabRequired ?? false,
      order: data.order,
    }]);
    return result[0];
  }
}

/**
 * Service for managing release pipelines.
 */
export class ReleasePipelineService extends BaseService<ReleasePipeline, ReleasePipelineApiResponse> {
  protected endpoint = '/ReleasePipeline';

  protected transform(data: ReleasePipelineApiResponse): ReleasePipeline {
    return transformReleasePipeline(data);
  }

  /**
   * List active pipelines.
   */
  async listActive(): Promise<ReleasePipeline[]> {
    return this.list({ is_active: true });
  }

  /**
   * Get pipeline with stages.
   */
  async getWithStages(pipelineId: number): Promise<ReleasePipeline> {
    return this.get(pipelineId, { includestages: true });
  }

  /**
   * Create a new pipeline.
   */
  async createPipeline(data: {
    name: string;
    description?: string;
    stages?: Array<{
      name: string;
      order: number;
      color?: string;
      requiresApproval?: boolean;
      isFinal?: boolean;
      isDeployStage?: boolean;
    }>;
  }): Promise<ReleasePipeline> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      isActive: true,
      stages: data.stages?.map((s, idx) => ({
        id: 0,
        pipelineId: 0,
        name: s.name,
        order: s.order ?? idx,
        color: s.color,
        requiresApproval: s.requiresApproval ?? false,
        isFinal: s.isFinal ?? false,
        isDeployStage: s.isDeployStage ?? false,
      })) || [],
    }]);
    return result[0];
  }
}

/**
 * Service for managing pipeline stages.
 */
export class ReleasePipelineStageService extends BaseService<ReleasePipelineStage, ReleasePipelineStageApiResponse> {
  protected endpoint = '/ReleasePipelineStage';

  protected transform(data: ReleasePipelineStageApiResponse): ReleasePipelineStage {
    return transformReleasePipelineStage(data);
  }

  /**
   * List stages for a pipeline.
   */
  async listByPipeline(pipelineId: number): Promise<ReleasePipelineStage[]> {
    return this.list({ pipeline_id: pipelineId });
  }

  /**
   * Get deploy stages.
   */
  async listDeployStages(): Promise<ReleasePipelineStage[]> {
    return this.list({ is_deploy_stage: true });
  }

  /**
   * Create a new stage.
   */
  async createStage(data: {
    pipelineId: number;
    name: string;
    order: number;
    color?: string;
    requiresApproval?: boolean;
    isFinal?: boolean;
    isDeployStage?: boolean;
  }): Promise<ReleasePipelineStage> {
    const result = await this.create([{
      id: 0,
      pipelineId: data.pipelineId,
      name: data.name,
      order: data.order,
      color: data.color,
      requiresApproval: data.requiresApproval ?? false,
      isFinal: data.isFinal ?? false,
      isDeployStage: data.isDeployStage ?? false,
    }]);
    return result[0];
  }

  /**
   * Reorder a stage.
   */
  async reorderStage(stageId: number, newOrder: number): Promise<ReleasePipelineStage> {
    const result = await this.update([{ id: stageId, order: newOrder }]);
    return result[0];
  }
}

/**
 * Create release services for a client.
 */
export function createReleaseServices(client: HaloPSAClient) {
  return {
    releases: new ReleaseService(client),
    types: new ReleaseTypeService(client),
    pipelines: new ReleasePipelineService(client),
    stages: new ReleasePipelineStageService(client),
  };
}
