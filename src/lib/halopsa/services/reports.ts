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
      viewType?: string;
      counterType?: number;
      countFormatType?: number;
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
        // Use proper null checks - reportId of 0 is invalid, but > 0 should be included
        if (w.reportId !== undefined && w.reportId !== null && w.reportId > 0) {
          widgetData.report_id = w.reportId;
        }
        if (w.filterId !== undefined && w.filterId !== null && w.filterId > 0) {
          widgetData.filter_id = w.filterId;
        }
        if (w.ticketAreaId !== undefined && w.ticketAreaId !== null && w.ticketAreaId > 0) {
          widgetData.ticketarea_id = w.ticketAreaId;
        }
        if (w.colour) widgetData.initialcolour = w.colour;
        // Additional properties for filter-based widgets
        if (w.viewType !== undefined) widgetData.view_type = w.viewType;
        if (w.counterType !== undefined) widgetData.counter_type = w.counterType;
        if (w.countFormatType !== undefined) widgetData.count_format_type = w.countFormatType;
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
   * Note: HaloPSA API expects lowercase snake_case field names:
   * - 'sql' for the SQL query (not sqlQuery)
   * - 'isshared' for sharing flag (not isShared)
   *
   * For charts to work, you MUST provide chart configuration:
   * - chartType: 0=bar, 1=line, 2=pie, 3=doughnut
   * - xAxis: Column name from SQL for X-axis
   * - yAxis: Column name from SQL for Y-axis (typically 'Count')
   * - count: true to count rows
   */
  async createCustomReport(options: {
    name: string;
    sqlQuery: string;
    description?: string;
    category?: string;
    isShared?: boolean;
    // Chart configuration - REQUIRED for charts to work
    chartType?: number;      // 0=bar, 1=line, 2=pie, 3=doughnut
    xAxis?: string;          // X-axis column name from SQL
    yAxis?: string;          // Y-axis column name (e.g., 'Count')
    xAxisCaption?: string;   // X-axis label
    yAxisCaption?: string;   // Y-axis label
    chartTitle?: string;     // Chart title
    count?: boolean;         // Count mode (true for counting rows)
    showGraphValues?: boolean; // Show values on chart
  }): Promise<Report> {
    const {
      name,
      sqlQuery,
      description,
      category,
      isShared = false,
      chartType,
      xAxis,
      yAxis,
      xAxisCaption,
      yAxisCaption,
      chartTitle,
      count = true,
      showGraphValues = true,
    } = options;

    // Build API payload with correct field names
    const apiData: Record<string, unknown> = {
      name,
      sql: sqlQuery,       // API expects 'sql' not 'sqlQuery'
      isshared: isShared,  // API expects 'isshared' not 'isShared'
    };

    if (description) apiData.description = description;
    if (category) apiData.category = category;

    // Chart configuration - critical for charts to display
    if (chartType !== undefined) {
      apiData.charttype = chartType;
      apiData.count = count;
      apiData.showgraphvalues = showGraphValues;

      if (xAxis) apiData.xaxis = xAxis;
      if (yAxis) apiData.yaxis = yAxis;
      if (xAxisCaption) apiData.xaxiscaption = xAxisCaption;
      if (yAxisCaption) apiData.yaxiscaption = yAxisCaption;
      if (chartTitle) apiData.charttitle = chartTitle || name;
    }

    // Post directly to ensure correct field names are used
    const response = await this.client.post<ReportApiResponse[] | ReportApiResponse>(
      this.endpoint,
      [apiData]
    );

    console.log(`[ReportService] createCustomReport response:`, JSON.stringify(response).substring(0, 500));

    // Handle response which may be array or single object
    if (Array.isArray(response) && response.length > 0) {
      const report = this.transform(response[0]);
      if (!report.id || report.id <= 0) {
        throw new Error(`Report created but no valid ID returned. Response: ${JSON.stringify(response[0]).substring(0, 200)}`);
      }
      console.log(`[ReportService] Created report '${report.name}' with ID: ${report.id}`);
      return report;
    } else if (response && typeof response === 'object' && 'id' in response) {
      const report = this.transform(response as ReportApiResponse);
      if (!report.id || report.id <= 0) {
        throw new Error(`Report created but no valid ID returned. Response: ${JSON.stringify(response).substring(0, 200)}`);
      }
      console.log(`[ReportService] Created report '${report.name}' with ID: ${report.id}`);
      return report;
    }

    // API didn't return expected format - throw error instead of returning invalid report
    throw new Error(`Failed to create report: unexpected API response format. Response: ${JSON.stringify(response).substring(0, 200)}`);
  }
}

/**
 * Repository report from HaloPSA's online repository.
 * These are pre-built, tested reports that can be imported.
 */
export interface RepositoryReport {
  id: number;
  name: string;
  description?: string;
  sql?: string;
  chartType?: number;
  category?: string;
  isPublished?: boolean;
  publishedId?: string;
  systemReportId?: number;
  isBuiltIn?: boolean;
  xAxis?: string;
  yAxis?: string;
  chartTitle?: string;
}

/**
 * API response for repository reports.
 */
interface RepositoryReportApiResponse {
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  sql?: string;
  _sql?: string;
  chart_type?: number;
  charttype?: number;
  category?: string;
  group_id?: number;
  is_published?: boolean;
  published_id?: string;
  systemreportid?: number;
  builtinid?: boolean;
  xaxis?: string;
  yaxis?: string;
  charttitle?: string;
}

/**
 * Transform API response to RepositoryReport.
 */
function transformRepositoryReport(data: RepositoryReportApiResponse): RepositoryReport {
  return {
    id: data.id ?? 0,
    name: data.name ?? data.title ?? '',
    description: data.description,
    sql: data.sql ?? data._sql,
    chartType: data.chart_type ?? data.charttype,
    category: data.category,
    isPublished: data.is_published,
    publishedId: data.published_id,
    systemReportId: data.systemreportid,
    isBuiltIn: data.builtinid,
    xAxis: data.xaxis,
    yAxis: data.yaxis,
    chartTitle: data.charttitle,
  };
}

/**
 * Service for accessing HaloPSA's online report repository.
 *
 * The Report Repository contains pre-built, tested reports that are
 * guaranteed to work with the HaloPSA database schema. This is much
 * more reliable than creating custom SQL reports.
 *
 * Key endpoints:
 * - GET /ReportRepository - List available reports
 * - GET /ReportRepository/{id} - Get specific report details
 * - GET /ReportRepository/ReportCategories - List report categories
 */
export class ReportRepositoryService {
  private client: HaloPSAClient;
  private endpoint = '/ReportRepository';

  constructor(client: HaloPSAClient) {
    this.client = client;
  }

  /**
   * List all available reports from the HaloPSA repository.
   *
   * @param options - Query options
   * @param options.includepublished - Include published/shared reports (default: true)
   * @param options.chartonly - Only return reports suitable for charts (default: false)
   * @param options.search - Search for specific reports by name/description
   * @param options.reportgroup_id - Filter by report group
   * @param options.count - Max number of reports to return
   */
  async list(options: {
    includepublished?: boolean;
    chartonly?: boolean;
    search?: string;
    reportgroup_id?: number;
    count?: number;
    type?: number;
  } = {}): Promise<RepositoryReport[]> {
    const params: Record<string, string | number | boolean> = {
      includepublished: options.includepublished ?? true,
    };

    if (options.chartonly !== undefined) params.chartonly = options.chartonly;
    if (options.search) params.search = options.search;
    if (options.reportgroup_id) params.reportgroup_id = options.reportgroup_id;
    if (options.count) params.count = options.count;
    if (options.type !== undefined) params.type = options.type;

    const response = await this.client.get<RepositoryReportApiResponse[] | { reports?: RepositoryReportApiResponse[] }>(
      this.endpoint,
      params
    );

    let reports: RepositoryReportApiResponse[] = [];
    if (Array.isArray(response)) {
      reports = response;
    } else if (response && typeof response === 'object' && 'reports' in response && Array.isArray(response.reports)) {
      reports = response.reports;
    }

    return reports.map(transformRepositoryReport);
  }

  /**
   * List reports suitable for dashboard charts.
   * These reports have SQL that produces chart-friendly output.
   */
  async listChartReports(options: {
    search?: string;
    count?: number;
  } = {}): Promise<RepositoryReport[]> {
    return this.list({
      includepublished: true,
      chartonly: true,
      search: options.search,
      count: options.count ?? 100,
    });
  }

  /**
   * Search for reports in the repository.
   */
  async search(query: string, options: {
    chartonly?: boolean;
    count?: number;
  } = {}): Promise<RepositoryReport[]> {
    return this.list({
      includepublished: true,
      search: query,
      chartonly: options.chartonly,
      count: options.count ?? 50,
    });
  }

  /**
   * Get a specific report from the repository by ID.
   *
   * @param id - Repository report ID
   * @param options - Additional options
   * @param options.includedetails - Include full report details including SQL
   */
  async get(id: number, options: {
    includedetails?: boolean;
    loadreport?: boolean;
  } = {}): Promise<RepositoryReport> {
    const params: Record<string, string | boolean> = {};
    if (options.includedetails !== undefined) params.includedetails = options.includedetails;
    if (options.loadreport !== undefined) params.loadreport = options.loadreport;

    const response = await this.client.get<RepositoryReportApiResponse>(
      `${this.endpoint}/${id}`,
      params
    );

    return transformRepositoryReport(response);
  }

  /**
   * Get report categories from the repository.
   */
  async getCategories(): Promise<Array<{ id: number; name: string }>> {
    const response = await this.client.get<Array<{ id?: number; name?: string; value?: string }>>(
      `${this.endpoint}/ReportCategories`
    );

    if (Array.isArray(response)) {
      return response.map(c => ({
        id: c.id ?? 0,
        name: c.name ?? c.value ?? '',
      }));
    }

    return [];
  }

  /**
   * Import a report from the repository into your HaloPSA instance.
   *
   * This fetches the report configuration from the repository and creates
   * a local copy that can be used for dashboards.
   *
   * @param repositoryReportId - The ID of the report in the repository
   * @param reportService - The ReportService to use for creating the local report
   * @param options - Import options
   */
  async importReport(
    repositoryReportId: number,
    reportService: ReportService,
    options: {
      name?: string; // Override the report name
      isShared?: boolean;
      // Chart configuration overrides (optional)
      chartType?: number;
      xAxis?: string;
      yAxis?: string;
    } = {}
  ): Promise<Report> {
    // Fetch the full report from the repository
    const repoReport = await this.get(repositoryReportId, { includedetails: true, loadreport: true });

    if (!repoReport.sql) {
      throw new Error(`Repository report ${repositoryReportId} does not have SQL - cannot import.`);
    }

    // Build report options including chart configuration from repository or overrides
    const reportOptions: Parameters<typeof reportService.createCustomReport>[0] = {
      name: options.name ?? repoReport.name ?? `Imported Report ${repositoryReportId}`,
      sqlQuery: repoReport.sql,
      description: repoReport.description ?? `Imported from HaloPSA Report Repository (ID: ${repositoryReportId})`,
      category: repoReport.category ?? 'Imported',
      isShared: options.isShared ?? true,
    };

    // Include chart configuration from repository or overrides
    if (options.chartType !== undefined || repoReport.chartType !== undefined) {
      reportOptions.chartType = options.chartType ?? repoReport.chartType;
      reportOptions.xAxis = options.xAxis ?? repoReport.xAxis;
      reportOptions.yAxis = options.yAxis ?? repoReport.yAxis;
      reportOptions.chartTitle = repoReport.chartTitle ?? repoReport.name;
      reportOptions.count = true;
      reportOptions.showGraphValues = true;

      console.log(`[ReportRepository] Importing with chart config: chartType=${reportOptions.chartType}, xAxis='${reportOptions.xAxis}', yAxis='${reportOptions.yAxis}'`);
    }

    // Create a local copy of the report
    const localReport = await reportService.createCustomReport(reportOptions);

    console.log(`[ReportRepository] Imported report '${localReport.name}' (ID: ${localReport.id}) from repository ID ${repositoryReportId}`);

    return localReport;
  }

  /**
   * Find a repository report by keywords and optionally import it.
   *
   * @param keywords - Keywords to search for (e.g., "priority", "status", "agent workload")
   * @param options - Search and import options
   */
  async findAndImport(
    keywords: string[],
    reportService: ReportService,
    options: {
      chartonly?: boolean;
      namePrefix?: string;
      isShared?: boolean;
    } = {}
  ): Promise<Report | null> {
    // Search for matching reports
    for (const keyword of keywords) {
      const results = await this.search(keyword, {
        chartonly: options.chartonly ?? true,
        count: 10,
      });

      // Find the best match
      for (const result of results) {
        // Score based on name matching
        const nameLower = (result.name || '').toLowerCase();
        const keywordLower = keyword.toLowerCase();

        if (nameLower.includes(keywordLower) || keywordLower.includes(nameLower)) {
          // Import this report
          const imported = await this.importReport(result.id, reportService, {
            name: options.namePrefix
              ? `${options.namePrefix} - ${result.name}`
              : result.name,
            isShared: options.isShared ?? true,
          });

          return imported;
        }
      }
    }

    return null;
  }
}
