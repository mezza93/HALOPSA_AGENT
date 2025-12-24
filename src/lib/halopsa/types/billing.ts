/**
 * Time tracking and billing-related types for HaloPSA.
 */

import { HaloBaseEntity } from './common';

/**
 * Time entry record.
 */
export interface TimeEntry extends HaloBaseEntity {
  ticketId?: number;
  ticketSummary?: string;
  agentId?: number;
  agentName?: string;
  clientId?: number;
  clientName?: string;
  projectId?: number;
  projectName?: string;
  durationMinutes: number;
  note?: string;
  activityType?: string;
  billable: boolean;
  billed: boolean;
  billedDate?: Date | string;
  entryDate?: Date | string;
  dateCreated?: Date | string;
  hourlyRate?: number;
}

/**
 * Raw time entry from API.
 */
export interface TimeEntryApiResponse {
  id: number;
  ticket_id?: number;
  ticket_summary?: string;
  agent_id?: number;
  agent_name?: string;
  client_id?: number;
  client_name?: string;
  project_id?: number;
  project_name?: string;
  duration_minutes?: number;
  timetaken?: number;
  note?: string;
  activity_type?: string;
  billable?: boolean;
  billed?: boolean;
  billed_date?: string;
  entry_date?: string;
  datecreated?: string;
  hourly_rate?: number;
  [key: string]: unknown;
}

/**
 * Invoice status.
 */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

/**
 * Invoice line item.
 */
export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

/**
 * Invoice entity.
 */
export interface Invoice extends HaloBaseEntity {
  invoiceNumber?: string;
  clientId: number;
  clientName?: string;
  status: InvoiceStatus;
  dateIssued?: Date | string;
  dateDue?: Date | string;
  datePaid?: Date | string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  poNumber?: string;
  notes?: string;
  lines: InvoiceLine[];
}

/**
 * Raw invoice from API.
 */
export interface InvoiceApiResponse {
  id: number;
  invoice_number?: string;
  client_id: number;
  client_name?: string;
  status?: string;
  date_issued?: string;
  date_due?: string;
  date_paid?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  amount_paid?: number;
  amount_due?: number;
  po_number?: string;
  notes?: string;
  lines?: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    amount?: number;
    tax_rate?: number;
  }>;
  [key: string]: unknown;
}

/**
 * Project status.
 */
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';

/**
 * Project entity.
 */
export interface Project extends HaloBaseEntity {
  name: string;
  clientId?: number;
  clientName?: string;
  description?: string;
  status: ProjectStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  budgetHours?: number;
  budgetAmount?: number;
  hoursUsed?: number;
  amountUsed?: number;
  projectManagerId?: number;
  projectManagerName?: string;
  isBillable: boolean;
}

/**
 * Raw project from API.
 */
export interface ProjectApiResponse {
  id: number;
  name: string;
  client_id?: number;
  client_name?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget_hours?: number;
  budget_amount?: number;
  hours_used?: number;
  amount_used?: number;
  project_manager_id?: number;
  project_manager_name?: string;
  is_billable?: boolean;
  [key: string]: unknown;
}

/**
 * Expense entity.
 */
export interface Expense extends HaloBaseEntity {
  amount: number;
  description: string;
  expenseDate?: Date | string;
  category?: string;
  ticketId?: number;
  projectId?: number;
  clientId?: number;
  clientName?: string;
  agentId?: number;
  agentName?: string;
  billable: boolean;
  billed: boolean;
  reimbursable: boolean;
  reimbursed: boolean;
}

/**
 * Raw expense from API.
 */
export interface ExpenseApiResponse {
  id: number;
  amount?: number;
  description?: string;
  expense_date?: string;
  category?: string;
  ticket_id?: number;
  project_id?: number;
  client_id?: number;
  client_name?: string;
  agent_id?: number;
  agent_name?: string;
  billable?: boolean;
  billed?: boolean;
  reimbursable?: boolean;
  reimbursed?: boolean;
  [key: string]: unknown;
}

/**
 * Time summary statistics.
 */
export interface TimeSummary {
  totalMinutes: number;
  totalHours: number;
  billableMinutes: number;
  billableHours: number;
  nonBillableMinutes: number;
  billedMinutes: number;
  unBilledMinutes: number;
  byAgent: Record<string, number>;
  byClient: Record<string, number>;
}

/**
 * Invoice summary statistics.
 */
export interface InvoiceSummary {
  totalCount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  byStatus: Record<InvoiceStatus, number>;
}

/**
 * Transform API response to TimeEntry interface.
 */
export function transformTimeEntry(data: TimeEntryApiResponse): TimeEntry {
  return {
    id: data.id,
    ticketId: data.ticket_id,
    ticketSummary: data.ticket_summary,
    agentId: data.agent_id,
    agentName: data.agent_name,
    clientId: data.client_id,
    clientName: data.client_name,
    projectId: data.project_id,
    projectName: data.project_name,
    durationMinutes: data.duration_minutes || data.timetaken || 0,
    note: data.note,
    activityType: data.activity_type,
    billable: data.billable ?? true,
    billed: data.billed ?? false,
    billedDate: data.billed_date,
    entryDate: data.entry_date,
    dateCreated: data.datecreated,
    hourlyRate: data.hourly_rate,
  };
}

/**
 * Transform API response to Invoice interface.
 */
export function transformInvoice(data: InvoiceApiResponse): Invoice {
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    clientName: data.client_name,
    status: (data.status as InvoiceStatus) || 'draft',
    dateIssued: data.date_issued,
    dateDue: data.date_due,
    datePaid: data.date_paid,
    subtotal: data.subtotal || 0,
    taxAmount: data.tax_amount || 0,
    totalAmount: data.total_amount || 0,
    amountPaid: data.amount_paid || 0,
    amountDue: data.amount_due || 0,
    poNumber: data.po_number,
    notes: data.notes,
    lines: (data.lines || []).map((line) => ({
      description: line.description || '',
      quantity: line.quantity || 0,
      unitPrice: line.unit_price || 0,
      amount: line.amount || 0,
      taxRate: line.tax_rate,
    })),
  };
}

/**
 * Transform API response to Project interface.
 */
export function transformProject(data: ProjectApiResponse): Project {
  return {
    id: data.id,
    name: data.name,
    clientId: data.client_id,
    clientName: data.client_name,
    description: data.description,
    status: (data.status as ProjectStatus) || 'active',
    startDate: data.start_date,
    endDate: data.end_date,
    budgetHours: data.budget_hours,
    budgetAmount: data.budget_amount,
    hoursUsed: data.hours_used,
    amountUsed: data.amount_used,
    projectManagerId: data.project_manager_id,
    projectManagerName: data.project_manager_name,
    isBillable: data.is_billable ?? true,
  };
}

/**
 * Transform API response to Expense interface.
 */
export function transformExpense(data: ExpenseApiResponse): Expense {
  return {
    id: data.id,
    amount: data.amount || 0,
    description: data.description || '',
    expenseDate: data.expense_date,
    category: data.category,
    ticketId: data.ticket_id,
    projectId: data.project_id,
    clientId: data.client_id,
    clientName: data.client_name,
    agentId: data.agent_id,
    agentName: data.agent_name,
    billable: data.billable ?? true,
    billed: data.billed ?? false,
    reimbursable: data.reimbursable ?? false,
    reimbursed: data.reimbursed ?? false,
  };
}
