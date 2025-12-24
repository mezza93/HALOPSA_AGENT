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
 * Service for dashboard operations.
 */
export class DashboardService extends BaseService<Dashboard, DashboardApiResponse> {
  protected endpoint = '/Dashboard';

  protected transform(data: DashboardApiResponse): Dashboard {
    return transformDashboard(data);
  }

  /**
   * List shared dashboards.
   */
  async listShared(count = 50, params: ListParams = {}): Promise<Dashboard[]> {
    return this.list({ is_shared: true, count, ...params });
  }

  /**
   * Add a widget to a dashboard.
   */
  async addWidget(dashboardId: number, widget: {
    name: string;
    widgetType: WidgetType;
    reportId?: number;
    filterId?: number;
    ticketAreaId?: number;
    width?: number;
    height?: number;
    positionX?: number;
    positionY?: number;
    colour?: string;
  }): Promise<DashboardWidget> {
    const data: Record<string, unknown> = {
      dashboard_id: dashboardId,
      name: widget.name,
      widget_type: widget.widgetType,
      width: widget.width || 4,
      height: widget.height || 2,
      position_x: widget.positionX || 0,
      position_y: widget.positionY || 0,
    };

    if (widget.reportId) data.report_id = widget.reportId;
    if (widget.filterId) data.filter_id = widget.filterId;
    if (widget.ticketAreaId) data.ticketarea_id = widget.ticketAreaId;
    if (widget.colour) data.initialcolour = widget.colour;

    const response = await this.client.post<DashboardWidget[]>('/DashboardWidget', [data]);
    return Array.isArray(response) ? response[0] : response;
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
