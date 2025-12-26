/**
 * Smart dashboard builder service with automatic report discovery and creation.
 * Ported from Python implementation.
 */

import { ReportService, DashboardService } from './reports';
import type { Report, Dashboard } from '../types/reports';

/**
 * Widget template definition.
 */
interface WidgetTemplate {
  name: string;
  widgetType: number; // 0=bar, 1=pie, 2=counter_report, 6=list, 7=counter_filter
  description: string;
  // For report-based widgets
  reportKeywords: string[];
  fallbackSql: string | null;
  fallbackReportName: string | null;
  // For filter-based widgets
  filterId: number | null;
  ticketareaId: number | null;
  // Styling
  color: string;
  width: number;
  height: number;
}

/**
 * Pre-defined widget templates for common dashboard needs.
 */
export const WIDGET_TEMPLATES: Record<string, WidgetTemplate> = {
  // Counter widgets (filter-based, type 7)
  open_tickets_counter: {
    name: 'Open Tickets',
    widgetType: 7,
    description: 'Counter showing number of open tickets',
    reportKeywords: [],
    fallbackSql: null,
    fallbackReportName: null,
    filterId: 1, // Open Tickets filter
    ticketareaId: 1, // Tickets area
    color: '#0f75b1',
    width: 2,
    height: 2,
  },
  unassigned_counter: {
    name: 'Unassigned Tickets',
    widgetType: 7,
    description: 'Counter showing unassigned tickets',
    reportKeywords: [],
    fallbackSql: null,
    fallbackReportName: null,
    filterId: 1,
    ticketareaId: 1,
    color: '#e83c4a',
    width: 2,
    height: 2,
  },
  closed_tickets_counter: {
    name: 'Closed Today',
    widgetType: 7,
    description: 'Counter showing tickets closed today',
    reportKeywords: [],
    fallbackSql: null,
    fallbackReportName: null,
    filterId: 3, // Closed filter
    ticketareaId: 1,
    color: '#a1c652',
    width: 2,
    height: 2,
  },
  sla_hold_counter: {
    name: 'SLA Hold',
    widgetType: 7,
    description: 'Counter showing tickets on SLA hold',
    reportKeywords: [],
    fallbackSql: null,
    fallbackReportName: null,
    filterId: 2,
    ticketareaId: 1,
    color: '#fcdc00',
    width: 2,
    height: 2,
  },

  // Chart widgets (report-based, types 0, 1)
  tickets_by_priority: {
    name: 'Tickets by Priority',
    widgetType: 1, // Pie chart
    description: 'Pie chart showing ticket distribution by priority',
    reportKeywords: ['priority', 'tickets by priority', 'ticket priority'],
    fallbackSql: `
SELECT
    COALESCE(p.name, 'No Priority') AS Priority,
    COUNT(*) AS Count
FROM Faults f
LEFT JOIN Priority p ON f.priority_id = p.id
WHERE f.statustype_id NOT IN (2, 3)
GROUP BY p.name
ORDER BY Count DESC`,
    fallbackReportName: 'Dashboard - Tickets by Priority',
    filterId: null,
    ticketareaId: null,
    color: '#3498db',
    width: 4,
    height: 3,
  },
  tickets_by_status: {
    name: 'Tickets by Status',
    widgetType: 1, // Pie chart
    description: 'Pie chart showing ticket distribution by status',
    reportKeywords: ['status', 'tickets by status', 'ticket status'],
    fallbackSql: `
SELECT
    s.name AS Status,
    COUNT(*) AS Count
FROM Faults f
JOIN Status s ON f.status_id = s.id
WHERE f.dateoccurred >= DATEADD(day, -30, GETDATE())
GROUP BY s.name
ORDER BY Count DESC`,
    fallbackReportName: 'Dashboard - Tickets by Status',
    filterId: null,
    ticketareaId: null,
    color: '#9b59b6',
    width: 4,
    height: 3,
  },
  tickets_by_client: {
    name: 'Tickets by Client',
    widgetType: 1, // Pie chart
    description: 'Pie chart showing tickets by client',
    reportKeywords: ['client', 'tickets by client', 'customer tickets', 'top clients'],
    fallbackSql: `
SELECT TOP 10
    COALESCE(c.name, 'No Client') AS Client,
    COUNT(*) AS Count
FROM Faults f
LEFT JOIN Client c ON f.client_id = c.id
WHERE f.dateoccurred >= DATEADD(day, -30, GETDATE())
GROUP BY c.name
ORDER BY Count DESC`,
    fallbackReportName: 'Dashboard - Tickets by Client',
    filterId: null,
    ticketareaId: null,
    color: '#e74c3c',
    width: 4,
    height: 3,
  },
  tickets_by_category: {
    name: 'Tickets by Category',
    widgetType: 1, // Pie chart
    description: 'Pie chart showing tickets by category',
    reportKeywords: ['category', 'tickets by category', 'ticket categories'],
    fallbackSql: `
SELECT
    COALESCE(cat.name, 'Uncategorized') AS Category,
    COUNT(*) AS Count
FROM Faults f
LEFT JOIN Category1 cat ON f.category_1 = cat.id
WHERE f.dateoccurred >= DATEADD(day, -30, GETDATE())
GROUP BY cat.name
ORDER BY Count DESC`,
    fallbackReportName: 'Dashboard - Tickets by Category',
    filterId: null,
    ticketareaId: null,
    color: '#2ecc71',
    width: 4,
    height: 3,
  },
  agent_workload: {
    name: 'Agent Workload',
    widgetType: 0, // Bar chart
    description: 'Bar chart showing open tickets per agent',
    reportKeywords: ['agent', 'workload', 'agent workload', 'tickets by agent', 'technician'],
    fallbackSql: `
SELECT
    COALESCE(a.name, 'Unassigned') AS Agent,
    COUNT(*) AS OpenTickets
FROM Faults f
LEFT JOIN Agent a ON f.agent_id = a.id
WHERE f.statustype_id NOT IN (2, 3)
GROUP BY a.name
ORDER BY OpenTickets DESC`,
    fallbackReportName: 'Dashboard - Agent Workload',
    filterId: null,
    ticketareaId: null,
    color: '#f39c12',
    width: 4,
    height: 3,
  },
  tickets_closed_by_agent: {
    name: 'Tickets Closed by Agent',
    widgetType: 0, // Bar chart
    description: 'Bar chart showing tickets closed by each agent',
    reportKeywords: ['closed', 'agent closed', 'closed by agent', 'resolved by'],
    fallbackSql: `
SELECT TOP 10
    COALESCE(a.name, 'Unknown') AS Agent,
    COUNT(*) AS ClosedTickets
FROM Faults f
JOIN Agent a ON f.closedby_agent_id = a.id
WHERE f.dateclosed >= DATEADD(day, -30, GETDATE())
GROUP BY a.name
ORDER BY ClosedTickets DESC`,
    fallbackReportName: 'Dashboard - Tickets Closed by Agent',
    filterId: null,
    ticketareaId: null,
    color: '#1abc9c',
    width: 4,
    height: 3,
  },
  tickets_over_time: {
    name: 'Tickets Over Time',
    widgetType: 0, // Bar/Line chart
    description: 'Chart showing ticket volume over time',
    reportKeywords: ['over time', 'daily tickets', 'weekly tickets', 'trend'],
    fallbackSql: `
SELECT
    CONVERT(varchar, f.dateoccurred, 23) AS Date,
    COUNT(*) AS TicketCount
FROM Faults f
WHERE f.dateoccurred >= DATEADD(day, -30, GETDATE())
GROUP BY CONVERT(varchar, f.dateoccurred, 23)
ORDER BY Date`,
    fallbackReportName: 'Dashboard - Tickets Over Time',
    filterId: null,
    ticketareaId: null,
    color: '#34495e',
    width: 6,
    height: 3,
  },
  sla_performance: {
    name: 'SLA Performance',
    widgetType: 1, // Pie chart
    description: 'Pie chart showing SLA compliance',
    reportKeywords: ['sla', 'sla performance', 'sla breach', 'response time'],
    fallbackSql: `
SELECT
    CASE
        WHEN f.slahold = 1 THEN 'On Hold'
        WHEN f.slabreach = 1 THEN 'Breached'
        ELSE 'Within SLA'
    END AS SLAStatus,
    COUNT(*) AS Count
FROM Faults f
WHERE f.statustype_id NOT IN (2, 3)
GROUP BY
    CASE
        WHEN f.slahold = 1 THEN 'On Hold'
        WHEN f.slabreach = 1 THEN 'Breached'
        ELSE 'Within SLA'
    END`,
    fallbackReportName: 'Dashboard - SLA Performance',
    filterId: null,
    ticketareaId: null,
    color: '#e67e22',
    width: 4,
    height: 3,
  },
  response_time_avg: {
    name: 'Avg Response Time',
    widgetType: 2, // Counter (report-based)
    description: 'Average first response time',
    reportKeywords: ['response time', 'first response', 'average response'],
    fallbackSql: `
SELECT
    CAST(AVG(DATEDIFF(minute, f.dateoccurred, f.firstactiondate)) / 60.0 AS DECIMAL(10,1)) AS AvgResponseHours
FROM Faults f
WHERE f.firstactiondate IS NOT NULL
    AND f.dateoccurred >= DATEADD(day, -30, GETDATE())`,
    fallbackReportName: 'Dashboard - Avg Response Time',
    filterId: null,
    ticketareaId: null,
    color: '#16a085',
    width: 2,
    height: 2,
  },
  top_callers: {
    name: 'Top Callers',
    widgetType: 1, // Pie chart
    description: 'Top users submitting tickets',
    reportKeywords: ['caller', 'top callers', 'users', 'requesters'],
    fallbackSql: `
SELECT TOP 10
    COALESCE(u.name, 'Unknown') AS Caller,
    COUNT(*) AS TicketCount
FROM Faults f
LEFT JOIN Users u ON f.user_id = u.id
WHERE f.dateoccurred >= DATEADD(day, -30, GETDATE())
GROUP BY u.name
ORDER BY TicketCount DESC`,
    fallbackReportName: 'Dashboard - Top Callers',
    filterId: null,
    ticketareaId: null,
    color: '#8e44ad',
    width: 4,
    height: 3,
  },
};

/**
 * Pre-defined dashboard layouts.
 */
export const DASHBOARD_LAYOUTS: Record<string, string[]> = {
  service_desk: [
    'open_tickets_counter',
    'unassigned_counter',
    'sla_hold_counter',
    'closed_tickets_counter',
    'tickets_by_priority',
    'agent_workload',
    'tickets_by_client',
  ],
  management: [
    'open_tickets_counter',
    'closed_tickets_counter',
    'tickets_by_priority',
    'tickets_by_status',
    'agent_workload',
    'sla_performance',
    'tickets_over_time',
  ],
  sla_focused: [
    'open_tickets_counter',
    'sla_hold_counter',
    'sla_performance',
    'response_time_avg',
    'tickets_by_priority',
    'agent_workload',
  ],
  client_focused: [
    'open_tickets_counter',
    'tickets_by_client',
    'top_callers',
    'tickets_by_category',
    'tickets_by_priority',
  ],
  minimal: [
    'open_tickets_counter',
    'unassigned_counter',
    'tickets_by_priority',
    'agent_workload',
  ],
};

/**
 * Widget configuration for API submission.
 */
interface WidgetConfig {
  i: string;
  title: string;
  type: number;
  x: number;
  y: number;
  w: number;
  h: number;
  initialcolour: string;
  report_id?: number;
  filter_id?: number;
  ticketarea_id?: number;
  view_type?: string;
  counter_type?: number;
  count_format_type?: number;
}

/**
 * Build result from dashboard builder.
 */
interface BuildResult {
  success: boolean;
  dashboardId?: number;
  dashboardName?: string;
  widgetsAdded?: number;
  reportsFound?: string[];
  reportsCreated?: string[];
  errors?: string[];
  message?: string;
  error?: string;
  availableLayouts?: string[];
}

/**
 * Service for intelligently building dashboards with automatic report discovery/creation.
 */
export class DashboardBuilderService {
  private reportService: ReportService;
  private dashboardService: DashboardService;
  private reportCache: Report[] | null = null;

  constructor(reportService: ReportService, dashboardService: DashboardService) {
    this.reportService = reportService;
    this.dashboardService = dashboardService;
  }

  /**
   * Get list of available widget templates and layouts.
   */
  getAvailableTemplates(): {
    widgetTemplates: Record<string, { name: string; description: string; type: string; requiresReport: boolean }>;
    dashboardLayouts: Record<string, { widgets: string[]; widgetCount: number }>;
  } {
    const widgetTemplates: Record<string, { name: string; description: string; type: string; requiresReport: boolean }> = {};

    for (const [key, template] of Object.entries(WIDGET_TEMPLATES)) {
      widgetTemplates[key] = {
        name: template.name,
        description: template.description,
        type: [0, 1, 2].includes(template.widgetType) ? 'chart' : 'counter',
        requiresReport: [0, 1, 2].includes(template.widgetType),
      };
    }

    const dashboardLayouts: Record<string, { widgets: string[]; widgetCount: number }> = {};
    for (const [key, widgets] of Object.entries(DASHBOARD_LAYOUTS)) {
      dashboardLayouts[key] = {
        widgets,
        widgetCount: widgets.length,
      };
    }

    return { widgetTemplates, dashboardLayouts };
  }

  /**
   * Get all available reports (cached).
   */
  private async getAllReports(refresh = false): Promise<Report[]> {
    if (this.reportCache === null || refresh) {
      this.reportCache = await this.reportService.list({ count: 500 });
    }
    return this.reportCache;
  }

  /**
   * Find a report matching the given keywords.
   */
  async findMatchingReport(keywords: string[]): Promise<Report | null> {
    if (!keywords || keywords.length === 0) {
      return null;
    }

    const reports = await this.getAllReports();
    let bestMatch: { report: Report | null; score: number } = { report: null, score: 0 };

    for (const report of reports) {
      let score = 0;
      const reportText = `${report.name || ''} ${report.description || ''}`.toLowerCase();

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        // Exact match in name gets high score
        if ((report.name || '').toLowerCase().includes(keywordLower)) {
          score += 10;
        }
        // Match in description
        if ((report.description || '').toLowerCase().includes(keywordLower)) {
          score += 3;
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { report, score };
      }
    }

    // Only return if we have a reasonable match
    if (bestMatch.score >= 5) {
      console.log(`[DashboardBuilder] Found matching report: ${bestMatch.report?.name} (score: ${bestMatch.score})`);
      return bestMatch.report;
    }

    return null;
  }

  /**
   * Create a report for a widget template.
   */
  async createReportForWidget(template: WidgetTemplate): Promise<Report | null> {
    if (!template.fallbackSql || !template.fallbackReportName) {
      console.warn(`[DashboardBuilder] No fallback SQL for template: ${template.name}`);
      return null;
    }

    try {
      const report = await this.reportService.createCustomReport({
        name: template.fallbackReportName,
        sqlQuery: template.fallbackSql.trim(),
        description: `Auto-created for dashboard widget: ${template.name}`,
        category: 'Dashboard',
        isShared: true,
      });
      console.log(`[DashboardBuilder] Created report '${report.name}' (ID: ${report.id})`);
      // Refresh cache
      this.reportCache = null;
      return report;
    } catch (error) {
      console.error(`[DashboardBuilder] Failed to create report for ${template.name}:`, error);
      return null;
    }
  }

  /**
   * Get existing report or create new one for a widget template.
   */
  async getOrCreateReport(template: WidgetTemplate): Promise<number | null> {
    // First try to find existing report
    if (template.reportKeywords.length > 0) {
      const existing = await this.findMatchingReport(template.reportKeywords);
      if (existing && existing.id) {
        console.log(`[DashboardBuilder] Using existing report '${existing.name}' for ${template.name}`);
        return existing.id;
      }
    }

    // Create new report
    const newReport = await this.createReportForWidget(template);
    if (newReport && newReport.id) {
      return newReport.id;
    }

    return null;
  }

  /**
   * Build a widget configuration from a template.
   */
  async buildWidget(
    templateName: string,
    positionX = 0,
    positionY = 0,
    customTitle?: string,
    customColor?: string
  ): Promise<WidgetConfig | null> {
    const template = WIDGET_TEMPLATES[templateName];
    if (!template) {
      console.error(`[DashboardBuilder] Unknown template: ${templateName}`);
      return null;
    }

    const widget: WidgetConfig = {
      i: '0', // Will be set by caller
      title: customTitle || template.name,
      type: template.widgetType,
      x: positionX,
      y: positionY,
      w: template.width,
      h: template.height,
      initialcolour: customColor || template.color,
    };

    // For report-based widgets, find or create report
    if ([0, 1, 2].includes(template.widgetType)) {
      const reportId = await this.getOrCreateReport(template);
      if (!reportId) {
        console.error(`[DashboardBuilder] Could not get/create report for ${templateName}`);
        return null;
      }
      widget.report_id = reportId;
    }

    // For filter-based widgets, add filter settings
    if ([6, 7].includes(template.widgetType)) {
      if (template.filterId) {
        widget.filter_id = template.filterId;
      }
      if (template.ticketareaId) {
        widget.ticketarea_id = template.ticketareaId;
      }
      widget.view_type = 'all';
      widget.counter_type = 0;
      widget.count_format_type = 0;
    }

    return widget;
  }

  /**
   * Build a complete dashboard from a layout or widget list.
   */
  async buildDashboard(
    name: string,
    layout: string | string[] = 'service_desk',
    description = ''
  ): Promise<BuildResult> {
    // Get widget list from layout name or use directly
    let widgetNames: string[];
    if (typeof layout === 'string') {
      const layoutWidgets = DASHBOARD_LAYOUTS[layout];
      if (!layoutWidgets) {
        return {
          success: false,
          error: `Unknown layout: ${layout}`,
          availableLayouts: Object.keys(DASHBOARD_LAYOUTS),
        };
      }
      widgetNames = layoutWidgets;
    } else {
      widgetNames = layout;
    }

    // Build widgets with auto-positioning
    const widgets: WidgetConfig[] = [];
    const errors: string[] = [];
    const reportsCreated: string[] = [];
    const reportsFound: string[] = [];

    // Grid positioning
    let x = 0;
    let y = 0;
    let maxRowHeight = 0;
    const gridWidth = 12;

    for (let i = 0; i < widgetNames.length; i++) {
      const widgetName = widgetNames[i];
      const template = WIDGET_TEMPLATES[widgetName];

      if (!template) {
        errors.push(`Unknown widget template: ${widgetName}`);
        continue;
      }

      // Check if widget fits in current row
      if (x + template.width > gridWidth) {
        x = 0;
        y += maxRowHeight;
        maxRowHeight = 0;
      }

      // Build widget
      const widget = await this.buildWidget(widgetName, x, y);
      if (widget) {
        widget.i = String(i + 1);
        widgets.push(widget);

        // Track what we did
        if ([0, 1, 2].includes(template.widgetType) && template.reportKeywords.length > 0) {
          const existing = await this.findMatchingReport(template.reportKeywords);
          if (existing) {
            reportsFound.push(`${existing.name} (for ${template.name})`);
          } else if (template.fallbackReportName) {
            reportsCreated.push(`${template.fallbackReportName} (for ${template.name})`);
          }
        }
      } else {
        errors.push(`Failed to build widget: ${widgetName}`);
      }

      // Update position
      x += template.width;
      maxRowHeight = Math.max(maxRowHeight, template.height);
    }

    if (widgets.length === 0) {
      return {
        success: false,
        error: 'No widgets could be built',
        errors,
      };
    }

    // Create the dashboard
    try {
      const dashboard = await this.dashboardService.createDashboard({
        name,
        description: description || `Auto-built dashboard with ${widgets.length} widgets`,
        widgets: widgets.map(w => ({
          title: w.title,
          type: w.type,
          reportId: w.report_id,
          filterId: w.filter_id,
          ticketAreaId: w.ticketarea_id,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          colour: w.initialcolour,
          viewType: w.view_type,
          counterType: w.counter_type,
          countFormatType: w.count_format_type,
        })),
      });

      return {
        success: true,
        dashboardId: dashboard.id,
        dashboardName: dashboard.name,
        widgetsAdded: widgets.length,
        reportsFound,
        reportsCreated,
        errors: errors.length > 0 ? errors : undefined,
        message: `Dashboard '${name}' created with ${widgets.length} widgets. Found ${reportsFound.length} existing reports, created ${reportsCreated.length} new reports.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errors,
      };
    }
  }

  /**
   * Suggest widget templates based on a description.
   */
  suggestWidgetsForDescription(description: string): string[] {
    const descriptionLower = description.toLowerCase();
    const suggestions: Map<string, number> = new Map();

    const keywordMap: Record<string, string[]> = {
      open: ['open_tickets_counter'],
      unassigned: ['unassigned_counter'],
      closed: ['closed_tickets_counter', 'tickets_closed_by_agent'],
      sla: ['sla_hold_counter', 'sla_performance'],
      priority: ['tickets_by_priority'],
      status: ['tickets_by_status'],
      client: ['tickets_by_client'],
      customer: ['tickets_by_client', 'top_callers'],
      category: ['tickets_by_category'],
      agent: ['agent_workload', 'tickets_closed_by_agent'],
      workload: ['agent_workload'],
      technician: ['agent_workload', 'tickets_closed_by_agent'],
      trend: ['tickets_over_time'],
      time: ['tickets_over_time', 'response_time_avg'],
      response: ['response_time_avg'],
      caller: ['top_callers'],
      performance: ['sla_performance', 'agent_workload'],
      overview: ['open_tickets_counter', 'tickets_by_priority', 'agent_workload'],
      service: ['open_tickets_counter', 'unassigned_counter', 'agent_workload'],
      management: ['tickets_by_priority', 'sla_performance', 'tickets_over_time'],
    };

    for (const [keyword, templates] of Object.entries(keywordMap)) {
      if (descriptionLower.includes(keyword)) {
        for (const template of templates) {
          suggestions.set(template, (suggestions.get(template) || 0) + 1);
        }
      }
    }

    // Sort by score and return template names
    const sorted = Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // If no matches, suggest a default set
    if (sorted.length === 0) {
      return ['open_tickets_counter', 'tickets_by_priority', 'agent_workload'];
    }

    return sorted.slice(0, 8); // Max 8 widgets
  }
}
