/**
 * Report and Dashboard-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Report, ScheduledReport, Dashboard, DashboardWidget } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT, MAX_PAGE_SIZE: MAX_REPORT_ROWS } = TOOL_DEFAULTS;

export function createReportTools(ctx: HaloContext) {
  return {
    // === REPORT OPERATIONS ===
    listReports: tool({
      description: 'List available reports with optional filtering.',
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

    searchReports: tool({
      description: `Search for reports by name, description, or keywords.
Use this to find existing reports before creating new ones.
More effective than listReports for finding specific reports.`,
      parameters: z.object({
        query: z.string().describe('Search query (name, description, or keywords)'),
        category: z.string().optional().describe('Filter by category'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum results'),
        includeSystem: z.boolean().optional().default(false).describe('Include system reports'),
      }),
      execute: async ({ query, category, count, includeSystem }) => {
        try {
          const reports = await ctx.reports.search(query, {
            count: count || DEFAULT_COUNT,
            category,
            includeSystem: includeSystem || false,
          });

          return {
            success: true,
            count: reports.length,
            reports: reports.map((r: Report) => ({
              id: r.id,
              name: r.name,
              category: r.category,
              description: r.description,
              isShared: r.isShared,
            })),
            message: reports.length > 0
              ? `Found ${reports.length} reports matching "${query}"`
              : `No reports found matching "${query}"`,
          };
        } catch (error) {
          return formatError(error, 'searchReports');
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

    cloneReport: tool({
      description: 'Clone/duplicate an existing report.',
      parameters: z.object({
        reportId: z.number().describe('The report ID to clone'),
        newName: z.string().optional().describe('Name for the cloned report (optional)'),
      }),
      execute: async ({ reportId, newName }) => {
        try {
          const cloned = await ctx.reports.clone(reportId, newName);
          return {
            success: true,
            originalId: reportId,
            newReportId: cloned.id,
            name: cloned.name,
            message: `Report cloned successfully as '${cloned.name}' (ID: ${cloned.id})`,
          };
        } catch (error) {
          return formatError(error, 'cloneReport');
        }
      },
    }),

    previewReportSql: tool({
      description: `Preview/test a SQL query without saving it as a report.
Use this to validate SQL before creating a report.
Returns sample rows and column information.`,
      parameters: z.object({
        sqlQuery: z.string().describe('SQL query to test'),
        maxRows: z.number().optional().default(10).describe('Maximum rows to return'),
        startDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
      }),
      execute: async ({ sqlQuery, maxRows, startDate, endDate }) => {
        try {
          const result = await ctx.reports.preview(sqlQuery, {
            maxRows: maxRows || 10,
            startDate,
            endDate,
          });

          if (result.error) {
            return {
              success: false,
              error: result.error,
              message: 'SQL query failed - check syntax and table/column names',
            };
          }

          return {
            success: true,
            columns: result.columns,
            sampleRows: result.rows,
            rowCount: result.rowCount,
            message: `Query valid: ${result.rowCount} rows, ${result.columns.length} columns`,
          };
        } catch (error) {
          return formatError(error, 'previewReportSql');
        }
      },
    }),

    getReportColumns: tool({
      description: `Get the column names from a report's SQL query.
Useful for understanding report structure and configuring chart axes.`,
      parameters: z.object({
        reportId: z.number().describe('The report ID'),
      }),
      execute: async ({ reportId }) => {
        try {
          const result = await ctx.reports.getColumns(reportId);
          return {
            success: true,
            reportId,
            columns: result.columns,
            columnCount: result.columns.length,
            message: `Report has ${result.columns.length} columns`,
          };
        } catch (error) {
          return formatError(error, 'getReportColumns');
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
      }),
      execute: async ({ name, description }) => {
        try {
          console.log(`[Tool:createDashboard] Creating dashboard: ${name}`);
          const dashboard = await ctx.reports.dashboards.createDashboard({
            name,
            description,
          });

          console.log(`[Tool:createDashboard] Successfully created dashboard ID: ${dashboard.id}`);
          return {
            success: true,
            dashboardId: dashboard.id,
            name: dashboard.name,
            message: `Dashboard '${dashboard.name}' created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createDashboard');
        }
      },
    }),

    addDashboardWidget: tool({
      description: `Add a widget to a dashboard. Widget types:
- 'bar' or 'chart': Bar chart (requires reportId)
- 'pie': Pie/donut chart (requires reportId)
- 'counter_report': Counter based on report (requires reportId)
- 'list': List widget (requires filterId)
- 'counter': Counter based on filter (requires filterId and ticketAreaId)`,
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
        title: z.string().describe('Widget title'),
        widgetType: z.enum(['chart', 'bar', 'pie', 'counter_report', 'list', 'counter']).describe('Type of widget'),
        reportId: z.number().optional().describe('Report ID (required for bar, pie, counter_report types)'),
        filterId: z.number().optional().describe('Filter ID (required for list, counter types)'),
        ticketAreaId: z.number().optional().describe('Ticket area ID (required for counter type). Common values: 1=Tickets, 2=Projects'),
        width: z.number().optional().default(4).describe('Widget width (1-12)'),
        height: z.number().optional().default(2).describe('Widget height'),
        positionX: z.number().optional().default(0).describe('X position on grid'),
        positionY: z.number().optional().default(0).describe('Y position on grid'),
        colour: z.string().optional().describe('Widget color (hex code)'),
      }),
      execute: async ({ dashboardId, title, widgetType, reportId, filterId, ticketAreaId, width, height, positionX, positionY, colour }) => {
        try {
          // Convert string widget type to numeric type for HaloPSA API
          const widgetTypeMap: Record<string, number> = {
            'chart': 0,      // Bar chart
            'bar': 0,        // Bar chart
            'pie': 1,        // Pie/donut chart
            'counter_report': 2,  // Counter based on report
            'list': 6,       // List widget
            'counter': 7,    // Counter based on filter
          };
          const numericWidgetType = widgetTypeMap[widgetType] ?? 0;

          console.log(`[Tool:addDashboardWidget] Adding widget '${title}' (type ${numericWidgetType}) to dashboard ${dashboardId}`);

          const updatedDashboard = await ctx.reports.dashboards.addWidget(dashboardId, {
            title,
            widgetType: numericWidgetType,
            reportId,
            filterId,
            ticketAreaId,
            width: width || 4,
            height: height || 2,
            positionX: positionX || 0,
            positionY: positionY || 0,
            colour,
          });

          console.log(`[Tool:addDashboardWidget] Successfully added widget to dashboard ${updatedDashboard.id}`);
          return {
            success: true,
            dashboardId: updatedDashboard.id,
            widgetCount: updatedDashboard.widgets?.length || 0,
            message: `Widget '${title}' added to dashboard`,
          };
        } catch (error) {
          return formatError(error, 'addDashboardWidget');
        }
      },
    }),

    updateDashboard: tool({
      description: 'Update an existing dashboard (name, description, sharing).',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID to update'),
        name: z.string().optional().describe('New dashboard name'),
        description: z.string().optional().describe('New description'),
        isShared: z.boolean().optional().describe('Whether to share with other users'),
      }),
      execute: async ({ dashboardId, name, description, isShared }) => {
        try {
          const updated = await ctx.reports.dashboards.updateDashboard(dashboardId, {
            name,
            description,
            isShared,
          });

          return {
            success: true,
            dashboardId: updated.id,
            name: updated.name,
            isShared: updated.isShared,
            message: `Dashboard '${updated.name}' updated successfully`,
          };
        } catch (error) {
          return formatError(error, 'updateDashboard');
        }
      },
    }),

    deleteDashboard: tool({
      description: 'Delete a dashboard.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID to delete'),
      }),
      execute: async ({ dashboardId }) => {
        try {
          await ctx.reports.dashboards.deleteDashboard(dashboardId);
          return {
            success: true,
            dashboardId,
            message: `Dashboard ${dashboardId} deleted successfully`,
          };
        } catch (error) {
          return formatError(error, 'deleteDashboard');
        }
      },
    }),

    cloneDashboard: tool({
      description: 'Clone/duplicate an existing dashboard with all its widgets.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID to clone'),
        newName: z.string().optional().describe('Name for the cloned dashboard'),
      }),
      execute: async ({ dashboardId, newName }) => {
        try {
          const cloned = await ctx.reports.dashboards.cloneDashboard(dashboardId, newName);
          return {
            success: true,
            originalId: dashboardId,
            newDashboardId: cloned.id,
            name: cloned.name,
            widgetCount: cloned.widgets?.length || 0,
            message: `Dashboard cloned as '${cloned.name}' (ID: ${cloned.id})`,
          };
        } catch (error) {
          return formatError(error, 'cloneDashboard');
        }
      },
    }),

    shareDashboard: tool({
      description: 'Share or unshare a dashboard.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
        isShared: z.boolean().describe('Whether to share (true) or unshare (false)'),
      }),
      execute: async ({ dashboardId, isShared }) => {
        try {
          const updated = await ctx.reports.dashboards.setShared(dashboardId, isShared);
          return {
            success: true,
            dashboardId: updated.id,
            isShared: updated.isShared,
            message: isShared
              ? `Dashboard '${updated.name}' is now shared`
              : `Dashboard '${updated.name}' is no longer shared`,
          };
        } catch (error) {
          return formatError(error, 'shareDashboard');
        }
      },
    }),

    // === WIDGET OPERATIONS ===
    listDashboardWidgets: tool({
      description: 'List all widgets on a dashboard with their details.',
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
      }),
      execute: async ({ dashboardId }) => {
        try {
          const widgets = await ctx.reports.dashboards.getWidgets(dashboardId);

          return {
            success: true,
            dashboardId,
            widgetCount: widgets.length,
            widgets: widgets.map((w: DashboardWidget, index: number) => ({
              index,
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
          return formatError(error, 'listDashboardWidgets');
        }
      },
    }),

    updateDashboardWidget: tool({
      description: `Update a specific widget on a dashboard.
Use listDashboardWidgets first to get widget indices.`,
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
        widgetIndex: z.number().describe('Widget index (0-based, use listDashboardWidgets to find)'),
        title: z.string().optional().describe('New widget title'),
        reportId: z.number().optional().describe('New report ID'),
        filterId: z.number().optional().describe('New filter ID'),
        width: z.number().optional().describe('New width (1-12)'),
        height: z.number().optional().describe('New height'),
        positionX: z.number().optional().describe('New X position'),
        positionY: z.number().optional().describe('New Y position'),
        colour: z.string().optional().describe('New color (hex code)'),
      }),
      execute: async ({ dashboardId, widgetIndex, title, reportId, filterId, width, height, positionX, positionY, colour }) => {
        try {
          const updated = await ctx.reports.dashboards.updateWidget(dashboardId, widgetIndex, {
            title,
            reportId,
            filterId,
            width,
            height,
            positionX,
            positionY,
            colour,
          });

          return {
            success: true,
            dashboardId: updated.id,
            widgetIndex,
            widgetCount: updated.widgets?.length || 0,
            message: `Widget ${widgetIndex} updated successfully`,
          };
        } catch (error) {
          return formatError(error, 'updateDashboardWidget');
        }
      },
    }),

    removeDashboardWidget: tool({
      description: `Remove a widget from a dashboard.
Use listDashboardWidgets first to get widget indices.`,
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID'),
        widgetIndex: z.number().describe('Widget index to remove (0-based)'),
      }),
      execute: async ({ dashboardId, widgetIndex }) => {
        try {
          const updated = await ctx.reports.dashboards.removeWidget(dashboardId, widgetIndex);

          return {
            success: true,
            dashboardId: updated.id,
            widgetCount: updated.widgets?.length || 0,
            message: `Widget removed. Dashboard now has ${updated.widgets?.length || 0} widgets`,
          };
        } catch (error) {
          return formatError(error, 'removeDashboardWidget');
        }
      },
    }),

    // === CHART CONFIGURATION HELPERS ===
    createChartReport: tool({
      description: `Create a report specifically configured for charts.
This is the recommended way to create reports for dashboard widgets.

IMPORTANT: For charts to display correctly, you MUST specify:
- chartType: The type of chart (0=bar, 1=line, 2=pie, 3=doughnut)
- xAxis: Column name from SQL to use for X-axis labels (must match exactly)
- yAxis: Column name from SQL to use for Y-axis values (must match exactly)

Example SQL: SELECT Priority, COUNT(*) as Count FROM Faults GROUP BY Priority
For this, use xAxis='Priority', yAxis='Count'`,
      parameters: z.object({
        name: z.string().describe('Report name'),
        sqlQuery: z.string().describe('SQL query for the chart data'),
        chartType: z.enum(['bar', 'line', 'pie', 'doughnut']).describe('Chart type'),
        xAxis: z.string().describe('Column name for X-axis (must match SQL alias exactly)'),
        yAxis: z.string().describe('Column name for Y-axis (must match SQL alias exactly)'),
        description: z.string().optional().describe('Report description'),
        category: z.string().optional().describe('Report category'),
        chartTitle: z.string().optional().describe('Chart title (defaults to report name)'),
        isShared: z.boolean().optional().default(true).describe('Whether to share the report'),
      }),
      execute: async ({ name, sqlQuery, chartType, xAxis, yAxis, description, category, chartTitle, isShared }) => {
        try {
          const chartTypeMap: Record<string, number> = {
            'bar': 0,
            'line': 1,
            'pie': 2,
            'doughnut': 3,
          };

          const report = await ctx.reports.createCustomReport({
            name,
            sqlQuery,
            description,
            category,
            isShared: isShared ?? true,
            chartType: chartTypeMap[chartType],
            xAxis,
            yAxis,
            chartTitle: chartTitle || name,
            count: false, // SQL already has counts
            showGraphValues: true,
          });

          return {
            success: true,
            reportId: report.id,
            name: report.name,
            chartType,
            xAxis,
            yAxis,
            message: `Chart report '${report.name}' created (ID: ${report.id}). Ready to use in dashboard widgets.`,
          };
        } catch (error) {
          return formatError(error, 'createChartReport');
        }
      },
    }),

    getChartTypes: tool({
      description: 'Get available chart types and their configuration requirements.',
      parameters: z.object({}),
      execute: async () => {
        return {
          success: true,
          chartTypes: [
            {
              type: 'bar',
              code: 0,
              description: 'Bar chart - good for comparing categories',
              requirements: 'SQL must return at least 2 columns: one for labels (xAxis), one for values (yAxis)',
              example: 'SELECT Priority, COUNT(*) as Count FROM Faults GROUP BY Priority',
            },
            {
              type: 'line',
              code: 1,
              description: 'Line chart - good for trends over time',
              requirements: 'SQL must return date/time column for xAxis and numeric column for yAxis',
              example: 'SELECT CAST(DateOccurred AS DATE) as Date, COUNT(*) as Count FROM Faults GROUP BY CAST(DateOccurred AS DATE)',
            },
            {
              type: 'pie',
              code: 2,
              description: 'Pie chart - good for showing proportions',
              requirements: 'SQL must return category column (xAxis) and count/value column (yAxis)',
              example: 'SELECT Status, COUNT(*) as Count FROM Faults GROUP BY Status',
            },
            {
              type: 'doughnut',
              code: 3,
              description: 'Doughnut chart - similar to pie with hollow center',
              requirements: 'Same as pie chart',
              example: 'SELECT Category, COUNT(*) as Count FROM Faults GROUP BY Category',
            },
          ],
          widgetTypes: [
            { type: 'bar', code: 0, description: 'Bar chart widget (requires reportId)' },
            { type: 'pie', code: 1, description: 'Pie/doughnut chart widget (requires reportId)' },
            { type: 'counter_report', code: 2, description: 'Counter showing report total (requires reportId)' },
            { type: 'list', code: 6, description: 'List of items (requires filterId)' },
            { type: 'counter', code: 7, description: 'Counter from filter (requires filterId + ticketAreaId)' },
          ],
        };
      },
    }),
  };
}
