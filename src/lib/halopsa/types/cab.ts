/**
 * CAB (Change Advisory Board) types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * CAB meeting decision.
 */
export type CABDecision = 'pending' | 'approved' | 'rejected' | 'deferred' | 'more_info';

/**
 * CAB (Change Advisory Board) entity.
 */
export interface CAB extends HaloBaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
  meetingSchedule?: string;
  defaultDuration?: number;
  chairAgentId?: number;
  chairAgentName?: string;
  secretaryAgentId?: number;
  secretaryAgentName?: string;
  quorumRequired?: number;
  notifyOnSchedule: boolean;
  notifyOnDecision: boolean;
  autoScheduleReview: boolean;
  members?: CABMember[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw CAB from API.
 */
export interface CABApiResponse {
  id: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  meeting_schedule?: string;
  default_duration?: number;
  chair_agent_id?: number;
  chair_agent_name?: string;
  secretary_agent_id?: number;
  secretary_agent_name?: string;
  quorum_required?: number;
  notify_on_schedule?: boolean;
  notify_on_decision?: boolean;
  auto_schedule_review?: boolean;
  members?: CABMemberApiResponse[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * CAB member.
 */
export interface CABMember extends HaloBaseEntity {
  cabId: number;
  agentId: number;
  agentName?: string;
  roleId?: number;
  roleName?: string;
  isVotingMember: boolean;
  isRequired: boolean;
  email?: string;
  addedAt?: string;
}

/**
 * Raw CAB member from API.
 */
export interface CABMemberApiResponse {
  id: number;
  cab_id?: number;
  agent_id?: number;
  agent_name?: string;
  role_id?: number;
  role_name?: string;
  is_voting_member?: boolean;
  is_required?: boolean;
  email?: string;
  added_at?: string;
  [key: string]: unknown;
}

/**
 * CAB role.
 */
export interface CABRole extends HaloBaseEntity {
  name: string;
  description?: string;
  permissions?: string[];
  isChairRole: boolean;
  isSecretaryRole: boolean;
  order?: number;
}

/**
 * Raw CAB role from API.
 */
export interface CABRoleApiResponse {
  id: number;
  name?: string;
  description?: string;
  permissions?: string[];
  is_chair_role?: boolean;
  is_secretary_role?: boolean;
  order?: number;
  [key: string]: unknown;
}

/**
 * CAB meeting/review.
 */
export interface CABMeeting extends HaloBaseEntity {
  cabId: number;
  cabName?: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledDuration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  chairId?: number;
  chairName?: string;
  minutesNotes?: string;
  attendees?: CABMeetingAttendee[];
  reviewItems?: CABReviewItem[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw CAB meeting from API.
 */
export interface CABMeetingApiResponse {
  id: number;
  cab_id?: number;
  cab_name?: string;
  title?: string;
  description?: string;
  scheduled_date?: string;
  scheduled_duration?: number;
  actual_start_time?: string;
  actual_end_time?: string;
  location?: string;
  meeting_link?: string;
  status?: string;
  chair_id?: number;
  chair_name?: string;
  minutes_notes?: string;
  attendees?: CABMeetingAttendeeApiResponse[];
  review_items?: CABReviewItemApiResponse[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * CAB meeting attendee.
 */
export interface CABMeetingAttendee {
  agentId: number;
  agentName?: string;
  attended: boolean;
  voteCast?: CABDecision;
  notes?: string;
}

/**
 * Raw CAB meeting attendee from API.
 */
export interface CABMeetingAttendeeApiResponse {
  agent_id?: number;
  agent_name?: string;
  attended?: boolean;
  vote_cast?: string;
  notes?: string;
  [key: string]: unknown;
}

/**
 * CAB review item (ticket being reviewed).
 */
export interface CABReviewItem extends HaloBaseEntity {
  meetingId: number;
  ticketId: number;
  ticketNumber?: string;
  ticketSummary?: string;
  releaseId?: number;
  releaseName?: string;
  decision: CABDecision;
  decisionNotes?: string;
  decisionDate?: string;
  decidedById?: number;
  decidedByName?: string;
  riskAssessment?: string;
  impactAssessment?: string;
  rollbackPlan?: string;
  order?: number;
}

/**
 * Raw CAB review item from API.
 */
export interface CABReviewItemApiResponse {
  id: number;
  meeting_id?: number;
  ticket_id?: number;
  ticket_number?: string;
  ticket_summary?: string;
  release_id?: number;
  release_name?: string;
  decision?: string;
  decision_notes?: string;
  decision_date?: string;
  decided_by_id?: number;
  decided_by_name?: string;
  risk_assessment?: string;
  impact_assessment?: string;
  rollback_plan?: string;
  order?: number;
  [key: string]: unknown;
}

/**
 * Transform API response to CAB interface.
 */
export function transformCAB(data: CABApiResponse): CAB {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    isActive: data.is_active ?? true,
    meetingSchedule: data.meeting_schedule,
    defaultDuration: data.default_duration,
    chairAgentId: data.chair_agent_id,
    chairAgentName: data.chair_agent_name,
    secretaryAgentId: data.secretary_agent_id,
    secretaryAgentName: data.secretary_agent_name,
    quorumRequired: data.quorum_required,
    notifyOnSchedule: data.notify_on_schedule ?? true,
    notifyOnDecision: data.notify_on_decision ?? true,
    autoScheduleReview: data.auto_schedule_review ?? false,
    members: data.members?.map(transformCABMember),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to CABMember interface.
 */
export function transformCABMember(data: CABMemberApiResponse): CABMember {
  return {
    id: data.id,
    cabId: data.cab_id || 0,
    agentId: data.agent_id || 0,
    agentName: data.agent_name,
    roleId: data.role_id,
    roleName: data.role_name,
    isVotingMember: data.is_voting_member ?? true,
    isRequired: data.is_required ?? false,
    email: data.email,
    addedAt: data.added_at,
  };
}

/**
 * Transform API response to CABRole interface.
 */
export function transformCABRole(data: CABRoleApiResponse): CABRole {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    permissions: data.permissions,
    isChairRole: data.is_chair_role ?? false,
    isSecretaryRole: data.is_secretary_role ?? false,
    order: data.order,
  };
}

/**
 * Transform API response to CABMeeting interface.
 */
export function transformCABMeeting(data: CABMeetingApiResponse): CABMeeting {
  const statusMap: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = {
    scheduled: 'scheduled',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  return {
    id: data.id,
    cabId: data.cab_id || 0,
    cabName: data.cab_name,
    title: data.title || '',
    description: data.description,
    scheduledDate: data.scheduled_date || '',
    scheduledDuration: data.scheduled_duration || 60,
    actualStartTime: data.actual_start_time,
    actualEndTime: data.actual_end_time,
    location: data.location,
    meetingLink: data.meeting_link,
    status: statusMap[data.status || ''] || 'scheduled',
    chairId: data.chair_id,
    chairName: data.chair_name,
    minutesNotes: data.minutes_notes,
    attendees: data.attendees?.map(transformCABMeetingAttendee),
    reviewItems: data.review_items?.map(transformCABReviewItem),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to CABMeetingAttendee interface.
 */
export function transformCABMeetingAttendee(data: CABMeetingAttendeeApiResponse): CABMeetingAttendee {
  const decisionMap: Record<string, CABDecision> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    deferred: 'deferred',
    more_info: 'more_info',
  };

  return {
    agentId: data.agent_id || 0,
    agentName: data.agent_name,
    attended: data.attended ?? false,
    voteCast: decisionMap[data.vote_cast || ''],
    notes: data.notes,
  };
}

/**
 * Transform API response to CABReviewItem interface.
 */
export function transformCABReviewItem(data: CABReviewItemApiResponse): CABReviewItem {
  const decisionMap: Record<string, CABDecision> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    deferred: 'deferred',
    more_info: 'more_info',
  };

  return {
    id: data.id,
    meetingId: data.meeting_id || 0,
    ticketId: data.ticket_id || 0,
    ticketNumber: data.ticket_number,
    ticketSummary: data.ticket_summary,
    releaseId: data.release_id,
    releaseName: data.release_name,
    decision: decisionMap[data.decision || ''] || 'pending',
    decisionNotes: data.decision_notes,
    decisionDate: data.decision_date,
    decidedById: data.decided_by_id,
    decidedByName: data.decided_by_name,
    riskAssessment: data.risk_assessment,
    impactAssessment: data.impact_assessment,
    rollbackPlan: data.rollback_plan,
    order: data.order,
  };
}
