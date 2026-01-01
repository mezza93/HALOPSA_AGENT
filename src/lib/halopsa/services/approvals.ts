/**
 * Approval Process services for HaloPSA API.
 */

import { BaseService } from './base';
import type { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  ApprovalProcess,
  ApprovalProcessApiResponse,
  ApprovalProcessRule,
  ApprovalProcessRuleApiResponse,
  TicketApproval,
  TicketApprovalApiResponse,
  ApprovalStatus,
  ApprovalStats,
  transformApprovalProcess,
  transformApprovalProcessRule,
  transformTicketApproval,
} from '../types/approval';

/**
 * Service for managing approval process definitions.
 */
export class ApprovalProcessService extends BaseService<ApprovalProcess, ApprovalProcessApiResponse> {
  protected endpoint = '/ApprovalProcess';

  protected transform(data: ApprovalProcessApiResponse): ApprovalProcess {
    return transformApprovalProcess(data);
  }

  /**
   * List active approval processes.
   */
  async listActive(): Promise<ApprovalProcess[]> {
    return this.list({ is_active: true });
  }

  /**
   * Get approval process with rules.
   */
  async getWithRules(processId: number): Promise<ApprovalProcess> {
    return this.get(processId, { includerules: true });
  }

  /**
   * Create a new approval process.
   */
  async createProcess(data: {
    name: string;
    description?: string;
    requiresAllApprovers?: boolean;
    minApprovers?: number;
    expiryDays?: number;
    autoEscalate?: boolean;
    escalationAgentId?: number;
    notifyOnApproval?: boolean;
    notifyOnRejection?: boolean;
  }): Promise<ApprovalProcess> {
    const result = await this.create([{
      id: 0,
      name: data.name,
      description: data.description,
      requiresAllApprovers: data.requiresAllApprovers ?? false,
      minApprovers: data.minApprovers,
      expiryDays: data.expiryDays,
      autoEscalate: data.autoEscalate ?? false,
      escalationAgentId: data.escalationAgentId,
      notifyOnApproval: data.notifyOnApproval ?? true,
      notifyOnRejection: data.notifyOnRejection ?? true,
      isActive: true,
    }]);
    return result[0];
  }

  /**
   * Update an approval process.
   */
  async updateProcess(processId: number, data: Partial<ApprovalProcess>): Promise<ApprovalProcess> {
    const result = await this.update([{ id: processId, ...data }]);
    return result[0];
  }

  /**
   * Activate/deactivate an approval process.
   */
  async setActive(processId: number, isActive: boolean): Promise<ApprovalProcess> {
    return this.updateProcess(processId, { isActive });
  }
}

/**
 * Service for managing approval process rules.
 */
export class ApprovalProcessRuleService extends BaseService<ApprovalProcessRule, ApprovalProcessRuleApiResponse> {
  protected endpoint = '/ApprovalProcessRule';

  protected transform(data: ApprovalProcessRuleApiResponse): ApprovalProcessRule {
    return transformApprovalProcessRule(data);
  }

  /**
   * List rules for a specific approval process.
   */
  async listByProcess(processId: number): Promise<ApprovalProcessRule[]> {
    return this.list({ process_id: processId });
  }

  /**
   * Create a new approval rule.
   */
  async createRule(data: {
    processId: number;
    name: string;
    order?: number;
    conditionType?: string;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
    approverType: 'agent' | 'team' | 'manager' | 'custom';
    approverId?: number;
    isRequired?: boolean;
  }): Promise<ApprovalProcessRule> {
    const result = await this.create([{
      id: 0,
      processId: data.processId,
      name: data.name,
      order: data.order || 0,
      conditionType: data.conditionType,
      conditionField: data.conditionField,
      conditionOperator: data.conditionOperator,
      conditionValue: data.conditionValue,
      approverType: data.approverType,
      approverId: data.approverId,
      isRequired: data.isRequired ?? true,
    }]);
    return result[0];
  }

  /**
   * Update a rule's order.
   */
  async reorderRule(ruleId: number, newOrder: number): Promise<ApprovalProcessRule> {
    const result = await this.update([{ id: ruleId, order: newOrder }]);
    return result[0];
  }
}

/**
 * Service for managing ticket approvals.
 */
export class TicketApprovalService extends BaseService<TicketApproval, TicketApprovalApiResponse> {
  protected endpoint = '/TicketApproval';

  protected transform(data: TicketApprovalApiResponse): TicketApproval {
    return transformTicketApproval(data);
  }

  /**
   * List approvals with filters.
   */
  async listFiltered(filters: {
    ticketId?: number;
    processId?: number;
    approverId?: number;
    status?: ApprovalStatus;
    clientId?: number;
    includePending?: boolean;
    includeExpired?: boolean;
    count?: number;
  }): Promise<TicketApproval[]> {
    const params: ListParams = {};
    if (filters.ticketId) params.ticket_id = filters.ticketId;
    if (filters.processId) params.process_id = filters.processId;
    if (filters.approverId) params.approver_id = filters.approverId;
    if (filters.status) params.status = filters.status;
    if (filters.clientId) params.client_id = filters.clientId;
    if (filters.includePending) params.include_pending = true;
    if (filters.includeExpired) params.include_expired = true;
    if (filters.count) params.count = filters.count;
    return this.list(params);
  }

  /**
   * Get pending approvals for an approver.
   */
  async getPendingForApprover(approverId: number): Promise<TicketApproval[]> {
    return this.listFiltered({
      approverId,
      status: 'pending',
      includePending: true,
    });
  }

  /**
   * Get approvals for a ticket.
   */
  async getForTicket(ticketId: number): Promise<TicketApproval[]> {
    return this.listFiltered({ ticketId });
  }

  /**
   * Request approval for a ticket.
   */
  async requestApproval(data: {
    ticketId: number;
    processId: number;
    requestedById?: number;
    comments?: string;
    priority?: string;
  }): Promise<TicketApproval> {
    const result = await this.create([{
      id: 0,
      ticketId: data.ticketId,
      processId: data.processId,
      status: 'pending' as ApprovalStatus,
      requestedById: data.requestedById,
      requestedAt: new Date().toISOString(),
      comments: data.comments,
      priority: data.priority,
      isExpired: false,
    }]);
    return result[0];
  }

  /**
   * Approve a ticket approval request.
   */
  async approve(approvalId: number, approverId: number, comments?: string): Promise<TicketApproval> {
    const result = await this.update([{
      id: approvalId,
      status: 'approved' as ApprovalStatus,
      approverId,
      approvedAt: new Date().toISOString(),
      comments,
    }]);
    return result[0];
  }

  /**
   * Reject a ticket approval request.
   */
  async reject(approvalId: number, rejectionReason: string): Promise<TicketApproval> {
    const result = await this.update([{
      id: approvalId,
      status: 'rejected' as ApprovalStatus,
      rejectedAt: new Date().toISOString(),
      rejectionReason,
    }]);
    return result[0];
  }

  /**
   * Delegate an approval to another agent.
   */
  async delegate(approvalId: number, delegatedToId: number): Promise<TicketApproval> {
    const result = await this.update([{
      id: approvalId,
      status: 'delegated' as ApprovalStatus,
      delegatedToId,
      delegatedAt: new Date().toISOString(),
    }]);
    return result[0];
  }

  /**
   * Get approval statistics.
   */
  async getStats(filters?: {
    processId?: number;
    approverId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApprovalStats> {
    const params: ListParams = {};
    if (filters?.processId) params.process_id = filters.processId;
    if (filters?.approverId) params.approver_id = filters.approverId;
    if (filters?.startDate) params.start_date = filters.startDate;
    if (filters?.endDate) params.end_date = filters.endDate;

    const data = await this.client.get<{
      total_pending: number;
      total_approved: number;
      total_rejected: number;
      total_expired: number;
      average_approval_time_hours: number;
      by_process: Array<{
        process_id: number;
        process_name: string;
        pending: number;
        approved: number;
        rejected: number;
      }>;
      by_approver: Array<{
        approver_id: number;
        approver_name: string;
        pending: number;
        approved: number;
        rejected: number;
        avg_response_time_hours: number;
      }>;
    }>(`${this.endpoint}/stats`, params);

    return {
      totalPending: data.total_pending || 0,
      totalApproved: data.total_approved || 0,
      totalRejected: data.total_rejected || 0,
      totalExpired: data.total_expired || 0,
      averageApprovalTimeHours: data.average_approval_time_hours || 0,
      byProcess: (data.by_process || []).map(p => ({
        processId: p.process_id,
        processName: p.process_name,
        pending: p.pending,
        approved: p.approved,
        rejected: p.rejected,
      })),
      byApprover: (data.by_approver || []).map(a => ({
        approverId: a.approver_id,
        approverName: a.approver_name,
        pending: a.pending,
        approved: a.approved,
        rejected: a.rejected,
        avgResponseTimeHours: a.avg_response_time_hours,
      })),
    };
  }

  /**
   * Get expired approvals.
   */
  async getExpired(): Promise<TicketApproval[]> {
    return this.list({ status: 'expired', include_expired: true });
  }
}

/**
 * Create approval services for a client.
 */
export function createApprovalServices(client: HaloPSAClient) {
  return {
    processes: new ApprovalProcessService(client),
    rules: new ApprovalProcessRuleService(client),
    approvals: new TicketApprovalService(client),
  };
}
