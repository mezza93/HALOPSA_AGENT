/**
 * Report and Dashboard related types for HaloPSA.
 */

import { HaloBaseEntity } from './common';

/**
 * Report entity.
 */
export interface Report extends HaloBaseEntity {
  name: string;
  description?: string;
  category?: string;
  sqlQuery?: string;
  isShared: boolean;
  authorId?: number;
  authorName?: string;
  dateCreated?: Date | string;
  dateModified?: Date | string;
}

/**
 * Raw report from API.
 */
export interface ReportApiResponse {
  id: number;
  name: string;
  description?: string;
  category?: string;
  sql_query?: string;
  is_shared?: boolean;
  author_id?: number;
  author_name?: string;
  datecreated?: string;
  datemodified?: string;
  [key: string]: unknown;
}

/**
 * Report result from running a report.
 */
export interface ReportResult {
  reportId: number;
  reportName: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executedAt: Date | string;
}

/**
 * Scheduled report delivery.
 */
export interface ScheduledReport extends HaloBaseEntity {
  name: string;
  reportId: number;
  reportName?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  outputFormat: 'pdf' | 'csv' | 'excel';
  timeOfDay?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive: boolean;
  lastRun?: Date | string;
  nextRun?: Date | string;
}

/**
 * Raw scheduled report from API.
 */
export interface ScheduledReportApiResponse {
  id: number;
  name: string;
  report_id: number;
  report_name?: string;
  frequency?: string;
  recipients?: string[];
  output_format?: string;
  time_of_day?: string;
  day_of_week?: number;
  day_of_month?: number;
  is_active?: boolean;
  last_run?: string;
  next_run?: string;
  [key: string]: unknown;
}

/**
 * Dashboard widget type.
 */
export type WidgetType = 'chart' | 'bar' | 'pie' | 'line' | 'counter' | 'counter_report' | 'table' | 'list';

/**
 * Dashboard widget.
 */
export interface DashboardWidget extends HaloBaseEntity {
  dashboardId: number;
  name: string;
  widgetType: WidgetType;
  reportId?: number;
  filterId?: number;
  ticketAreaId?: number;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  colour?: string;
}

/**
 * Raw widget from API.
 */
export interface DashboardWidgetApiResponse {
  id: number;
  dashboard_id: number;
  name: string;
  widget_type?: string;
  report_id?: number;
  filter_id?: number;
  ticketarea_id?: number;
  width?: number;
  height?: number;
  position_x?: number;
  position_y?: number;
  initialcolour?: string;
  [key: string]: unknown;
}

/**
 * Dashboard entity.
 */
export interface Dashboard extends HaloBaseEntity {
  name: string;
  description?: string;
  isShared: boolean;
  isDefault: boolean;
  authorId?: number;
  authorName?: string;
  widgets: DashboardWidget[];
}

/**
 * Raw dashboard from API.
 */
export interface DashboardApiResponse {
  id: number;
  name: string;
  description?: string;
  is_shared?: boolean;
  is_default?: boolean;
  author_id?: number;
  author_name?: string;
  widgets?: DashboardWidgetApiResponse[];
  [key: string]: unknown;
}

/**
 * Transform API response to Report interface.
 */
export function transformReport(data: ReportApiResponse): Report {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    sqlQuery: data.sql_query,
    isShared: data.is_shared ?? false,
    authorId: data.author_id,
    authorName: data.author_name,
    dateCreated: data.datecreated,
    dateModified: data.datemodified,
  };
}

/**
 * Transform API response to ScheduledReport interface.
 */
export function transformScheduledReport(data: ScheduledReportApiResponse): ScheduledReport {
  return {
    id: data.id,
    name: data.name,
    reportId: data.report_id,
    reportName: data.report_name,
    frequency: (data.frequency as 'daily' | 'weekly' | 'monthly') || 'weekly',
    recipients: data.recipients || [],
    outputFormat: (data.output_format as 'pdf' | 'csv' | 'excel') || 'pdf',
    timeOfDay: data.time_of_day,
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    isActive: data.is_active ?? true,
    lastRun: data.last_run,
    nextRun: data.next_run,
  };
}

/**
 * Transform API response to DashboardWidget interface.
 */
export function transformWidget(data: DashboardWidgetApiResponse): DashboardWidget {
  return {
    id: data.id,
    dashboardId: data.dashboard_id,
    name: data.name,
    widgetType: (data.widget_type as WidgetType) || 'chart',
    reportId: data.report_id,
    filterId: data.filter_id,
    ticketAreaId: data.ticketarea_id,
    width: data.width || 4,
    height: data.height || 2,
    positionX: data.position_x || 0,
    positionY: data.position_y || 0,
    colour: data.initialcolour,
  };
}

/**
 * Transform API response to Dashboard interface.
 */
export function transformDashboard(data: DashboardApiResponse): Dashboard {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isShared: data.is_shared ?? false,
    isDefault: data.is_default ?? false,
    authorId: data.author_id,
    authorName: data.author_name,
    widgets: (data.widgets || []).map(transformWidget),
  };
}
