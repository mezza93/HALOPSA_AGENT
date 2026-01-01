/**
 * Approval Process AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { ApprovalProcess, ApprovalProcessRule, TicketApproval } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createApprovalTools(ctx: HaloContext) {
  return {
    // === APPROVAL PROCESS OPERATIONS ===
    listApprovalProcesses: tool({
      description: 'List approval process definitions.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active processes'),
      }),
      execute: async ({ activeOnly }) => {
        try {
          const processes = activeOnly
            ? await ctx.approvalProcesses.listActive()
            : await ctx.approvalProcesses.list();

          return {
            success: true,
            count: processes.length,
            data: processes.map((p: ApprovalProcess) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              requiresAll: p.requiresAllApprovers,
              minApprovers: p.minApprovers,
              expiryDays: p.expiryDays,
              autoEscalate: p.autoEscalate,
            })),
          };
        } catch (error) {
          return formatError(error, 'listApprovalProcesses');
        }
      },
    }),

    getApprovalProcess: tool({
      description: 'Get an approval process with its rules.',
      parameters: z.object({
        processId: z.number().describe('The approval process ID'),
      }),
      execute: async ({ processId }) => {
        try {
          const process = await ctx.approvalProcesses.getWithRules(processId);
          return {
            success: true,
            id: process.id,
            name: process.name,
            description: process.description,
            isActive: process.isActive,
            requiresAllApprovers: process.requiresAllApprovers,
            minApprovers: process.minApprovers,
            expiryDays: process.expiryDays,
            autoEscalate: process.autoEscalate,
            escalationAgent: process.escalationAgentName,
            notifyOnApproval: process.notifyOnApproval,
            notifyOnRejection: process.notifyOnRejection,
            rules: process.rules?.map((r: ApprovalProcessRule) => ({
              id: r.id,
              name: r.name,
              order: r.order,
              approverType: r.approverType,
              approver: r.approverName,
              isRequired: r.isRequired,
            })),
          };
        } catch (error) {
          return formatError(error, 'getApprovalProcess');
        }
      },
    }),

    createApprovalProcess: tool({
      description: 'Create a new approval process definition.',
      parameters: z.object({
        name: z.string().describe('Process name'),
        description: z.string().optional().describe('Process description'),
        requiresAllApprovers: z.boolean().optional().describe('Whether all approvers must approve'),
        minApprovers: z.number().optional().describe('Minimum number of approvers required'),
        expiryDays: z.number().optional().describe('Days before approval expires'),
        autoEscalate: z.boolean().optional().describe('Auto-escalate on expiry'),
        escalationAgentId: z.number().optional().describe('Agent to escalate to'),
      }),
      execute: async ({ name, description, requiresAllApprovers, minApprovers, expiryDays, autoEscalate, escalationAgentId }) => {
        try {
          const process = await ctx.approvalProcesses.createProcess({
            name,
            description,
            requiresAllApprovers,
            minApprovers,
            expiryDays,
            autoEscalate,
            escalationAgentId,
          });

          return {
            success: true,
            processId: process.id,
            name: process.name,
            message: `Approval process "${process.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createApprovalProcess');
        }
      },
    }),

    // === APPROVAL RULE OPERATIONS ===
    addApprovalRule: tool({
      description: 'Add a rule to an approval process.',
      parameters: z.object({
        processId: z.number().describe('Approval process ID'),
        name: z.string().describe('Rule name'),
        approverType: z.enum(['agent', 'team', 'manager', 'custom']).describe('Type of approver'),
        approverId: z.number().optional().describe('Approver ID (agent or team)'),
        isRequired: z.boolean().optional().describe('Whether this rule is required'),
        order: z.number().optional().describe('Rule order'),
      }),
      execute: async ({ processId, name, approverType, approverId, isRequired, order }) => {
        try {
          const rule = await ctx.approvalProcessRules.createRule({
            processId,
            name,
            approverType,
            approverId,
            isRequired,
            order,
          });

          return {
            success: true,
            ruleId: rule.id,
            name: rule.name,
            message: `Rule "${rule.name}" added to process`,
          };
        } catch (error) {
          return formatError(error, 'addApprovalRule');
        }
      },
    }),

    listApprovalRules: tool({
      description: 'List rules for an approval process.',
      parameters: z.object({
        processId: z.number().describe('Approval process ID'),
      }),
      execute: async ({ processId }) => {
        try {
          const rules = await ctx.approvalProcessRules.listByProcess(processId);

          return {
            success: true,
            count: rules.length,
            data: rules.map((r: ApprovalProcessRule) => ({
              id: r.id,
              name: r.name,
              order: r.order,
              approverType: r.approverType,
              approver: r.approverName,
              isRequired: r.isRequired,
            })),
          };
        } catch (error) {
          return formatError(error, 'listApprovalRules');
        }
      },
    }),

    // === TICKET APPROVAL OPERATIONS ===
    listTicketApprovals: tool({
      description: 'List ticket approval requests.',
      parameters: z.object({
        ticketId: z.number().optional().describe('Filter by ticket ID'),
        processId: z.number().optional().describe('Filter by process ID'),
        approverId: z.number().optional().describe('Filter by approver ID'),
        status: z.enum(['pending', 'approved', 'rejected', 'delegated', 'expired']).optional().describe('Filter by status'),
        clientId: z.number().optional().describe('Filter by client ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ ticketId, processId, approverId, status, clientId, count }) => {
        try {
          const approvals = await ctx.ticketApprovals.listFiltered({
            ticketId,
            processId,
            approverId,
            status,
            clientId,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: approvals.length,
            data: approvals.map((a: TicketApproval) => ({
              id: a.id,
              ticketId: a.ticketId,
              ticketNumber: a.ticketNumber,
              status: a.status,
              process: a.processName,
              requestedBy: a.requestedByName,
              requestedAt: a.requestedAt,
              approver: a.approverName,
              expiresAt: a.expiresAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTicketApprovals');
        }
      },
    }),

    getPendingApprovals: tool({
      description: 'Get pending approval requests for an approver.',
      parameters: z.object({
        approverId: z.number().describe('Approver agent ID'),
      }),
      execute: async ({ approverId }) => {
        try {
          const approvals = await ctx.ticketApprovals.getPendingForApprover(approverId);

          return {
            success: true,
            count: approvals.length,
            data: approvals.map((a: TicketApproval) => ({
              id: a.id,
              ticketId: a.ticketId,
              ticketNumber: a.ticketNumber,
              ticketSummary: a.ticketSummary,
              process: a.processName,
              requestedBy: a.requestedByName,
              requestedAt: a.requestedAt,
              priority: a.priority,
              expiresAt: a.expiresAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'getPendingApprovals');
        }
      },
    }),

    getTicketApprovals: tool({
      description: 'Get all approvals for a specific ticket.',
      parameters: z.object({
        ticketId: z.number().describe('Ticket ID'),
      }),
      execute: async ({ ticketId }) => {
        try {
          const approvals = await ctx.ticketApprovals.getForTicket(ticketId);

          return {
            success: true,
            count: approvals.length,
            data: approvals.map((a: TicketApproval) => ({
              id: a.id,
              status: a.status,
              process: a.processName,
              requestedBy: a.requestedByName,
              requestedAt: a.requestedAt,
              approver: a.approverName,
              approvedAt: a.approvedAt,
              rejectedAt: a.rejectedAt,
              rejectionReason: a.rejectionReason,
            })),
          };
        } catch (error) {
          return formatError(error, 'getTicketApprovals');
        }
      },
    }),

    requestApproval: tool({
      description: 'Request approval for a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('Ticket ID'),
        processId: z.number().describe('Approval process ID'),
        requestedById: z.number().optional().describe('Requesting agent ID'),
        comments: z.string().optional().describe('Request comments'),
        priority: z.string().optional().describe('Priority level'),
      }),
      execute: async ({ ticketId, processId, requestedById, comments, priority }) => {
        try {
          const approval = await ctx.ticketApprovals.requestApproval({
            ticketId,
            processId,
            requestedById,
            comments,
            priority,
          });

          return {
            success: true,
            approvalId: approval.id,
            ticketId: approval.ticketId,
            status: approval.status,
            message: `Approval requested for ticket ${ticketId}`,
          };
        } catch (error) {
          return formatError(error, 'requestApproval');
        }
      },
    }),

    approveTicket: tool({
      description: 'Approve a ticket approval request.',
      parameters: z.object({
        approvalId: z.number().describe('Approval request ID'),
        approverId: z.number().describe('Approver agent ID'),
        comments: z.string().optional().describe('Approval comments'),
      }),
      execute: async ({ approvalId, approverId, comments }) => {
        try {
          const approval = await ctx.ticketApprovals.approve(approvalId, approverId, comments);

          return {
            success: true,
            approvalId: approval.id,
            ticketId: approval.ticketId,
            status: approval.status,
            message: 'Ticket approved',
          };
        } catch (error) {
          return formatError(error, 'approveTicket');
        }
      },
    }),

    rejectTicket: tool({
      description: 'Reject a ticket approval request.',
      parameters: z.object({
        approvalId: z.number().describe('Approval request ID'),
        reason: z.string().describe('Rejection reason'),
      }),
      execute: async ({ approvalId, reason }) => {
        try {
          const approval = await ctx.ticketApprovals.reject(approvalId, reason);

          return {
            success: true,
            approvalId: approval.id,
            ticketId: approval.ticketId,
            status: approval.status,
            message: 'Ticket rejected',
          };
        } catch (error) {
          return formatError(error, 'rejectTicket');
        }
      },
    }),

    delegateApproval: tool({
      description: 'Delegate an approval to another agent.',
      parameters: z.object({
        approvalId: z.number().describe('Approval request ID'),
        delegatedToId: z.number().describe('Agent ID to delegate to'),
      }),
      execute: async ({ approvalId, delegatedToId }) => {
        try {
          const approval = await ctx.ticketApprovals.delegate(approvalId, delegatedToId);

          return {
            success: true,
            approvalId: approval.id,
            ticketId: approval.ticketId,
            status: approval.status,
            delegatedTo: approval.delegatedToName,
            message: `Approval delegated to ${approval.delegatedToName}`,
          };
        } catch (error) {
          return formatError(error, 'delegateApproval');
        }
      },
    }),

    getApprovalStats: tool({
      description: 'Get approval statistics.',
      parameters: z.object({
        processId: z.number().optional().describe('Filter by process ID'),
        approverId: z.number().optional().describe('Filter by approver ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ processId, approverId, startDate, endDate }) => {
        try {
          const stats = await ctx.ticketApprovals.getStats({
            processId,
            approverId,
            startDate,
            endDate,
          });

          return {
            success: true,
            totalPending: stats.totalPending,
            totalApproved: stats.totalApproved,
            totalRejected: stats.totalRejected,
            totalExpired: stats.totalExpired,
            avgApprovalTimeHours: stats.averageApprovalTimeHours,
            byProcess: stats.byProcess,
            byApprover: stats.byApprover,
          };
        } catch (error) {
          return formatError(error, 'getApprovalStats');
        }
      },
    }),

    getExpiredApprovals: tool({
      description: 'Get expired approval requests.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const approvals = await ctx.ticketApprovals.getExpired();

          return {
            success: true,
            count: approvals.length,
            data: approvals.map((a: TicketApproval) => ({
              id: a.id,
              ticketId: a.ticketId,
              ticketNumber: a.ticketNumber,
              process: a.processName,
              requestedAt: a.requestedAt,
              expiresAt: a.expiresAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'getExpiredApprovals');
        }
      },
    }),
  };
}
