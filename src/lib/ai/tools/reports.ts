/**
 * Report and Dashboard-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Report, ScheduledReport, Dashboard, DashboardWidget } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const MAX_REPORT_ROWS = 100;

/**
 * Format error for tool response.
 */
function formatError(error: unknown, toolName: string): { success: false; error: string } {
  console.error(`[Tool:${toolName}] Error:`, error);
  const message = error instanceof Error ? error.message : String(error);

  // Check for specific error types
  if (message.includes('401') || message.includes('Unauthorized')) {
    return { success: false, error: 'Authentication failed with HaloPSA. Please check your connection credentials.' };
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return { success: false, error: 'Access denied. Your HaloPSA account may not have permission for this operation.' };
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return { success: false, error: 'The requested resource was not found in HaloPSA.' };
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return { success: false, error: 'Connection to HaloPSA timed out. Please try again.' };
  }
  if (message.includes('ECONNREFUSED') || message.includes('network')) {
    return { success: false, error: 'Could not connect to HaloPSA. Please check the connection URL.' };
  }

  return { success: false, error: `Operation failed: ${message}` };
}

export function createReportTools(ctx: HaloContext) {
  return {
    // === REPORT OPERATIONS ===
    listReports: tool({
      description: 'List available reports.',
      parameters: z.object({
        category: z.string().optional().describe('Filter by category'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ category, count }) => {
        try {
          const reports = category
            ? await ctx.reports.listByCategory(category, count || DEFAULT_COUNT)
            : await ctx.reports.list({ count: count || DEFAULT_COUNT });

          return {
            success: true,
            reports: reports.map((r: Report) => ({
              id: r.id,
              name: r.name,
              category: r.category,
              description: r.description,
              isShared: r.isShared,
            })),
          };
        } catch (error) {
          return formatError(error, 'listReports');
        }
      },
    }),

    getReport: tool({
      description: 'Get detailed information about a report.',
      parameters: z.object({
        reportId: z.number().describe('The report ID'),
      }),
      execute: async ({ reportId }) => {
        try {
          const report = await ctx.reports.get(reportId);
          return {
            success: true,
            id: report.id,
            name: report.name,
            description: report.description,
            category: report.category,
            sqlQuery: report.sqlQuery,
            isShared: report.isShared,
            authorName: report.authorName,
            dateCreated: report.dateCreated,
            dateModified: report.dateModified,
          };
        } catch (error) {
          return formatError(error, 'getReport');
        }
      },
    }),

    runReport: tool({
      description: 'Run a report and get the results.',
      parameters: z.object({
        reportId: z.number().describe('The report ID to run'),
        startDate: z.string().optional().describe('Start date for filtering (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date for filtering (YYYY-MM-DD)'),
      }),
      execute: async ({ reportId, startDate, endDate }) => {
        try {
          const result = await ctx.reports.run(reportId, { startDate, endDate });

          return {
            success: true,
            reportId: result.reportId,
            reportName: result.reportName,
            columns: result.columns,
            rows: result.rows.slice(0, MAX_REPORT_ROWS),
            rowCount: result.rowCount,
            executedAt: result.executedAt,
          };
        } catch (error) {
          return formatError(error, 'runReport');
        }
      },
    }),

    exportReport: tool({
      description: 'Export a report to CSV or JSON format.',
      parameters: z.object({
        reportId: z.number().describe('The report ID to export'),
        format: z.enum(['csv', 'json']).optional().default('csv').describe('Export format'),
        startDate: z.string().optional().describe('Start date for filtering (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date for filtering (YYYY-MM-DD)'),
      }),
      execute: async ({ reportId, format, startDate, endDate }) => {
        try {
          const data = await ctx.reports.export(reportId, {
            format: format || 'csv',
            startDate,
            endDate,
          });

          return {
            success: true,
            format: format || 'csv',
            data,
          };
        } catch (error) {
          return formatError(error, 'exportReport');
        }
      },
    }),

    createReport: tool({
      description: 'Create a custom report with SQL query.',
      parameters: z.object({
        name: z.string().describe('Report name'),
        sqlQuery: z.string().describe('SQL query for the report'),
        description: z.string().optional().describe('Report description'),
        category: z.string().optional().describe('Report category'),
        isShared: z.boolean().optional().default(false).describe('Whether to share with other users'),
      }),
      execute: async ({ name, sqlQuery, description, category, isShared }) => {
        try {
          const report = await ctx.reports.createCustomReport({
            name,
            sqlQuery,
            description,
            category,
            isShared: isShared || false,
          });

          return {
            success: true,
            reportId: report.id,
            name: report.name,
            message: `Report '${report.name}' created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createReport');
        }
      },
    }),

    updateReport: tool({
      description: 'Update an existing report.',
      parameters: z.object({
        reportId: z.number().describe('The report ID to update'),
        name: z.string().optional().describe('New report name'),
        sqlQuery: z.string().optional().describe('New SQL query'),
        description: z.string().optional().describe('New description'),
        category: z.string().optional().describe('New category'),
        isShared: z.boolean().optional().describe('Whether to share with other users'),
      }),
      execute: async ({ reportId, name, sqlQuery, description, category, isShared }) => {
        try {
          const updateData: Record<string, unknown> = { id: reportId };
          if (name !== undefined) updateData.name = name;
          if (sqlQuery !== undefined) updateData.sqlQuery = sqlQuery;
          if (description !== undefined) updateData.description = description;
          if (category !== undefined) updateData.category = category;
          if (isShared !== undefined) updateData.isShared = isShared;

          const reports = await ctx.reports.update([updateData]);
          if (reports && reports.length > 0) {
            return {
              success: true,
              reportId: reports[0].id,
              name: reports[0].name,
              message: `Report updated successfully`,
            };
          }
          return { success: false, error: 'Failed to update report' };
        } catch (error) {
          return formatError(error, 'updateReport');
        }
      },
    }),

    deleteReport: tool({
      description: 'Delete a report.',
      parameters: z.object({
        reportId: z.number().describe('The report ID to delete'),
      }),
      execute: async ({ reportId }) => {
        try {
          await ctx.reports.delete(reportId);
          return {
            success: true,
            reportId,
            message: `Report ${reportId} deleted successfully`,
          };
        } catch (error) {
          return formatError(error, 'deleteReport');
        }
      },
    }),

    runSavedReport: tool({
      description: 'Run a saved/predefined report by name.',
      parameters: z.object({
        reportName: z.string().describe('Name of the saved report'),
        startDate: z.string().optional().describe('Start date for filtering (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date for filtering (YYYY-MM-DD)'),
        clientId: z.number().optional().describe('Filter by client ID'),
        agentId: z.number().optional().describe('Filter by agent ID'),
      }),
      execute: async ({ reportName, startDate, endDate, clientId, agentId }) => {
        try {
          // First find the report by name
          const reports = await ctx.reports.list({ search: reportName, count: 10 });
          const report = reports.find((r: Report) => r.name.toLowerCase().includes(reportName.toLowerCase()));

          if (!report) {
            return {
              success: false,
              error: `Report '${reportName}' not found`,
            };
          }

          const result = await ctx.reports.run(report.id, { startDate, endDate, clientId, agentId });

          return {
            success: true,
            reportId: report.id,
            reportName: report.name,
            columns: result.columns,
            rows: result.rows.slice(0, MAX_REPORT_ROWS),
            rowCount: result.rowCount,
            executedAt: result.executedAt,
          };
        } catch (error) {
          return formatError(error, 'runSavedReport');
        }
      },
    }),

    // === SCHEDULED REPORTS ===
    listScheduledReports: tool({
      description: 'List scheduled report deliveries.',
      parameters: z.object({
        reportId: z.number().optional().describe('Filter by report ID'),
      }),
      execute: async ({ reportId }) => {
        try {
          const schedules = reportId
            ? await ctx.reports.scheduledReports.listByReport(reportId)
            : await ctx.reports.scheduledReports.list();

          return {
            success: true,
            schedules: schedules.map((s: ScheduledReport) => ({
              id: s.id,
              name: s.name,
              reportId: s.reportId,
              reportName: s.reportName,
              frequency: s.frequency,
              outputFormat: s.outputFormat,
              nextRun: s.nextRun,
              isActive: s.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listScheduledReports');
        }
      },
    }),

    createScheduledReport: tool({
      description: 'Schedule a report for automatic delivery.',
      parameters: z.object({
        reportId: z.number().describe('The report ID to schedule'),
        name: z.string().describe('Schedule name'),
        frequency: z.enum(['daily', 'weekly', 'monthly']).describe('Delivery frequency'),
        recipients: z.array(z.string()).describe('Email addresses to send to'),
        outputFormat: z.enum(['pdf', 'csv', 'excel']).optional().default('pdf').describe('Report format'),
        timeOfDay: z.string().optional().default('08:00').describe('Time to send (HH:MM)'),
        dayOfWeek: z.number().optional().describe('Day of week for weekly (0=Sunday)'),
        dayOfMonth: z.number().optional().describe('Day of month for monthly (1-31)'),
      }),
      execute: async ({ reportId, name, frequency, recipients, outputFormat, timeOfDay, dayOfWeek, dayOfMonth }) => {
        try {
          const schedule = await ctx.reports.scheduledReports.schedule({
            reportId,
            name,
            frequency,
            recipients,
            outputFormat: outputFormat || 'pdf',
            timeOfDay: timeOfDay || '08:00',
            dayOfWeek,
            dayOfMonth,
          });

          return {
            success: true,
            scheduleId: schedule.id,
            name: schedule.name,
            nextRun: schedule.nextRun,
          };
        } catch (error) {
          return formatError(error, 'createScheduledReport');
        }
      },
    }),

    // === DASHBOARD OPERATIONS ===
    listDashboards: tool({
      description: 'List available dashboards.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const dashboards = await ctx.reports.dashboards.listShared(count || DEFAULT_COUNT);

          return {
            success: true,
            dashboards: dashboards.map((d: Dashboard) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              isShared: d.isShared,
              isDefault: d.isDefault,
              widgetCount: d.widgets?.length || 0,
            })),
          };
        } catch (error) {
          return formatError(error, 'listDashboards');
        }
      },
    }),

    getDashboard: tool({
      description: 'Get detailed information about a dashboard including its widgets.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
      }),
      execute: async ({ dashboardId }) => {
        try {
          const dashboard = await ctx.reports.dashboards.get(dashboardId);

          return {
            success: true,
            id: dashboard.id,
            name: dashboard.name,
            description: dashboard.description,
            isShared: dashboard.isShared,
            isDefault: dashboard.isDefault,
            authorName: dashboard.authorName,
            widgets: (dashboard.widgets || []).map((w: DashboardWidget) => ({
              id: w.id,
              name: w.name,
              widgetType: w.widgetType,
              reportId: w.reportId,
              filterId: w.filterId,
              width: w.width,
              height: w.height,
              positionX: w.positionX,
              positionY: w.positionY,
            })),
          };
        } catch (error) {
          return formatError(error, 'getDashboard');
        }
      },
    }),

    createDashboard: tool({
      description: 'Create a new dashboard.',
      parameters: z.object({
        name: z.string().describe('Dashboard name'),
        description: z.string().optional().describe('Dashboard description'),
        isShared: z.boolean().optional().default(true).describe('Whether to share with other users'),
      }),
      execute: async ({ name, description, isShared }) => {
        try {
          console.log(`[Tool:createDashboard] Creating dashboard: ${name}`);
          const dashboardData: Record<string, unknown> = {
            name,
            isShared: isShared !== false,
          };

          if (description) dashboardData.description = description;

          const dashboards = await ctx.reports.dashboards.create([dashboardData]);
          if (dashboards && dashboards.length > 0) {
            console.log(`[Tool:createDashboard] Successfully created dashboard ID: ${dashboards[0].id}`);
            return {
              success: true,
              dashboardId: dashboards[0].id,
              name: dashboards[0].name,
              message: `Dashboard '${dashboards[0].name}' created successfully`,
            };
          }
          return { success: false, error: 'Failed to create dashboard - no response from HaloPSA' };
        } catch (error) {
          return formatError(error, 'createDashboard');
        }
      },
    }),

    addDashboardWidget: tool({
      description: 'Add a widget to a dashboard.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
        name: z.string().describe('Widget name/title'),
        widgetType: z.enum(['chart', 'bar', 'pie', 'line', 'counter', 'counter_report', 'table', 'list']).describe('Type of widget'),
        reportId: z.number().optional().describe('Report ID (required for chart types)'),
        filterId: z.number().optional().describe('Filter ID (required for counter/list types)'),
        ticketAreaId: z.number().optional().describe('Ticket area ID (for counter widgets)'),
        width: z.number().optional().default(4).describe('Widget width (1-12)'),
        height: z.number().optional().default(2).describe('Widget height'),
        positionX: z.number().optional().default(0).describe('X position on grid'),
        positionY: z.number().optional().default(0).describe('Y position on grid'),
        colour: z.string().optional().describe('Widget color (hex code)'),
      }),
      execute: async ({ dashboardId, name, widgetType, reportId, filterId, ticketAreaId, width, height, positionX, positionY, colour }) => {
        try {
          console.log(`[Tool:addDashboardWidget] Adding widget '${name}' to dashboard ${dashboardId}`);
          const widget = await ctx.reports.dashboards.addWidget(dashboardId, {
            name,
            widgetType,
            reportId,
            filterId,
            ticketAreaId,
            width: width || 4,
            height: height || 2,
            positionX: positionX || 0,
            positionY: positionY || 0,
            colour,
          });

          console.log(`[Tool:addDashboardWidget] Successfully added widget ID: ${widget.id}`);
          return {
            success: true,
            widgetId: widget.id,
            dashboardId,
            message: `Widget '${name}' added to dashboard`,
          };
        } catch (error) {
          return formatError(error, 'addDashboardWidget');
        }
      },
    }),
  };
}
