/**
 * Timesheet AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Timesheet, TimesheetEvent, ActivityType } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createTimesheetTools(ctx: HaloContext) {
  return {
    // === TIMESHEET OPERATIONS ===
    listTimesheets: tool({
      description: 'List timesheets with optional filters.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'locked']).optional().describe('Filter by status'),
        periodStart: z.string().optional().describe('Period start date (YYYY-MM-DD)'),
        periodEnd: z.string().optional().describe('Period end date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, status, periodStart, periodEnd, count }) => {
        try {
          const timesheets = await ctx.timesheets.listFiltered({
            agentId,
            status,
            periodStart,
            periodEnd,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: timesheets.length,
            data: timesheets.map((t: Timesheet) => ({
              id: t.id,
              agent: t.agentName,
              periodStart: t.periodStartDate,
              periodEnd: t.periodEndDate,
              status: t.status,
              totalHours: t.totalHours,
              billableHours: t.billableHours,
              entryCount: t.entryCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTimesheets');
        }
      },
    }),

    getTimesheet: tool({
      description: 'Get detailed information about a timesheet.',
      parameters: z.object({
        timesheetId: z.number().describe('The timesheet ID'),
      }),
      execute: async ({ timesheetId }) => {
        try {
          const ts = await ctx.timesheets.get(timesheetId);
          return {
            success: true,
            id: ts.id,
            agent: ts.agentName,
            agentId: ts.agentId,
            periodType: ts.periodType,
            periodStart: ts.periodStartDate,
            periodEnd: ts.periodEndDate,
            status: ts.status,
            totalHours: ts.totalHours,
            billableHours: ts.billableHours,
            nonBillableHours: ts.nonBillableHours,
            overtimeHours: ts.overtimeHours,
            entryCount: ts.entryCount,
            submittedAt: ts.submittedAt,
            approvedAt: ts.approvedAt,
            approver: ts.approverName,
            notes: ts.notes,
          };
        } catch (error) {
          return formatError(error, 'getTimesheet');
        }
      },
    }),

    getCurrentTimesheet: tool({
      description: 'Get the current draft timesheet for an agent.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
      }),
      execute: async ({ agentId }) => {
        try {
          const ts = await ctx.timesheets.getCurrent(agentId);
          if (!ts) {
            return {
              success: true,
              message: 'No current timesheet found',
              data: null,
            };
          }
          return {
            success: true,
            id: ts.id,
            periodStart: ts.periodStartDate,
            periodEnd: ts.periodEndDate,
            totalHours: ts.totalHours,
            billableHours: ts.billableHours,
            entryCount: ts.entryCount,
          };
        } catch (error) {
          return formatError(error, 'getCurrentTimesheet');
        }
      },
    }),

    submitTimesheet: tool({
      description: 'Submit a timesheet for approval.',
      parameters: z.object({
        timesheetId: z.number().describe('The timesheet ID'),
        notes: z.string().optional().describe('Submission notes'),
      }),
      execute: async ({ timesheetId, notes }) => {
        try {
          const ts = await ctx.timesheets.submit(timesheetId, notes);
          return {
            success: true,
            timesheetId: ts.id,
            status: ts.status,
            message: 'Timesheet submitted for approval',
          };
        } catch (error) {
          return formatError(error, 'submitTimesheet');
        }
      },
    }),

    approveTimesheet: tool({
      description: 'Approve a submitted timesheet.',
      parameters: z.object({
        timesheetId: z.number().describe('The timesheet ID'),
        approverId: z.number().describe('Approver agent ID'),
        notes: z.string().optional().describe('Approval notes'),
      }),
      execute: async ({ timesheetId, approverId, notes }) => {
        try {
          const ts = await ctx.timesheets.approve(timesheetId, approverId, notes);
          return {
            success: true,
            timesheetId: ts.id,
            status: ts.status,
            message: 'Timesheet approved',
          };
        } catch (error) {
          return formatError(error, 'approveTimesheet');
        }
      },
    }),

    rejectTimesheet: tool({
      description: 'Reject a submitted timesheet.',
      parameters: z.object({
        timesheetId: z.number().describe('The timesheet ID'),
        reason: z.string().describe('Rejection reason'),
      }),
      execute: async ({ timesheetId, reason }) => {
        try {
          const ts = await ctx.timesheets.reject(timesheetId, reason);
          return {
            success: true,
            timesheetId: ts.id,
            status: ts.status,
            message: 'Timesheet rejected',
          };
        } catch (error) {
          return formatError(error, 'rejectTimesheet');
        }
      },
    }),

    getPendingTimesheets: tool({
      description: 'Get timesheets pending approval.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const timesheets = await ctx.timesheets.getPendingApproval(count);

          return {
            success: true,
            count: timesheets.length,
            data: timesheets.map((t: Timesheet) => ({
              id: t.id,
              agent: t.agentName,
              periodStart: t.periodStartDate,
              periodEnd: t.periodEndDate,
              totalHours: t.totalHours,
              submittedAt: t.submittedAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'getPendingTimesheets');
        }
      },
    }),

    // === TIME ENTRY OPERATIONS ===
    listTimeEntries: tool({
      description: 'List time entries with filters.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        ticketId: z.number().optional().describe('Filter by ticket ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        projectId: z.number().optional().describe('Filter by project ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        isBillable: z.boolean().optional().describe('Filter by billable status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, ticketId, clientId, projectId, startDate, endDate, isBillable, count }) => {
        try {
          const entries = await ctx.timesheetEvents.listFiltered({
            agentId,
            ticketId,
            clientId,
            projectId,
            startDate,
            endDate,
            isBillable,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: entries.length,
            data: entries.map((e: TimesheetEvent) => ({
              id: e.id,
              date: e.date,
              duration: e.duration,
              description: e.description,
              ticket: e.ticketNumber,
              client: e.clientName,
              project: e.projectName,
              activity: e.activityName,
              isBillable: e.isBillable,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTimeEntries');
        }
      },
    }),

    logTime: tool({
      description: 'Log time worked on a ticket or project.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        duration: z.number().describe('Duration in hours'),
        date: z.string().describe('Date worked (YYYY-MM-DD)'),
        ticketId: z.number().optional().describe('Ticket ID'),
        clientId: z.number().optional().describe('Client ID'),
        projectId: z.number().optional().describe('Project ID'),
        description: z.string().optional().describe('Work description'),
        isBillable: z.boolean().optional().default(true).describe('Whether time is billable'),
        activityId: z.number().optional().describe('Activity type ID'),
        startTime: z.string().optional().describe('Start time (HH:MM)'),
        endTime: z.string().optional().describe('End time (HH:MM)'),
      }),
      execute: async ({ agentId, duration, date, ticketId, clientId, projectId, description, isBillable, activityId, startTime, endTime }) => {
        try {
          const entry = await ctx.timesheetEvents.logTime({
            agentId,
            duration,
            date,
            ticketId,
            clientId,
            projectId,
            description,
            isBillable,
            activityId,
            startTime,
            endTime,
          });

          return {
            success: true,
            entryId: entry.id,
            duration: entry.duration,
            date: entry.date,
            message: `Logged ${entry.duration} hours successfully`,
          };
        } catch (error) {
          return formatError(error, 'logTime');
        }
      },
    }),

    startTimer: tool({
      description: 'Start a timer for real-time time tracking.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        ticketId: z.number().optional().describe('Ticket ID'),
        clientId: z.number().optional().describe('Client ID'),
        projectId: z.number().optional().describe('Project ID'),
        description: z.string().optional().describe('Work description'),
        activityId: z.number().optional().describe('Activity type ID'),
      }),
      execute: async ({ agentId, ticketId, clientId, projectId, description, activityId }) => {
        try {
          const entry = await ctx.timesheetEvents.startTimer({
            agentId,
            ticketId,
            clientId,
            projectId,
            description,
            activityId,
          });

          return {
            success: true,
            entryId: entry.id,
            startTime: entry.startTime,
            message: 'Timer started',
          };
        } catch (error) {
          return formatError(error, 'startTimer');
        }
      },
    }),

    stopTimer: tool({
      description: 'Stop a running timer.',
      parameters: z.object({
        entryId: z.number().describe('Time entry ID'),
      }),
      execute: async ({ entryId }) => {
        try {
          const entry = await ctx.timesheetEvents.stopTimer(entryId);

          return {
            success: true,
            entryId: entry.id,
            duration: entry.duration,
            endTime: entry.endTime,
            message: `Timer stopped. Duration: ${entry.duration.toFixed(2)} hours`,
          };
        } catch (error) {
          return formatError(error, 'stopTimer');
        }
      },
    }),

    getTimeSummary: tool({
      description: 'Get a summary of time entries for a period.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ agentId, startDate, endDate }) => {
        try {
          const summary = await ctx.timesheetEvents.getSummary({
            agentId,
            startDate,
            endDate,
          });

          return {
            success: true,
            periodStart: summary.periodStart,
            periodEnd: summary.periodEnd,
            totalHours: summary.totalHours,
            billableHours: summary.billableHours,
            nonBillableHours: summary.nonBillableHours,
            overtimeHours: summary.overtimeHours,
            totalAmount: summary.totalAmount,
            byClient: summary.byClient?.map((c: { clientId: number; clientName: string; hours: number; billableHours: number; amount?: number }) => ({
              client: c.clientName,
              hours: c.hours,
              billableHours: c.billableHours,
            })),
            byProject: summary.byProject?.map((p: { projectId: number; projectName: string; hours: number; billableHours: number; amount?: number }) => ({
              project: p.projectName,
              hours: p.hours,
            })),
          };
        } catch (error) {
          return formatError(error, 'getTimeSummary');
        }
      },
    }),

    // === ACTIVITY TYPE OPERATIONS ===
    listActivityTypes: tool({
      description: 'List available activity types for time tracking.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active types'),
        billableOnly: z.boolean().optional().describe('Only show billable types'),
      }),
      execute: async ({ activeOnly, billableOnly }) => {
        try {
          let activities: ActivityType[];
          if (billableOnly) {
            activities = await ctx.activityTypes.listBillable();
          } else if (activeOnly) {
            activities = await ctx.activityTypes.listActive();
          } else {
            activities = await ctx.activityTypes.list();
          }

          return {
            success: true,
            count: activities.length,
            data: activities.map((a: ActivityType) => ({
              id: a.id,
              name: a.name,
              code: a.code,
              isBillable: a.isBillable,
              defaultRate: a.defaultRate,
            })),
          };
        } catch (error) {
          return formatError(error, 'listActivityTypes');
        }
      },
    }),
  };
}
