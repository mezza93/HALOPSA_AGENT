/**
 * CAB (Change Advisory Board) AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { CAB, CABMember, CABRole, CABMeeting, CABReviewItem, CABMeetingAttendee } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createCABTools(ctx: HaloContext) {
  return {
    // === CAB OPERATIONS ===
    listCABs: tool({
      description: 'List Change Advisory Boards.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active CABs'),
      }),
      execute: async ({ activeOnly }) => {
        try {
          const cabs = activeOnly
            ? await ctx.cabs.listActive()
            : await ctx.cabs.list();

          return {
            success: true,
            count: cabs.length,
            data: cabs.map((c: CAB) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              chair: c.chairAgentName,
              secretary: c.secretaryAgentName,
              meetingSchedule: c.meetingSchedule,
              quorumRequired: c.quorumRequired,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCABs');
        }
      },
    }),

    getCAB: tool({
      description: 'Get CAB details with members.',
      parameters: z.object({
        cabId: z.number().describe('CAB ID'),
      }),
      execute: async ({ cabId }) => {
        try {
          const cab = await ctx.cabs.getWithMembers(cabId);

          return {
            success: true,
            id: cab.id,
            name: cab.name,
            description: cab.description,
            isActive: cab.isActive,
            chair: cab.chairAgentName,
            secretary: cab.secretaryAgentName,
            meetingSchedule: cab.meetingSchedule,
            defaultDuration: cab.defaultDuration,
            quorumRequired: cab.quorumRequired,
            notifyOnSchedule: cab.notifyOnSchedule,
            notifyOnDecision: cab.notifyOnDecision,
            members: cab.members?.map((m: CABMember) => ({
              id: m.id,
              agent: m.agentName,
              role: m.roleName,
              isVoting: m.isVotingMember,
              isRequired: m.isRequired,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCAB');
        }
      },
    }),

    createCAB: tool({
      description: 'Create a new Change Advisory Board.',
      parameters: z.object({
        name: z.string().describe('CAB name'),
        description: z.string().optional().describe('CAB description'),
        meetingSchedule: z.string().optional().describe('Meeting schedule (cron or description)'),
        defaultDuration: z.number().optional().describe('Default meeting duration in minutes'),
        chairAgentId: z.number().optional().describe('Chair agent ID'),
        secretaryAgentId: z.number().optional().describe('Secretary agent ID'),
        quorumRequired: z.number().optional().describe('Minimum members for quorum'),
      }),
      execute: async ({ name, description, meetingSchedule, defaultDuration, chairAgentId, secretaryAgentId, quorumRequired }) => {
        try {
          const cab = await ctx.cabs.createCAB({
            name,
            description,
            meetingSchedule,
            defaultDuration,
            chairAgentId,
            secretaryAgentId,
            quorumRequired,
          });

          return {
            success: true,
            cabId: cab.id,
            name: cab.name,
            message: `CAB "${cab.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createCAB');
        }
      },
    }),

    setCABChair: tool({
      description: 'Set the chair for a CAB.',
      parameters: z.object({
        cabId: z.number().describe('CAB ID'),
        chairAgentId: z.number().describe('Agent ID for chair'),
      }),
      execute: async ({ cabId, chairAgentId }) => {
        try {
          const cab = await ctx.cabs.setChair(cabId, chairAgentId);

          return {
            success: true,
            cabId: cab.id,
            chair: cab.chairAgentName,
            message: `Chair set to ${cab.chairAgentName}`,
          };
        } catch (error) {
          return formatError(error, 'setCABChair');
        }
      },
    }),

    // === CAB MEMBER OPERATIONS ===
    listCABMembers: tool({
      description: 'List members of a CAB.',
      parameters: z.object({
        cabId: z.number().describe('CAB ID'),
        votingOnly: z.boolean().optional().describe('Only show voting members'),
      }),
      execute: async ({ cabId, votingOnly }) => {
        try {
          const members = votingOnly
            ? await ctx.cabMembers.listVotingMembers(cabId)
            : await ctx.cabMembers.listByCAB(cabId);

          return {
            success: true,
            count: members.length,
            data: members.map((m: CABMember) => ({
              id: m.id,
              agentId: m.agentId,
              agent: m.agentName,
              role: m.roleName,
              isVoting: m.isVotingMember,
              isRequired: m.isRequired,
              email: m.email,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCABMembers');
        }
      },
    }),

    addCABMember: tool({
      description: 'Add a member to a CAB.',
      parameters: z.object({
        cabId: z.number().describe('CAB ID'),
        agentId: z.number().describe('Agent ID'),
        roleId: z.number().optional().describe('Role ID'),
        isVotingMember: z.boolean().optional().describe('Whether member can vote'),
        isRequired: z.boolean().optional().describe('Whether member is required for quorum'),
      }),
      execute: async ({ cabId, agentId, roleId, isVotingMember, isRequired }) => {
        try {
          const member = await ctx.cabMembers.addMember({
            cabId,
            agentId,
            roleId,
            isVotingMember,
            isRequired,
          });

          return {
            success: true,
            memberId: member.id,
            agent: member.agentName,
            message: `${member.agentName} added to CAB`,
          };
        } catch (error) {
          return formatError(error, 'addCABMember');
        }
      },
    }),

    removeCABMember: tool({
      description: 'Remove a member from a CAB.',
      parameters: z.object({
        memberId: z.number().describe('CAB member ID'),
      }),
      execute: async ({ memberId }) => {
        try {
          await ctx.cabMembers.removeMember(memberId);

          return {
            success: true,
            message: 'Member removed from CAB',
          };
        } catch (error) {
          return formatError(error, 'removeCABMember');
        }
      },
    }),

    // === CAB ROLE OPERATIONS ===
    listCABRoles: tool({
      description: 'List available CAB roles.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const roles = await ctx.cabRoles.list();

          return {
            success: true,
            count: roles.length,
            data: roles.map((r: CABRole) => ({
              id: r.id,
              name: r.name,
              description: r.description,
              isChairRole: r.isChairRole,
              isSecretaryRole: r.isSecretaryRole,
              permissions: r.permissions,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCABRoles');
        }
      },
    }),

    // === CAB MEETING OPERATIONS ===
    listCABMeetings: tool({
      description: 'List CAB meetings.',
      parameters: z.object({
        cabId: z.number().optional().describe('Filter by CAB ID'),
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional().describe('Filter by status'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ cabId, status, startDate, endDate, count }) => {
        try {
          const meetings = await ctx.cabMeetings.listFiltered({
            cabId,
            status,
            startDate,
            endDate,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: meetings.length,
            data: meetings.map((m: CABMeeting) => ({
              id: m.id,
              cab: m.cabName,
              title: m.title,
              scheduledDate: m.scheduledDate,
              duration: m.scheduledDuration,
              status: m.status,
              chair: m.chairName,
              location: m.location,
              reviewItemCount: m.reviewItems?.length || 0,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCABMeetings');
        }
      },
    }),

    getUpcomingCABMeetings: tool({
      description: 'Get upcoming CAB meetings.',
      parameters: z.object({
        count: z.number().optional().default(10).describe('Number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const meetings = await ctx.cabMeetings.getUpcoming(count);

          return {
            success: true,
            count: meetings.length,
            data: meetings.map((m: CABMeeting) => ({
              id: m.id,
              cab: m.cabName,
              title: m.title,
              scheduledDate: m.scheduledDate,
              duration: m.scheduledDuration,
              chair: m.chairName,
              location: m.location,
              meetingLink: m.meetingLink,
            })),
          };
        } catch (error) {
          return formatError(error, 'getUpcomingCABMeetings');
        }
      },
    }),

    getCABMeetingDetails: tool({
      description: 'Get detailed CAB meeting information including attendees and review items.',
      parameters: z.object({
        meetingId: z.number().describe('Meeting ID'),
      }),
      execute: async ({ meetingId }) => {
        try {
          const meeting = await ctx.cabMeetings.getMeetingDetails(meetingId);

          return {
            success: true,
            id: meeting.id,
            cab: meeting.cabName,
            title: meeting.title,
            description: meeting.description,
            scheduledDate: meeting.scheduledDate,
            duration: meeting.scheduledDuration,
            actualStart: meeting.actualStartTime,
            actualEnd: meeting.actualEndTime,
            status: meeting.status,
            chair: meeting.chairName,
            location: meeting.location,
            meetingLink: meeting.meetingLink,
            minutesNotes: meeting.minutesNotes,
            attendees: meeting.attendees?.map((a: CABMeetingAttendee) => ({
              agent: a.agentName,
              attended: a.attended,
              voteCast: a.voteCast,
            })),
            reviewItems: meeting.reviewItems?.map((r: CABReviewItem) => ({
              id: r.id,
              ticketId: r.ticketId,
              ticketNumber: r.ticketNumber,
              ticketSummary: r.ticketSummary,
              decision: r.decision,
              decidedBy: r.decidedByName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCABMeetingDetails');
        }
      },
    }),

    scheduleCABMeeting: tool({
      description: 'Schedule a new CAB meeting.',
      parameters: z.object({
        cabId: z.number().describe('CAB ID'),
        title: z.string().describe('Meeting title'),
        description: z.string().optional().describe('Meeting description'),
        scheduledDate: z.string().describe('Scheduled date and time (ISO 8601)'),
        scheduledDuration: z.number().optional().describe('Duration in minutes'),
        location: z.string().optional().describe('Meeting location'),
        meetingLink: z.string().optional().describe('Video/web meeting link'),
        chairId: z.number().optional().describe('Chair agent ID'),
      }),
      execute: async ({ cabId, title, description, scheduledDate, scheduledDuration, location, meetingLink, chairId }) => {
        try {
          const meeting = await ctx.cabMeetings.scheduleMeeting({
            cabId,
            title,
            description,
            scheduledDate,
            scheduledDuration,
            location,
            meetingLink,
            chairId,
          });

          return {
            success: true,
            meetingId: meeting.id,
            title: meeting.title,
            scheduledDate: meeting.scheduledDate,
            message: `Meeting "${meeting.title}" scheduled`,
          };
        } catch (error) {
          return formatError(error, 'scheduleCABMeeting');
        }
      },
    }),

    startCABMeeting: tool({
      description: 'Start a scheduled CAB meeting.',
      parameters: z.object({
        meetingId: z.number().describe('Meeting ID'),
      }),
      execute: async ({ meetingId }) => {
        try {
          const meeting = await ctx.cabMeetings.startMeeting(meetingId);

          return {
            success: true,
            meetingId: meeting.id,
            status: meeting.status,
            startTime: meeting.actualStartTime,
            message: 'Meeting started',
          };
        } catch (error) {
          return formatError(error, 'startCABMeeting');
        }
      },
    }),

    endCABMeeting: tool({
      description: 'End a CAB meeting.',
      parameters: z.object({
        meetingId: z.number().describe('Meeting ID'),
        minutesNotes: z.string().optional().describe('Meeting minutes/notes'),
      }),
      execute: async ({ meetingId, minutesNotes }) => {
        try {
          const meeting = await ctx.cabMeetings.endMeeting(meetingId, minutesNotes);

          return {
            success: true,
            meetingId: meeting.id,
            status: meeting.status,
            endTime: meeting.actualEndTime,
            message: 'Meeting ended',
          };
        } catch (error) {
          return formatError(error, 'endCABMeeting');
        }
      },
    }),

    cancelCABMeeting: tool({
      description: 'Cancel a CAB meeting.',
      parameters: z.object({
        meetingId: z.number().describe('Meeting ID'),
      }),
      execute: async ({ meetingId }) => {
        try {
          const meeting = await ctx.cabMeetings.cancelMeeting(meetingId);

          return {
            success: true,
            meetingId: meeting.id,
            status: meeting.status,
            message: 'Meeting cancelled',
          };
        } catch (error) {
          return formatError(error, 'cancelCABMeeting');
        }
      },
    }),

    // === CAB REVIEW ITEM OPERATIONS ===
    listReviewItems: tool({
      description: 'List review items for a CAB meeting.',
      parameters: z.object({
        meetingId: z.number().describe('Meeting ID'),
      }),
      execute: async ({ meetingId }) => {
        try {
          const items = await ctx.cabReviewItems.listByMeeting(meetingId);

          return {
            success: true,
            count: items.length,
            data: items.map((r: CABReviewItem) => ({
              id: r.id,
              ticketId: r.ticketId,
              ticketNumber: r.ticketNumber,
              ticketSummary: r.ticketSummary,
              release: r.releaseName,
              decision: r.decision,
              decidedBy: r.decidedByName,
              decisionDate: r.decisionDate,
              order: r.order,
            })),
          };
        } catch (error) {
          return formatError(error, 'listReviewItems');
        }
      },
    }),

    getPendingReviewItems: tool({
      description: 'Get items pending CAB review.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const items = await ctx.cabReviewItems.listPending();

          return {
            success: true,
            count: items.length,
            data: items.map((r: CABReviewItem) => ({
              id: r.id,
              meetingId: r.meetingId,
              ticketId: r.ticketId,
              ticketNumber: r.ticketNumber,
              ticketSummary: r.ticketSummary,
              release: r.releaseName,
              riskAssessment: r.riskAssessment,
            })),
          };
        } catch (error) {
          return formatError(error, 'getPendingReviewItems');
        }
      },
    }),

    addItemForReview: tool({
      description: 'Add a ticket for CAB review.',
      parameters: z.object({
        meetingId: z.number().describe('Meeting ID'),
        ticketId: z.number().describe('Ticket ID'),
        releaseId: z.number().optional().describe('Related release ID'),
        riskAssessment: z.string().optional().describe('Risk assessment'),
        impactAssessment: z.string().optional().describe('Impact assessment'),
        rollbackPlan: z.string().optional().describe('Rollback plan'),
        order: z.number().optional().describe('Order in agenda'),
      }),
      execute: async ({ meetingId, ticketId, releaseId, riskAssessment, impactAssessment, rollbackPlan, order }) => {
        try {
          const item = await ctx.cabReviewItems.addForReview({
            meetingId,
            ticketId,
            releaseId,
            riskAssessment,
            impactAssessment,
            rollbackPlan,
            order,
          });

          return {
            success: true,
            itemId: item.id,
            ticketId: item.ticketId,
            message: 'Item added for review',
          };
        } catch (error) {
          return formatError(error, 'addItemForReview');
        }
      },
    }),

    recordCABDecision: tool({
      description: 'Record a CAB decision on a review item.',
      parameters: z.object({
        itemId: z.number().describe('Review item ID'),
        decision: z.enum(['approved', 'rejected', 'deferred', 'more_info']).describe('Decision'),
        decidedById: z.number().describe('Agent ID who made the decision'),
        decisionNotes: z.string().optional().describe('Decision notes'),
      }),
      execute: async ({ itemId, decision, decidedById, decisionNotes }) => {
        try {
          const item = await ctx.cabReviewItems.recordDecision(itemId, decision, decidedById, decisionNotes);

          return {
            success: true,
            itemId: item.id,
            ticketId: item.ticketId,
            decision: item.decision,
            decidedBy: item.decidedByName,
            message: `Decision recorded: ${decision}`,
          };
        } catch (error) {
          return formatError(error, 'recordCABDecision');
        }
      },
    }),

    approveReviewItem: tool({
      description: 'Approve a CAB review item.',
      parameters: z.object({
        itemId: z.number().describe('Review item ID'),
        decidedById: z.number().describe('Agent ID'),
        notes: z.string().optional().describe('Approval notes'),
      }),
      execute: async ({ itemId, decidedById, notes }) => {
        try {
          const item = await ctx.cabReviewItems.approve(itemId, decidedById, notes);

          return {
            success: true,
            itemId: item.id,
            ticketId: item.ticketId,
            decision: item.decision,
            message: 'Item approved',
          };
        } catch (error) {
          return formatError(error, 'approveReviewItem');
        }
      },
    }),

    rejectReviewItem: tool({
      description: 'Reject a CAB review item.',
      parameters: z.object({
        itemId: z.number().describe('Review item ID'),
        decidedById: z.number().describe('Agent ID'),
        notes: z.string().describe('Rejection reason'),
      }),
      execute: async ({ itemId, decidedById, notes }) => {
        try {
          const item = await ctx.cabReviewItems.reject(itemId, decidedById, notes);

          return {
            success: true,
            itemId: item.id,
            ticketId: item.ticketId,
            decision: item.decision,
            message: 'Item rejected',
          };
        } catch (error) {
          return formatError(error, 'rejectReviewItem');
        }
      },
    }),

    deferReviewItem: tool({
      description: 'Defer a CAB review item for later discussion.',
      parameters: z.object({
        itemId: z.number().describe('Review item ID'),
        decidedById: z.number().describe('Agent ID'),
        notes: z.string().optional().describe('Deferral reason'),
      }),
      execute: async ({ itemId, decidedById, notes }) => {
        try {
          const item = await ctx.cabReviewItems.defer(itemId, decidedById, notes);

          return {
            success: true,
            itemId: item.id,
            ticketId: item.ticketId,
            decision: item.decision,
            message: 'Item deferred',
          };
        } catch (error) {
          return formatError(error, 'deferReviewItem');
        }
      },
    }),

    requestMoreInfo: tool({
      description: 'Request more information for a CAB review item.',
      parameters: z.object({
        itemId: z.number().describe('Review item ID'),
        decidedById: z.number().describe('Agent ID'),
        notes: z.string().describe('What information is needed'),
      }),
      execute: async ({ itemId, decidedById, notes }) => {
        try {
          const item = await ctx.cabReviewItems.requestMoreInfo(itemId, decidedById, notes);

          return {
            success: true,
            itemId: item.id,
            ticketId: item.ticketId,
            decision: item.decision,
            message: 'More information requested',
          };
        } catch (error) {
          return formatError(error, 'requestMoreInfo');
        }
      },
    }),

    updateReviewItemAssessment: tool({
      description: 'Update risk/impact assessment for a review item.',
      parameters: z.object({
        itemId: z.number().describe('Review item ID'),
        riskAssessment: z.string().optional().describe('Risk assessment'),
        impactAssessment: z.string().optional().describe('Impact assessment'),
        rollbackPlan: z.string().optional().describe('Rollback plan'),
      }),
      execute: async ({ itemId, riskAssessment, impactAssessment, rollbackPlan }) => {
        try {
          const item = await ctx.cabReviewItems.updateAssessment(itemId, riskAssessment, impactAssessment, rollbackPlan);

          return {
            success: true,
            itemId: item.id,
            message: 'Assessment updated',
          };
        } catch (error) {
          return formatError(error, 'updateReviewItemAssessment');
        }
      },
    }),
  };
}
