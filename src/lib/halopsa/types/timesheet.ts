/**
 * Timesheet types for HaloPSA API.
 * Enhanced time tracking beyond basic time entries.
 */

import type { HaloBaseEntity } from './common';

/**
 * Timesheet status.
 */
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';

/**
 * Timesheet period type.
 */
export type TimesheetPeriodType = 'daily' | 'weekly' | 'biweekly' | 'monthly';

/**
 * Timesheet entity - represents a period of time entries.
 */
export interface Timesheet extends HaloBaseEntity {
  agentId: number;
  agentName?: string;
  periodType: TimesheetPeriodType;
  periodStartDate: string;
  periodEndDate: string;
  status: TimesheetStatus;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  overtimeHours?: number;
  submittedAt?: string;
  submittedBy?: number;
  approvedAt?: string;
  approvedBy?: number;
  approverName?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
  entryCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw timesheet from API.
 */
export interface TimesheetApiResponse {
  id: number;
  agent_id?: number;
  agent_name?: string;
  period_type?: string;
  period_start_date?: string;
  period_end_date?: string;
  status?: string;
  total_hours?: number;
  billable_hours?: number;
  non_billable_hours?: number;
  overtime_hours?: number;
  submitted_at?: string;
  submitted_by?: number;
  approved_at?: string;
  approved_by?: number;
  approver_name?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  notes?: string;
  entry_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Enhanced timesheet event (time entry) with additional fields.
 */
export interface TimesheetEvent extends HaloBaseEntity {
  timesheetId?: number;
  agentId: number;
  agentName?: string;
  ticketId?: number;
  ticketNumber?: string;
  ticketSummary?: string;
  clientId?: number;
  clientName?: string;
  projectId?: number;
  projectName?: string;
  activityId?: number;
  activityName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  durationMinutes: number;
  isBillable: boolean;
  isOvertime: boolean;
  rate?: number;
  amount?: number;
  description?: string;
  internalNotes?: string;
  status: 'pending' | 'approved' | 'invoiced';
  invoiceId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw timesheet event from API.
 */
export interface TimesheetEventApiResponse {
  id: number;
  timesheet_id?: number;
  agent_id?: number;
  agent_name?: string;
  ticket_id?: number;
  ticket_number?: string;
  ticket_summary?: string;
  client_id?: number;
  client_name?: string;
  project_id?: number;
  project_name?: string;
  activity_id?: number;
  activity_name?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  duration_minutes?: number;
  is_billable?: boolean;
  is_overtime?: boolean;
  rate?: number;
  amount?: number;
  description?: string;
  internal_notes?: string;
  status?: string;
  invoice_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Timesheet summary statistics.
 */
export interface TimesheetSummary {
  agentId: number;
  agentName?: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  overtimeHours: number;
  totalAmount?: number;
  byClient?: {
    clientId: number;
    clientName: string;
    hours: number;
    billableHours: number;
    amount?: number;
  }[];
  byProject?: {
    projectId: number;
    projectName: string;
    hours: number;
    billableHours: number;
    amount?: number;
  }[];
  byActivity?: {
    activityId: number;
    activityName: string;
    hours: number;
  }[];
  byDay?: {
    date: string;
    hours: number;
    billableHours: number;
    entryCount: number;
  }[];
}

/**
 * Activity type for time categorization.
 */
export interface ActivityType extends HaloBaseEntity {
  name: string;
  description?: string;
  code?: string;
  isBillable: boolean;
  isActive: boolean;
  defaultRate?: number;
  color?: string;
  order?: number;
}

/**
 * Raw activity type from API.
 */
export interface ActivityTypeApiResponse {
  id: number;
  name?: string;
  description?: string;
  code?: string;
  is_billable?: boolean;
  is_active?: boolean;
  default_rate?: number;
  color?: string;
  order?: number;
  [key: string]: unknown;
}

/**
 * Transform API response to Timesheet interface.
 */
export function transformTimesheet(data: TimesheetApiResponse): Timesheet {
  const statusMap: Record<string, TimesheetStatus> = {
    draft: 'draft',
    submitted: 'submitted',
    approved: 'approved',
    rejected: 'rejected',
    locked: 'locked',
  };

  const periodTypeMap: Record<string, TimesheetPeriodType> = {
    daily: 'daily',
    weekly: 'weekly',
    biweekly: 'biweekly',
    monthly: 'monthly',
  };

  return {
    id: data.id,
    agentId: data.agent_id || 0,
    agentName: data.agent_name,
    periodType: periodTypeMap[data.period_type || ''] || 'weekly',
    periodStartDate: data.period_start_date || '',
    periodEndDate: data.period_end_date || '',
    status: statusMap[data.status || ''] || 'draft',
    totalHours: data.total_hours || 0,
    billableHours: data.billable_hours || 0,
    nonBillableHours: data.non_billable_hours || 0,
    overtimeHours: data.overtime_hours,
    submittedAt: data.submitted_at,
    submittedBy: data.submitted_by,
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    approverName: data.approver_name,
    rejectedAt: data.rejected_at,
    rejectedBy: data.rejected_by,
    rejectionReason: data.rejection_reason,
    notes: data.notes,
    entryCount: data.entry_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to TimesheetEvent interface.
 */
export function transformTimesheetEvent(data: TimesheetEventApiResponse): TimesheetEvent {
  const statusMap: Record<string, 'pending' | 'approved' | 'invoiced'> = {
    pending: 'pending',
    approved: 'approved',
    invoiced: 'invoiced',
  };

  return {
    id: data.id,
    timesheetId: data.timesheet_id,
    agentId: data.agent_id || 0,
    agentName: data.agent_name,
    ticketId: data.ticket_id,
    ticketNumber: data.ticket_number,
    ticketSummary: data.ticket_summary,
    clientId: data.client_id,
    clientName: data.client_name,
    projectId: data.project_id,
    projectName: data.project_name,
    activityId: data.activity_id,
    activityName: data.activity_name,
    date: data.date || '',
    startTime: data.start_time,
    endTime: data.end_time,
    duration: data.duration || 0,
    durationMinutes: data.duration_minutes || (data.duration ? data.duration * 60 : 0),
    isBillable: data.is_billable ?? true,
    isOvertime: data.is_overtime ?? false,
    rate: data.rate,
    amount: data.amount,
    description: data.description,
    internalNotes: data.internal_notes,
    status: statusMap[data.status || ''] || 'pending',
    invoiceId: data.invoice_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ActivityType interface.
 */
export function transformActivityType(data: ActivityTypeApiResponse): ActivityType {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    code: data.code,
    isBillable: data.is_billable ?? true,
    isActive: data.is_active ?? true,
    defaultRate: data.default_rate,
    color: data.color,
    order: data.order,
  };
}
