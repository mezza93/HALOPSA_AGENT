/**
 * Approval Process types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * Approval status.
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'delegated' | 'expired';

/**
 * Approval process definition.
 */
export interface ApprovalProcess extends HaloBaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
  requiresAllApprovers: boolean;
  minApprovers?: number;
  expiryDays?: number;
  autoEscalate: boolean;
  escalationAgentId?: number;
  escalationAgentName?: string;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  rules?: ApprovalProcessRule[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw approval process from API.
 */
export interface ApprovalProcessApiResponse {
  id: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  requires_all_approvers?: boolean;
  min_approvers?: number;
  expiry_days?: number;
  auto_escalate?: boolean;
  escalation_agent_id?: number;
  escalation_agent_name?: string;
  notify_on_approval?: boolean;
  notify_on_rejection?: boolean;
  rules?: ApprovalProcessRuleApiResponse[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Approval process rule.
 */
export interface ApprovalProcessRule extends HaloBaseEntity {
  processId: number;
  name: string;
  order: number;
  conditionType?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  approverType: 'agent' | 'team' | 'manager' | 'custom';
  approverId?: number;
  approverName?: string;
  isRequired: boolean;
  createdAt?: string;
}

/**
 * Raw approval process rule from API.
 */
export interface ApprovalProcessRuleApiResponse {
  id: number;
  process_id?: number;
  name?: string;
  order?: number;
  condition_type?: string;
  condition_field?: string;
  condition_operator?: string;
  condition_value?: string;
  approver_type?: string;
  approver_id?: number;
  approver_name?: string;
  is_required?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

/**
 * Ticket approval request.
 */
export interface TicketApproval extends HaloBaseEntity {
  ticketId: number;
  ticketNumber?: string;
  ticketSummary?: string;
  processId: number;
  processName?: string;
  status: ApprovalStatus;
  requestedById?: number;
  requestedByName?: string;
  requestedAt: string;
  approverId?: number;
  approverName?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  rejectionReason?: string;
  delegatedToId?: number;
  delegatedToName?: string;
  delegatedAt?: string;
  expiresAt?: string;
  isExpired: boolean;
  priority?: string;
  clientId?: number;
  clientName?: string;
}

/**
 * Raw ticket approval from API.
 */
export interface TicketApprovalApiResponse {
  id: number;
  ticket_id?: number;
  ticket_number?: string;
  ticket_summary?: string;
  process_id?: number;
  process_name?: string;
  status?: string;
  requested_by_id?: number;
  requested_by_name?: string;
  requested_at?: string;
  approver_id?: number;
  approver_name?: string;
  approved_at?: string;
  rejected_at?: string;
  comments?: string;
  rejection_reason?: string;
  delegated_to_id?: number;
  delegated_to_name?: string;
  delegated_at?: string;
  expires_at?: string;
  is_expired?: boolean;
  priority?: string;
  client_id?: number;
  client_name?: string;
  [key: string]: unknown;
}

/**
 * Approval statistics.
 */
export interface ApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalExpired: number;
  averageApprovalTimeHours: number;
  byProcess: {
    processId: number;
    processName: string;
    pending: number;
    approved: number;
    rejected: number;
  }[];
  byApprover: {
    approverId: number;
    approverName: string;
    pending: number;
    approved: number;
    rejected: number;
    avgResponseTimeHours: number;
  }[];
}

/**
 * Transform API response to ApprovalProcess interface.
 */
export function transformApprovalProcess(data: ApprovalProcessApiResponse): ApprovalProcess {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    isActive: data.is_active ?? true,
    requiresAllApprovers: data.requires_all_approvers ?? false,
    minApprovers: data.min_approvers,
    expiryDays: data.expiry_days,
    autoEscalate: data.auto_escalate ?? false,
    escalationAgentId: data.escalation_agent_id,
    escalationAgentName: data.escalation_agent_name,
    notifyOnApproval: data.notify_on_approval ?? true,
    notifyOnRejection: data.notify_on_rejection ?? true,
    rules: data.rules?.map(transformApprovalProcessRule),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ApprovalProcessRule interface.
 */
export function transformApprovalProcessRule(data: ApprovalProcessRuleApiResponse): ApprovalProcessRule {
  const approverTypeMap: Record<string, 'agent' | 'team' | 'manager' | 'custom'> = {
    agent: 'agent',
    team: 'team',
    manager: 'manager',
    custom: 'custom',
  };

  return {
    id: data.id,
    processId: data.process_id || 0,
    name: data.name || '',
    order: data.order || 0,
    conditionType: data.condition_type,
    conditionField: data.condition_field,
    conditionOperator: data.condition_operator,
    conditionValue: data.condition_value,
    approverType: approverTypeMap[data.approver_type || ''] || 'agent',
    approverId: data.approver_id,
    approverName: data.approver_name,
    isRequired: data.is_required ?? true,
    createdAt: data.created_at,
  };
}

/**
 * Transform API response to TicketApproval interface.
 */
export function transformTicketApproval(data: TicketApprovalApiResponse): TicketApproval {
  const statusMap: Record<string, ApprovalStatus> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    delegated: 'delegated',
    expired: 'expired',
  };

  return {
    id: data.id,
    ticketId: data.ticket_id || 0,
    ticketNumber: data.ticket_number,
    ticketSummary: data.ticket_summary,
    processId: data.process_id || 0,
    processName: data.process_name,
    status: statusMap[data.status || ''] || 'pending',
    requestedById: data.requested_by_id,
    requestedByName: data.requested_by_name,
    requestedAt: data.requested_at || '',
    approverId: data.approver_id,
    approverName: data.approver_name,
    approvedAt: data.approved_at,
    rejectedAt: data.rejected_at,
    comments: data.comments,
    rejectionReason: data.rejection_reason,
    delegatedToId: data.delegated_to_id,
    delegatedToName: data.delegated_to_name,
    delegatedAt: data.delegated_at,
    expiresAt: data.expires_at,
    isExpired: data.is_expired ?? false,
    priority: data.priority,
    clientId: data.client_id,
    clientName: data.client_name,
  };
}
