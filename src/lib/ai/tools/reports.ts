/**
 * Report and Dashboard-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Report, ScheduledReport, Dashboard, DashboardWidget } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const MAX_REPORT_ROWS = 100;

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
        const reports = category
          ? await ctx.reports.listByCategory(category, count || DEFAULT_COUNT)
          : await ctx.reports.list({ count: count || DEFAULT_COUNT });

        return reports.map((r: Report) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          description: r.description,
          isShared: r.isShared,
        }));
      },
    }),

    getReport: tool({
      description: 'Get detailed information about a report.',
      parameters: z.object({
        reportId: z.number().describe('The report ID'),
      }),
      execute: async ({ reportId }) => {
        const report = await ctx.reports.get(reportId);
        return {
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
        const result = await ctx.reports.run(reportId, { startDate, endDate });

        return {
          reportId: result.reportId,
          reportName: result.reportName,
          columns: result.columns,
          rows: result.rows.slice(0, MAX_REPORT_ROWS),
          rowCount: result.rowCount,
          executedAt: result.executedAt,
        };
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
        const data = await ctx.reports.export(reportId, {
          format: format || 'csv',
          startDate,
          endDate,
        });

        return {
          format: format || 'csv',
          data,
        };
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
      },
    }),

    // === SCHEDULED REPORTS ===
    listScheduledReports: tool({
      description: 'List scheduled report deliveries.',
      parameters: z.object({
        reportId: z.number().optional().describe('Filter by report ID'),
      }),
      execute: async ({ reportId }) => {
        const schedules = reportId
          ? await ctx.reports.scheduledReports.listByReport(reportId)
          : await ctx.reports.scheduledReports.list();

        return schedules.map((s: ScheduledReport) => ({
          id: s.id,
          name: s.name,
          reportId: s.reportId,
          reportName: s.reportName,
          frequency: s.frequency,
          outputFormat: s.outputFormat,
          nextRun: s.nextRun,
          isActive: s.isActive,
        }));
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
      },
    }),

    // === DASHBOARD OPERATIONS ===
    listDashboards: tool({
      description: 'List available dashboards.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const dashboards = await ctx.reports.dashboards.listShared(count || DEFAULT_COUNT);

        return dashboards.map((d: Dashboard) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          isShared: d.isShared,
          isDefault: d.isDefault,
          widgetCount: d.widgets?.length || 0,
        }));
      },
    }),

    getDashboard: tool({
      description: 'Get detailed information about a dashboard including its widgets.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
      }),
      execute: async ({ dashboardId }) => {
        const dashboard = await ctx.reports.dashboards.get(dashboardId);

        return {
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
        const dashboardData: Record<string, unknown> = {
          name,
          isShared: isShared !== false,
        };

        if (description) dashboardData.description = description;

        const dashboards = await ctx.reports.dashboards.create([dashboardData]);
        if (dashboards && dashboards.length > 0) {
          return {
            success: true,
            dashboardId: dashboards[0].id,
            name: dashboards[0].name,
          };
        }
        return { success: false, error: 'Failed to create dashboard' };
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

        return {
          success: true,
          widgetId: widget.id,
          dashboardId,
          message: `Widget '${name}' added to dashboard`,
        };
      },
    }),
  };
}
