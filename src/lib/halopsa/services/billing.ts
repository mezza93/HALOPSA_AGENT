/**
 * Time tracking and billing services for HaloPSA API operations.
 *
 * IMPORTANT: HaloPSA API uses /TimesheetEvent for time entries, not /TimeEntry.
 * The service is named TimeEntryService for clarity but uses the correct endpoint.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  TimeEntry,
  TimeEntryApiResponse,
  Invoice,
  InvoiceApiResponse,
  Project,
  ProjectApiResponse,
  TimeSummary,
  InvoiceSummary,
  InvoiceStatus,
  ProjectStatus,
  transformTimeEntry,
  transformInvoice,
  transformProject,
} from '../types/billing';
import { ListParams } from '../types/common';

/**
 * Service for time entry operations.
 * Uses the /TimesheetEvent endpoint in HaloPSA API.
 */
export class TimeEntryService extends BaseService<TimeEntry, TimeEntryApiResponse> {
  protected endpoint = '/TimesheetEvent';

  protected transform(data: TimeEntryApiResponse): TimeEntry {
    return transformTimeEntry(data);
  }

  /**
   * List time entries with filters.
   */
  async listFiltered(options: {
    agentId?: number;
    clientId?: number;
    ticketId?: number;
    startDate?: Date | string;
    endDate?: Date | string;
    billableOnly?: boolean;
    unbilledOnly?: boolean;
    count?: number;
  } = {}): Promise<TimeEntry[]> {
    const {
      agentId,
      clientId,
      ticketId,
      startDate,
      endDate,
      billableOnly,
      unbilledOnly,
      count = 100,
    } = options;

    const params: ListParams = { count };
    if (agentId) params.agent_id = agentId;
    if (clientId) params.client_id = clientId;
    if (ticketId) params.ticket_id = ticketId;
    if (startDate) params.startdate = startDate instanceof Date ? startDate.toISOString() : startDate;
    if (endDate) params.enddate = endDate instanceof Date ? endDate.toISOString() : endDate;
    if (billableOnly) params.billable_only = true;
    if (unbilledOnly) params.unbilled_only = true;

    return this.list(params);
  }

  /**
   * Create a time entry for a ticket.
   */
  async createForTicket(options: {
    ticketId: number;
    durationMinutes: number;
    note?: string;
    agentId?: number;
    billable?: boolean;
    activityType?: string;
  }): Promise<TimeEntry> {
    const {
      ticketId,
      durationMinutes,
      note,
      agentId,
      billable = true,
      activityType,
    } = options;

    const data: Record<string, unknown> = {
      ticket_id: ticketId,
      timetaken: durationMinutes,
      billable,
    };

    if (note) data.note = note;
    if (agentId) data.agent_id = agentId;
    if (activityType) data.activity_type = activityType;

    const results = await this.create([data as Partial<TimeEntry>]);
    return results[0];
  }

  /**
   * Get time summary statistics.
   */
  async getSummary(options: {
    agentId?: number;
    clientId?: number;
    startDate?: Date | string;
    endDate?: Date | string;
  } = {}): Promise<TimeSummary> {
    const entries = await this.listFiltered({ ...options, count: 1000 });

    const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const billableMinutes = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.durationMinutes, 0);
    const billedMinutes = entries.filter((e) => e.billed).reduce((sum, e) => sum + e.durationMinutes, 0);

    const byAgent: Record<string, number> = {};
    const byClient: Record<string, number> = {};

    for (const entry of entries) {
      const agentName = entry.agentName || 'Unknown';
      const clientName = entry.clientName || 'Unknown';
      byAgent[agentName] = (byAgent[agentName] || 0) + entry.durationMinutes;
      byClient[clientName] = (byClient[clientName] || 0) + entry.durationMinutes;
    }

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableMinutes,
      billableHours: Math.round((billableMinutes / 60) * 100) / 100,
      nonBillableMinutes: totalMinutes - billableMinutes,
      billedMinutes,
      unBilledMinutes: billableMinutes - billedMinutes,
      byAgent,
      byClient,
    };
  }
}

/**
 * Service for invoice operations.
 */
export class InvoiceService extends BaseService<Invoice, InvoiceApiResponse> {
  protected endpoint = '/Invoice';

  protected transform(data: InvoiceApiResponse): Invoice {
    return transformInvoice(data);
  }

  /**
   * List invoices with filters.
   */
  async listFiltered(options: {
    clientId?: number;
    status?: InvoiceStatus;
    startDate?: Date | string;
    endDate?: Date | string;
    count?: number;
  } = {}): Promise<Invoice[]> {
    const { clientId, status, startDate, endDate, count = 50 } = options;

    const params: ListParams = { count };
    if (clientId) params.client_id = clientId;
    if (status) params.status = status;
    if (startDate) params.startdate = startDate instanceof Date ? startDate.toISOString() : startDate;
    if (endDate) params.enddate = endDate instanceof Date ? endDate.toISOString() : endDate;

    return this.list(params);
  }

  /**
   * Send an invoice via email.
   */
  async send(invoiceId: number, emailAddresses?: string[]): Promise<void> {
    await this.client.post(`${this.endpoint}/${invoiceId}/send`, {
      email_addresses: emailAddresses,
    });
  }

  /**
   * Mark an invoice as paid.
   */
  async markPaid(invoiceId: number, options: {
    amount?: number;
    paymentDate?: Date | string;
    paymentMethod?: string;
  } = {}): Promise<Invoice> {
    const { amount, paymentDate, paymentMethod } = options;

    const data: Record<string, unknown> = { status: 'paid' };
    if (amount) data.amount_paid = amount;
    if (paymentDate) data.date_paid = paymentDate instanceof Date ? paymentDate.toISOString() : paymentDate;
    if (paymentMethod) data.payment_method = paymentMethod;

    const results = await this.update([{ id: invoiceId, ...data } as Partial<Invoice>]);
    return results[0];
  }

  /**
   * Get invoice summary statistics.
   */
  async getSummary(options: {
    clientId?: number;
    startDate?: Date | string;
    endDate?: Date | string;
  } = {}): Promise<InvoiceSummary> {
    const invoices = await this.listFiltered({ ...options, count: 1000 });

    const byStatus: Record<InvoiceStatus, number> = {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      void: 0,
    };

    let totalAmount = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;

    for (const invoice of invoices) {
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
      totalAmount += invoice.totalAmount;
      paidAmount += invoice.amountPaid;
      outstandingAmount += invoice.amountDue;

      if (invoice.status === 'overdue') {
        overdueAmount += invoice.amountDue;
      }
    }

    return {
      totalCount: invoices.length,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      byStatus,
    };
  }
}

/**
 * Service for project operations.
 */
export class ProjectService extends BaseService<Project, ProjectApiResponse> {
  protected endpoint = '/Project';

  protected transform(data: ProjectApiResponse): Project {
    return transformProject(data);
  }

  /**
   * List projects with filters.
   */
  async listFiltered(options: {
    clientId?: number;
    status?: ProjectStatus;
    count?: number;
  } = {}): Promise<Project[]> {
    const { clientId, status, count = 50 } = options;

    const params: ListParams = { count };
    if (clientId) params.client_id = clientId;
    if (status) params.status = status;

    return this.list(params);
  }

  /**
   * List active projects.
   */
  async listActive(count = 50): Promise<Project[]> {
    return this.listFiltered({ status: 'active', count });
  }

  /**
   * Get project budget status.
   */
  async getBudgetStatus(projectId: number): Promise<{
    project: Project;
    hoursRemaining: number;
    amountRemaining: number;
    percentHoursUsed: number;
    percentAmountUsed: number;
  }> {
    const project = await this.get(projectId);

    const hoursRemaining = (project.budgetHours || 0) - (project.hoursUsed || 0);
    const amountRemaining = (project.budgetAmount || 0) - (project.amountUsed || 0);
    const percentHoursUsed = project.budgetHours
      ? ((project.hoursUsed || 0) / project.budgetHours) * 100
      : 0;
    const percentAmountUsed = project.budgetAmount
      ? ((project.amountUsed || 0) / project.budgetAmount) * 100
      : 0;

    return {
      project,
      hoursRemaining,
      amountRemaining,
      percentHoursUsed: Math.round(percentHoursUsed * 100) / 100,
      percentAmountUsed: Math.round(percentAmountUsed * 100) / 100,
    };
  }
}

/**
 * REMOVED: ExpenseService
 *
 * The HaloPSA API does not have a dedicated /Expense endpoint.
 * Expenses in HaloPSA are typically tracked via:
 * - Time entries with expense flags
 * - Project line items
 * - Invoice line items
 *
 * If you need expense tracking, consider using:
 * - TimeEntryService with appropriate activity types
 * - ProjectService for project-related costs
 * - InvoiceService for billing expenses to clients
 */
