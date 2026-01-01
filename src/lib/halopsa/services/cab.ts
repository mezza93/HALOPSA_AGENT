/**
 * CAB (Change Advisory Board) services for HaloPSA API.
 */

import { BaseService } from './base';
import type { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  CAB,
  CABApiResponse,
  CABMember,
  CABMemberApiResponse,
  CABRole,
  CABRoleApiResponse,
  CABMeeting,
  CABMeetingApiResponse,
  CABReviewItem,
  CABReviewItemApiResponse,
  CABDecision,
  transformCAB,
  transformCABMember,
  transformCABRole,
  transformCABMeeting,
  transformCABReviewItem,
} from '../types/cab';

/**
 * Service for managing CABs.
 */
export class CABService extends BaseService<CAB, CABApiResponse> {
  protected endpoint = '/CAB';

  protected transform(data: CABApiResponse): CAB {
    return transformCAB(data);
  }

  /**
   * List active CABs.
   */
  async listActive(): Promise<CAB[]> {
    return this.list({ is_active: true });
  }

  /**
   * Get CAB with members.
   */
  async getWithMembers(cabId: number): Promise<CAB> {
    return this.get(cabId, { includemembers: true });
  }

  /**
   * Create a new CAB.
   */
  async createCAB(data: {
    name: string;
    description?: string;
    meetingSchedule?: string;
    defaultDuration?: number;
    chairAgentId?: number;
    secretaryAgentId?: number;
    quorumRequired?: number;
    notifyOnSchedule?: boolean;
    notifyOnDecision?: boolean;
    autoScheduleReview?: boolean;
  }): Promise<CAB> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      isActive: true,
      meetingSchedule: data.meetingSchedule,
      defaultDuration: data.defaultDuration,
      chairAgentId: data.chairAgentId,
      secretaryAgentId: data.secretaryAgentId,
      quorumRequired: data.quorumRequired,
      notifyOnSchedule: data.notifyOnSchedule ?? true,
      notifyOnDecision: data.notifyOnDecision ?? true,
      autoScheduleReview: data.autoScheduleReview ?? false,
    }]);
    return result[0];
  }

  /**
   * Update CAB settings.
   */
  async updateCAB(cabId: number, data: Partial<CAB>): Promise<CAB> {
    const result = await this.update([{ id: cabId, ...data }]);
    return result[0];
  }

  /**
   * Set CAB chair.
   */
  async setChair(cabId: number, chairAgentId: number): Promise<CAB> {
    return this.updateCAB(cabId, { chairAgentId });
  }

  /**
   * Set CAB secretary.
   */
  async setSecretary(cabId: number, secretaryAgentId: number): Promise<CAB> {
    return this.updateCAB(cabId, { secretaryAgentId });
  }
}

/**
 * Service for managing CAB members.
 */
export class CABMemberService extends BaseService<CABMember, CABMemberApiResponse> {
  protected endpoint = '/CABMember';

  protected transform(data: CABMemberApiResponse): CABMember {
    return transformCABMember(data);
  }

  /**
   * List members of a CAB.
   */
  async listByCAB(cabId: number): Promise<CABMember[]> {
    return this.list({ cab_id: cabId });
  }

  /**
   * List voting members of a CAB.
   */
  async listVotingMembers(cabId: number): Promise<CABMember[]> {
    return this.list({ cab_id: cabId, is_voting_member: true });
  }

  /**
   * Add a member to a CAB.
   */
  async addMember(data: {
    cabId: number;
    agentId: number;
    roleId?: number;
    isVotingMember?: boolean;
    isRequired?: boolean;
  }): Promise<CABMember> {
    const result = await this.create([{
      id: 0,
      cabId: data.cabId,
      agentId: data.agentId,
      roleId: data.roleId,
      isVotingMember: data.isVotingMember ?? true,
      isRequired: data.isRequired ?? false,
    }]);
    return result[0];
  }

  /**
   * Remove a member from a CAB.
   */
  async removeMember(memberId: number): Promise<void> {
    await this.delete(memberId);
  }

  /**
   * Update member role.
   */
  async updateRole(memberId: number, roleId: number): Promise<CABMember> {
    const result = await this.update([{ id: memberId, roleId }]);
    return result[0];
  }

  /**
   * Set member voting status.
   */
  async setVotingStatus(memberId: number, isVotingMember: boolean): Promise<CABMember> {
    const result = await this.update([{ id: memberId, isVotingMember }]);
    return result[0];
  }
}

/**
 * Service for managing CAB roles.
 */
export class CABRoleService extends BaseService<CABRole, CABRoleApiResponse> {
  protected endpoint = '/CABRole';

  protected transform(data: CABRoleApiResponse): CABRole {
    return transformCABRole(data);
  }

  /**
   * Get chair role.
   */
  async getChairRole(): Promise<CABRole | null> {
    const roles = await this.list({ is_chair_role: true });
    return roles[0] || null;
  }

  /**
   * Get secretary role.
   */
  async getSecretaryRole(): Promise<CABRole | null> {
    const roles = await this.list({ is_secretary_role: true });
    return roles[0] || null;
  }

  /**
   * Create a new CAB role.
   */
  async createRole(data: {
    name: string;
    description?: string;
    permissions?: string[];
    isChairRole?: boolean;
    isSecretaryRole?: boolean;
    order?: number;
  }): Promise<CABRole> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      isChairRole: data.isChairRole ?? false,
      isSecretaryRole: data.isSecretaryRole ?? false,
      order: data.order,
    }]);
    return result[0];
  }
}

/**
 * Service for managing CAB meetings.
 */
export class CABMeetingService extends BaseService<CABMeeting, CABMeetingApiResponse> {
  protected endpoint = '/CABMeeting';

  protected transform(data: CABMeetingApiResponse): CABMeeting {
    return transformCABMeeting(data);
  }

  /**
   * List meetings with filters.
   */
  async listFiltered(filters: {
    cabId?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    startDate?: string;
    endDate?: string;
    chairId?: number;
    count?: number;
  }): Promise<CABMeeting[]> {
    const params: ListParams = {};
    if (filters.cabId) params.cab_id = filters.cabId;
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.chairId) params.chair_id = filters.chairId;
    if (filters.count) params.count = filters.count;
    return this.list(params);
  }

  /**
   * Get upcoming meetings.
   */
  async getUpcoming(count?: number): Promise<CABMeeting[]> {
    return this.listFiltered({
      status: 'scheduled',
      startDate: new Date().toISOString(),
      count,
    });
  }

  /**
   * Get meetings for a CAB.
   */
  async listByCAB(cabId: number): Promise<CABMeeting[]> {
    return this.listFiltered({ cabId });
  }

  /**
   * Schedule a new meeting.
   */
  async scheduleMeeting(data: {
    cabId: number;
    title: string;
    description?: string;
    scheduledDate: string;
    scheduledDuration?: number;
    location?: string;
    meetingLink?: string;
    chairId?: number;
  }): Promise<CABMeeting> {
    const result = await this.create([{
      id: 0,
      cabId: data.cabId,
      title: data.title,
      description: data.description,
      scheduledDate: data.scheduledDate,
      scheduledDuration: data.scheduledDuration || 60,
      location: data.location,
      meetingLink: data.meetingLink,
      status: 'scheduled' as const,
      chairId: data.chairId,
    }]);
    return result[0];
  }

  /**
   * Start a meeting.
   */
  async startMeeting(meetingId: number): Promise<CABMeeting> {
    const result = await this.update([{
      id: meetingId,
      status: 'in_progress' as const,
      actualStartTime: new Date().toISOString(),
    }]);
    return result[0];
  }

  /**
   * End a meeting.
   */
  async endMeeting(meetingId: number, minutesNotes?: string): Promise<CABMeeting> {
    const result = await this.update([{
      id: meetingId,
      status: 'completed' as const,
      actualEndTime: new Date().toISOString(),
      minutesNotes,
    }]);
    return result[0];
  }

  /**
   * Cancel a meeting.
   */
  async cancelMeeting(meetingId: number): Promise<CABMeeting> {
    const result = await this.update([{
      id: meetingId,
      status: 'cancelled' as const,
    }]);
    return result[0];
  }

  /**
   * Update meeting notes.
   */
  async updateNotes(meetingId: number, minutesNotes: string): Promise<CABMeeting> {
    const result = await this.update([{ id: meetingId, minutesNotes }]);
    return result[0];
  }

  /**
   * Get meeting with attendees and review items.
   */
  async getMeetingDetails(meetingId: number): Promise<CABMeeting> {
    return this.get(meetingId, { includeattendees: true, includereviewitems: true });
  }
}

/**
 * Service for managing CAB review items.
 */
export class CABReviewItemService extends BaseService<CABReviewItem, CABReviewItemApiResponse> {
  protected endpoint = '/CABReviewItem';

  protected transform(data: CABReviewItemApiResponse): CABReviewItem {
    return transformCABReviewItem(data);
  }

  /**
   * List review items for a meeting.
   */
  async listByMeeting(meetingId: number): Promise<CABReviewItem[]> {
    return this.list({ meeting_id: meetingId });
  }

  /**
   * List pending review items.
   */
  async listPending(): Promise<CABReviewItem[]> {
    return this.list({ decision: 'pending' });
  }

  /**
   * Add a ticket for review.
   */
  async addForReview(data: {
    meetingId: number;
    ticketId: number;
    releaseId?: number;
    riskAssessment?: string;
    impactAssessment?: string;
    rollbackPlan?: string;
    order?: number;
  }): Promise<CABReviewItem> {
    const result = await this.create([{
      id: 0,
      meetingId: data.meetingId,
      ticketId: data.ticketId,
      releaseId: data.releaseId,
      decision: 'pending' as CABDecision,
      riskAssessment: data.riskAssessment,
      impactAssessment: data.impactAssessment,
      rollbackPlan: data.rollbackPlan,
      order: data.order,
    }]);
    return result[0];
  }

  /**
   * Record a decision on a review item.
   */
  async recordDecision(
    itemId: number,
    decision: CABDecision,
    decidedById: number,
    decisionNotes?: string
  ): Promise<CABReviewItem> {
    const result = await this.update([{
      id: itemId,
      decision,
      decidedById,
      decisionNotes,
      decisionDate: new Date().toISOString(),
    }]);
    return result[0];
  }

  /**
   * Approve a review item.
   */
  async approve(itemId: number, decidedById: number, notes?: string): Promise<CABReviewItem> {
    return this.recordDecision(itemId, 'approved', decidedById, notes);
  }

  /**
   * Reject a review item.
   */
  async reject(itemId: number, decidedById: number, notes: string): Promise<CABReviewItem> {
    return this.recordDecision(itemId, 'rejected', decidedById, notes);
  }

  /**
   * Defer a review item.
   */
  async defer(itemId: number, decidedById: number, notes?: string): Promise<CABReviewItem> {
    return this.recordDecision(itemId, 'deferred', decidedById, notes);
  }

  /**
   * Request more information.
   */
  async requestMoreInfo(itemId: number, decidedById: number, notes: string): Promise<CABReviewItem> {
    return this.recordDecision(itemId, 'more_info', decidedById, notes);
  }

  /**
   * Reorder review items.
   */
  async reorder(itemId: number, newOrder: number): Promise<CABReviewItem> {
    const result = await this.update([{ id: itemId, order: newOrder }]);
    return result[0];
  }

  /**
   * Update risk/impact assessment.
   */
  async updateAssessment(
    itemId: number,
    riskAssessment?: string,
    impactAssessment?: string,
    rollbackPlan?: string
  ): Promise<CABReviewItem> {
    const result = await this.update([{
      id: itemId,
      riskAssessment,
      impactAssessment,
      rollbackPlan,
    }]);
    return result[0];
  }
}

/**
 * Create CAB services for a client.
 */
export function createCABServices(client: HaloPSAClient) {
  return {
    cabs: new CABService(client),
    members: new CABMemberService(client),
    roles: new CABRoleService(client),
    meetings: new CABMeetingService(client),
    reviewItems: new CABReviewItemService(client),
  };
}
