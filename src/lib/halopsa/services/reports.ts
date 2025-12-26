/**
 * Report and Dashboard services for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Report,
  ReportApiResponse,
  ReportResult,
  ScheduledReport,
  ScheduledReportApiResponse,
  Dashboard,
  DashboardApiResponse,
  DashboardWidget,
  WidgetType,
  transformReport,
  transformScheduledReport,
  transformDashboard,
} from '../types/reports';
import { ListParams } from '../types/common';

/**
 * Service for scheduled report operations.
 */
export class ScheduledReportService extends BaseService<ScheduledReport, ScheduledReportApiResponse> {
  protected endpoint = '/ScheduledReport';

  protected transform(data: ScheduledReportApiResponse): ScheduledReport {
    return transformScheduledReport(data);
  }

  /**
   * List scheduled reports for a specific report.
   */
  async listByReport(reportId: number, params: ListParams = {}): Promise<ScheduledReport[]> {
    return this.list({ report_id: reportId, ...params });
  }

  /**
   * Create a scheduled report delivery.
   */
  async schedule(options: {
    reportId: number;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    outputFormat?: 'pdf' | 'csv' | 'excel';
    timeOfDay?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  }): Promise<ScheduledReport> {
    const {
      reportId,
      name,
      frequency,
      recipients,
      outputFormat = 'pdf',
      timeOfDay = '08:00',
      dayOfWeek,
      dayOfMonth,
    } = options;

    const data: Record<string, unknown> = {
      report_id: reportId,
      name,
      frequency,
      recipients,
      output_format: outputFormat,
      time_of_day: timeOfDay,
    };

    if (frequency === 'weekly' && dayOfWeek) data.day_of_week = dayOfWeek;
    if (frequency === 'monthly' && dayOfMonth) data.day_of_month = dayOfMonth;

    const results = await this.create([data as Partial<ScheduledReport>]);
    return results[0];
  }
}

/**
 * Widget type constants matching HaloPSA API.
 *
 * Widget Types:
 *   0 = Chart (bar/line) - REQUIRES valid report_id > 0
 *   1 = Chart (pie/donut) - REQUIRES valid report_id > 0
 *   2 = Counter/KPI (report-based) - REQUIRES valid report_id > 0
 *   6 = List - requires filter_id or tree_id
 *   7 = Counter (filter-based) - requires filter_id + ticketarea_id
 */
export const WIDGET_TYPES = {
  CHART_BAR: 0,
  CHART_PIE: 1,
  COUNTER_REPORT: 2,
  LIST: 6,
  COUNTER_FILTER: 7,
} as const;

// Widget types that REQUIRE a valid report_id
const REPORT_BASED_WIDGET_TYPES = new Set([0, 1, 2]);

// Widget types that use filter_id instead
const FILTER_BASED_WIDGET_TYPES = new Set([6, 7]);

/**
 * Service for dashboard operations.
 *
 * Note: HaloPSA uses /DashboardLinks endpoint for dashboards.
 * Widgets are embedded within the dashboard object, not a separate endpoint.
 */
export class DashboardService extends BaseService<Dashboard, DashboardApiResponse> {
  protected endpoint = '/DashboardLinks';

  protected transform(data: DashboardApiResponse): Dashboard {
    return transformDashboard(data);
  }

  /**
   * List all dashboards.
   */
  async listAll(count = 50, params: ListParams = {}): Promise<Dashboard[]> {
    return this.list({ count, ...params });
  }

  /**
   * List shared dashboards.
   */
  async listShared(count = 50, params: ListParams = {}): Promise<Dashboard[]> {
    return this.list({ is_shared: true, count, ...params });
  }

  /**
   * Validate widget configuration based on widget type.
   */
  validateWidgetConfig(
    widgetType: number,
    reportId?: number,
    filterId?: number,
    ticketAreaId?: number,
  ): { valid: boolean; error?: string } {
    // Chart widgets (0, 1, 2) REQUIRE a valid report_id
    if (REPORT_BASED_WIDGET_TYPES.has(widgetType)) {
      if (!reportId || reportId <= 0) {
        const typeNames: Record<number, string> = { 0: 'bar chart', 1: 'pie chart', 2: 'counter (report-based)' };
        const typeName = typeNames[widgetType] || `type ${widgetType}`;
        return {
          valid: false,
          error: `Widget type '${typeName}' requires a valid report_id > 0. Got report_id=${reportId}. Use listReports to find available reports.`,
        };
      }
    }

    // Filter-based widgets (6, 7) REQUIRE filter_id
    if (FILTER_BASED_WIDGET_TYPES.has(widgetType)) {
      if (!filterId || filterId <= 0) {
        const typeNames: Record<number, string> = { 6: 'list', 7: 'counter (filter-based)' };
        const typeName = typeNames[widgetType] || `type ${widgetType}`;
        return {
          valid: false,
          error: `Widget type '${typeName}' requires a valid filter_id > 0. Got filter_id=${filterId}.`,
        };
      }
      // Type 7 also needs ticketarea_id
      if (widgetType === 7 && (!ticketAreaId || ticketAreaId <= 0)) {
        return {
          valid: false,
          error: `Widget type 'counter (filter-based)' requires ticketarea_id > 0. Got ticketarea_id=${ticketAreaId}. Common values: 1=Tickets, 2=Projects.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Create a new dashboard.
   */
  async createDashboard(options: {
    name: string;
    description?: string;
    widgets?: Array<{
      title: string;
      type: number;
      reportId?: number;
      filterId?: number;
      ticketAreaId?: number;
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      colour?: string;
    }>;
  }): Promise<Dashboard> {
    const { name, description, widgets } = options;

    const dashboardData: Record<string, unknown> = { name };
    if (description) dashboardData.description = description;

    if (widgets && widgets.length > 0) {
      dashboardData.widgets = widgets.map((w, index) => {
        const widgetData: Record<string, unknown> = {
          i: String(index + 1),
          title: w.title,
          type: w.type,
          x: w.x ?? 0,
          y: w.y ?? 0,
          w: w.w ?? 4,
          h: w.h ?? 2,
        };
        if (w.reportId) widgetData.report_id = w.reportId;
        if (w.filterId) widgetData.filter_id = w.filterId;
        if (w.ticketAreaId) widgetData.ticketarea_id = w.ticketAreaId;
        if (w.colour) widgetData.initialcolour = w.colour;
        return widgetData;
      });
    }

    const response = await this.client.post<DashboardApiResponse[] | DashboardApiResponse>(
      this.endpoint,
      [dashboardData]
    );

    if (Array.isArray(response) && response.length > 0) {
      return this.transform(response[0]);
    } else if (response && typeof response === 'object' && 'id' in response) {
      return this.transform(response as DashboardApiResponse);
    }

    return { id: 0, name, isShared: false, isDefault: false, widgets: [] };
  }

  /**
   * Update a dashboard.
   */
  async updateDashboard(
    dashboardId: number,
    options: {
      name?: string;
      description?: string;
      isShared?: boolean;
      widgets?: Array<Record<string, unknown>>;
    }
  ): Promise<Dashboard> {
    const updateData: Record<string, unknown> = { id: dashboardId };
    if (options.name !== undefined) updateData.name = options.name;
    if (options.description !== undefined) updateData.description = options.description;
    if (options.isShared !== undefined) updateData.is_shared = options.isShared;
    if (options.widgets !== undefined) updateData.widgets = options.widgets;

    const response = await this.client.post<DashboardApiResponse[] | DashboardApiResponse>(
      this.endpoint,
      [updateData]
    );

    if (Array.isArray(response) && response.length > 0) {
      return this.transform(response[0]);
    } else if (response && typeof response === 'object' && 'id' in response) {
      return this.transform(response as DashboardApiResponse);
    }

    return this.get(dashboardId);
  }

  /**
   * Add a widget to a dashboard.
   *
   * This fetches the current dashboard, adds the widget to its widgets list,
   * and updates the dashboard.
   */
  async addWidget(dashboardId: number, widget: {
    title: string;
    widgetType: number;
    reportId?: number;
    filterId?: number;
    ticketAreaId?: number;
    width?: number;
    height?: number;
    positionX?: number;
    positionY?: number;
    colour?: string;
  }): Promise<Dashboard> {
    // Validate widget configuration
    const validation = this.validateWidgetConfig(
      widget.widgetType,
      widget.reportId,
      widget.filterId,
      widget.ticketAreaId
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get current dashboard
    const dashboard = await this.get(dashboardId);

    // Build widget list - preserve existing widgets
    const existingWidgets: Array<Record<string, unknown>> = [];
    let maxI = 0;

    if (dashboard.widgets && dashboard.widgets.length > 0) {
      for (const w of dashboard.widgets) {
        const widgetDict: Record<string, unknown> = {};

        // Get 'i' from original response if available
        const rawWidget = w as unknown as Record<string, unknown>;
        if (rawWidget.i) {
          widgetDict.i = rawWidget.i;
          const iNum = parseInt(String(rawWidget.i), 10);
          if (!isNaN(iNum)) maxI = Math.max(maxI, iNum);
        }

        // Position and size
        if (w.positionX !== undefined) widgetDict.x = w.positionX;
        if (w.positionY !== undefined) widgetDict.y = w.positionY;
        if (w.width !== undefined) widgetDict.w = w.width;
        if (w.height !== undefined) widgetDict.h = w.height;

        // Widget content
        if (w.name) widgetDict.title = w.name;
        if (rawWidget.type !== undefined) widgetDict.type = rawWidget.type;
        if (w.reportId) widgetDict.report_id = w.reportId;
        if (w.filterId) widgetDict.filter_id = w.filterId;
        if (w.ticketAreaId) widgetDict.ticketarea_id = w.ticketAreaId;
        if (w.colour) widgetDict.initialcolour = w.colour;

        existingWidgets.push(widgetDict);
      }
    }

    // Build new widget
    const newWidget: Record<string, unknown> = {
      i: String(maxI + 1),
      title: widget.title,
      type: widget.widgetType,
      x: widget.positionX ?? 0,
      y: widget.positionY ?? 0,
      w: widget.width ?? 4,
      h: widget.height ?? 2,
    };

    if (widget.reportId) newWidget.report_id = widget.reportId;
    if (widget.filterId) newWidget.filter_id = widget.filterId;
    if (widget.ticketAreaId) newWidget.ticketarea_id = widget.ticketAreaId;
    if (widget.colour) newWidget.initialcolour = widget.colour;

    existingWidgets.push(newWidget);

    // Update dashboard with new widgets list
    return this.updateDashboard(dashboardId, { widgets: existingWidgets });
  }

  /**
   * Delete a dashboard.
   */
  async deleteDashboard(dashboardId: number): Promise<void> {
    await this.client.delete(`${this.endpoint}/${dashboardId}`);
  }
}

/**
 * Service for report operations.
 */
export class ReportService extends BaseService<Report, ReportApiResponse> {
  protected endpoint = '/Report';

  public scheduledReports: ScheduledReportService;
  public dashboards: DashboardService;

  constructor(client: HaloPSAClient) {
    super(client);
    this.scheduledReports = new ScheduledReportService(client);
    this.dashboards = new DashboardService(client);
  }

  protected transform(data: ReportApiResponse): Report {
    return transformReport(data);
  }

  /**
   * List reports by category.
   */
  async listByCategory(category: string, count = 50, params: ListParams = {}): Promise<Report[]> {
    return this.list({ category, count, ...params });
  }

  /**
   * Run a report and get results.
   */
  async run(reportId: number, options: {
    startDate?: Date | string;
    endDate?: Date | string;
  } = {}): Promise<ReportResult> {
    const { startDate, endDate } = options;

    const params: Record<string, string> = {};
    if (startDate) params.startdate = startDate instanceof Date ? startDate.toISOString() : startDate;
    if (endDate) params.enddate = endDate instanceof Date ? endDate.toISOString() : endDate;

    const response = await this.client.get<{
      columns?: string[];
      rows?: Record<string, unknown>[];
      record_count?: number;
    }>(`${this.endpoint}/${reportId}/run`, params);

    const report = await this.get(reportId);

    return {
      reportId,
      reportName: report.name,
      columns: response.columns || [],
      rows: response.rows || [],
      rowCount: response.record_count || (response.rows?.length || 0),
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Export a report to CSV or JSON format.
   */
  async export(reportId: number, options: {
    format?: 'csv' | 'json';
    startDate?: Date | string;
    endDate?: Date | string;
  } = {}): Promise<string> {
    const { format = 'csv', startDate, endDate } = options;

    const params: Record<string, string> = { format };
    if (startDate) params.startdate = startDate instanceof Date ? startDate.toISOString() : startDate;
    if (endDate) params.enddate = endDate instanceof Date ? endDate.toISOString() : endDate;

    const response = await this.client.get<string>(`${this.endpoint}/${reportId}/export`, params);
    return response;
  }

  /**
   * Create a custom report with SQL query.
   */
  async createCustomReport(options: {
    name: string;
    sqlQuery: string;
    description?: string;
    category?: string;
    isShared?: boolean;
  }): Promise<Report> {
    const { name, sqlQuery, description, category, isShared = false } = options;

    const data: Partial<Report> = {
      name,
      sqlQuery,
      isShared,
    };

    if (description) data.description = description;
    if (category) data.category = category;

    const results = await this.create([data]);
    return results[0];
  }
}
