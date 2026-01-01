// @ts-nocheck - Vitest tool execute() returns union types that require verbose narrowing
/**
 * Unit tests for Report and Dashboard AI tools.
 *
 * These tests verify that all report and dashboard tools:
 * 1. Accept valid parameters
 * 2. Call the correct service methods
 * 3. Return properly formatted responses
 * 4. Handle errors gracefully
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReportTools } from '@/lib/ai/tools/reports';
import { createMockHaloContext, createReport, createDashboard, createWidget, resetFactoryIds } from '../../../../mocks/factories';
import type { HaloContext } from '@/lib/ai/tools/context';

describe('Report and Dashboard AI Tools', () => {
  let ctx: ReturnType<typeof createMockHaloContext>;
  let tools: ReturnType<typeof createReportTools>;

  beforeEach(() => {
    resetFactoryIds();
    ctx = createMockHaloContext();
    tools = createReportTools(ctx as unknown as HaloContext);
  });

  // ========== REPORT TOOLS ==========

  describe('listReports', () => {
    it('should list reports without filters', async () => {
      const result = await tools.listReports.execute({ count: 10 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(ctx.reports.list).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('reports');
      expect(Array.isArray((result as { reports: unknown[] }).reports)).toBe(true);
    });

    it('should filter reports by category', async () => {
      const result = await tools.listReports.execute({ category: 'Tickets', count: 10 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(ctx.reports.listByCategory).toHaveBeenCalledWith('Tickets', 10);
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('searchReports', () => {
    it('should search reports by query', async () => {
      const result = await tools.searchReports.execute(
        { query: 'priority', count: 10, includeSystem: false },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.search).toHaveBeenCalledWith('priority', expect.any(Object));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count');
    });

    it('should return message when no results found', async () => {
      ctx.reports.search = vi.fn().mockResolvedValue([]);

      const result = await tools.searchReports.execute(
        { query: 'nonexistent', count: 10, includeSystem: false },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 0);
      expect((result as { message: string }).message).toContain('No reports found');
    });
  });

  describe('getReport', () => {
    it('should get a report by ID', async () => {
      const result = await tools.getReport.execute({ reportId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(ctx.reports.get).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('should handle non-existent report', async () => {
      ctx.reports.get = vi.fn().mockRejectedValue(new Error('Not found'));

      const result = await tools.getReport.execute({ reportId: 999 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('runReport', () => {
    it('should run a report and return results', async () => {
      const result = await tools.runReport.execute(
        { reportId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.run).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('rowCount');
    });

    it('should pass date filters', async () => {
      const result = await tools.runReport.execute(
        { reportId: 1, startDate: '2024-01-01', endDate: '2024-01-31' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.run).toHaveBeenCalledWith(1, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('createReport', () => {
    it('should create a new report', async () => {
      const result = await tools.createReport.execute(
        {
          name: 'New Report',
          sqlQuery: 'SELECT * FROM Faults',
          description: 'Test report',
          isShared: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.createCustomReport).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Report',
        sqlQuery: 'SELECT * FROM Faults',
      }));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('reportId');
    });
  });

  describe('updateReport', () => {
    it('should update an existing report', async () => {
      const result = await tools.updateReport.execute(
        { reportId: 1, name: 'Updated Name' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.update).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      const result = await tools.deleteReport.execute(
        { reportId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.delete).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('success', true);
      expect((result as { message: string }).message).toContain('deleted');
    });
  });

  describe('cloneReport', () => {
    it('should clone a report', async () => {
      const result = await tools.cloneReport.execute(
        { reportId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.clone).toHaveBeenCalledWith(1, undefined);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newReportId');
    });

    it('should clone with custom name', async () => {
      const result = await tools.cloneReport.execute(
        { reportId: 1, newName: 'My Clone' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.clone).toHaveBeenCalledWith(1, 'My Clone');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('previewReportSql', () => {
    it('should preview SQL and return sample data', async () => {
      const result = await tools.previewReportSql.execute(
        { sqlQuery: 'SELECT * FROM Faults', maxRows: 5 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.preview).toHaveBeenCalledWith('SELECT * FROM Faults', expect.any(Object));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('sampleRows');
    });

    it('should handle SQL errors', async () => {
      ctx.reports.preview = vi.fn().mockResolvedValue({
        columns: [],
        rows: [],
        rowCount: 0,
        error: 'Invalid SQL',
      });

      const result = await tools.previewReportSql.execute(
        { sqlQuery: 'INVALID SQL', maxRows: 5 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Invalid SQL');
    });
  });

  describe('getReportColumns', () => {
    it('should return report columns', async () => {
      const result = await tools.getReportColumns.execute(
        { reportId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.getColumns).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('columnCount');
    });
  });

  // ========== DASHBOARD TOOLS ==========

  describe('listDashboards', () => {
    it('should list dashboards', async () => {
      const result = await tools.listDashboards.execute(
        { count: 10 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.listShared).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('dashboards');
    });
  });

  describe('getDashboard', () => {
    it('should get dashboard with widgets', async () => {
      const result = await tools.getDashboard.execute(
        { dashboardId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.get).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('widgets');
    });
  });

  describe('createDashboard', () => {
    it('should create a new dashboard', async () => {
      const result = await tools.createDashboard.execute(
        { name: 'New Dashboard', description: 'Test dashboard' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.createDashboard).toHaveBeenCalledWith({
        name: 'New Dashboard',
        description: 'Test dashboard',
      });
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('dashboardId');
    });
  });

  describe('updateDashboard', () => {
    it('should update dashboard properties', async () => {
      const result = await tools.updateDashboard.execute(
        { dashboardId: 1, name: 'Updated Dashboard', isShared: true },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.updateDashboard).toHaveBeenCalledWith(1, {
        name: 'Updated Dashboard',
        description: undefined,
        isShared: true,
      });
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('deleteDashboard', () => {
    it('should delete a dashboard', async () => {
      const result = await tools.deleteDashboard.execute(
        { dashboardId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.deleteDashboard).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('cloneDashboard', () => {
    it('should clone a dashboard with widgets', async () => {
      const result = await tools.cloneDashboard.execute(
        { dashboardId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.cloneDashboard).toHaveBeenCalledWith(1, undefined);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newDashboardId');
    });
  });

  describe('shareDashboard', () => {
    it('should share a dashboard', async () => {
      const result = await tools.shareDashboard.execute(
        { dashboardId: 1, isShared: true },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.setShared).toHaveBeenCalledWith(1, true);
      expect(result).toHaveProperty('success', true);
      expect((result as { message: string }).message).toContain('shared');
    });

    it('should unshare a dashboard', async () => {
      const result = await tools.shareDashboard.execute(
        { dashboardId: 1, isShared: false },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.setShared).toHaveBeenCalledWith(1, false);
      expect((result as { message: string }).message).toContain('no longer shared');
    });
  });

  // ========== WIDGET TOOLS ==========

  describe('addDashboardWidget', () => {
    it('should add a chart widget', async () => {
      const result = await tools.addDashboardWidget.execute(
        {
          dashboardId: 1,
          title: 'Priority Chart',
          widgetType: 'bar',
          reportId: 1,
          width: 6,
          height: 3,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.addWidget).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Priority Chart',
        widgetType: 0, // bar = 0
        reportId: 1,
      }));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('widgetCount');
    });

    it('should add a counter widget', async () => {
      const result = await tools.addDashboardWidget.execute(
        {
          dashboardId: 1,
          title: 'Open Tickets',
          widgetType: 'counter',
          filterId: 1,
          ticketAreaId: 1,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.addWidget).toHaveBeenCalledWith(1, expect.objectContaining({
        widgetType: 7, // counter = 7
        filterId: 1,
        ticketAreaId: 1,
      }));
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('listDashboardWidgets', () => {
    it('should list all widgets on a dashboard', async () => {
      const result = await tools.listDashboardWidgets.execute(
        { dashboardId: 1 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.getWidgets).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('widgetCount');
      expect(result).toHaveProperty('widgets');
    });
  });

  describe('updateDashboardWidget', () => {
    it('should update a widget', async () => {
      const result = await tools.updateDashboardWidget.execute(
        {
          dashboardId: 1,
          widgetIndex: 0,
          title: 'Updated Widget',
          width: 8,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.updateWidget).toHaveBeenCalledWith(1, 0, expect.objectContaining({
        title: 'Updated Widget',
        width: 8,
      }));
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('removeDashboardWidget', () => {
    it('should remove a widget', async () => {
      const result = await tools.removeDashboardWidget.execute(
        { dashboardId: 1, widgetIndex: 0 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.dashboards.removeWidget).toHaveBeenCalledWith(1, 0);
      expect(result).toHaveProperty('success', true);
    });
  });

  // ========== CHART TOOLS ==========

  describe('createChartReport', () => {
    it('should create a bar chart report', async () => {
      const result = await tools.createChartReport.execute(
        {
          name: 'Priority Chart',
          sqlQuery: 'SELECT Priority, COUNT(*) as Count FROM Faults GROUP BY Priority',
          chartType: 'bar',
          xAxis: 'Priority',
          yAxis: 'Count',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.createCustomReport).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Priority Chart',
        chartType: 0, // bar = 0
        xAxis: 'Priority',
        yAxis: 'Count',
      }));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('chartType', 'bar');
    });

    it('should create a pie chart report', async () => {
      const result = await tools.createChartReport.execute(
        {
          name: 'Status Pie',
          sqlQuery: 'SELECT Status, COUNT(*) as Count FROM Faults GROUP BY Status',
          chartType: 'pie',
          xAxis: 'Status',
          yAxis: 'Count',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.createCustomReport).toHaveBeenCalledWith(expect.objectContaining({
        chartType: 2, // pie = 2
      }));
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('getChartTypes', () => {
    it('should return chart type information', async () => {
      const result = await tools.getChartTypes.execute(
        {},
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('chartTypes');
      expect(result).toHaveProperty('widgetTypes');
      expect((result as { chartTypes: unknown[] }).chartTypes.length).toBeGreaterThan(0);
    });
  });

  // ========== ERROR HANDLING ==========

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      ctx.reports.list = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const result = await tools.listReports.execute(
        { count: 10 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should handle network errors', async () => {
      ctx.reports.dashboards.createDashboard = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await tools.createDashboard.execute(
        { name: 'Test' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result).toHaveProperty('success', false);
    });
  });

  // ========== SCHEDULED REPORTS ==========

  describe('listScheduledReports', () => {
    it('should list scheduled reports', async () => {
      const result = await tools.listScheduledReports.execute(
        {},
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.scheduledReports.list).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('schedules');
    });
  });

  describe('createScheduledReport', () => {
    it('should create a scheduled report', async () => {
      const result = await tools.createScheduledReport.execute(
        {
          reportId: 1,
          name: 'Daily Report',
          frequency: 'daily',
          recipients: ['admin@test.com'],
          outputFormat: 'pdf',
          timeOfDay: '09:00',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(ctx.reports.scheduledReports.schedule).toHaveBeenCalledWith(expect.objectContaining({
        reportId: 1,
        name: 'Daily Report',
        frequency: 'daily',
      }));
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('scheduleId');
    });
  });
});
