/**
 * Billing-related AI tools for HaloPSA.
 * Covers time entries, invoices, projects, and expenses.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { TimeEntry, Invoice, Project, Expense } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;

export function createBillingTools(ctx: HaloContext) {
  return {
    // === TIME ENTRY OPERATIONS ===
    listTimeEntries: tool({
      description: 'List time entries with optional filters.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        ticketId: z.number().optional().describe('Filter by ticket ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        billableOnly: z.boolean().optional().default(false).describe('Only show billable entries'),
        unbilledOnly: z.boolean().optional().default(false).describe('Only show unbilled entries'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, clientId, ticketId, startDate, endDate, billableOnly, unbilledOnly, count }) => {
        const entries = await ctx.timeEntries.listFiltered({
          agentId,
          clientId,
          ticketId,
          startDate,
          endDate,
          billableOnly,
          unbilledOnly,
          count: count || DEFAULT_COUNT,
        });

        return entries.map((e: TimeEntry) => ({
          id: e.id,
          ticketId: e.ticketId,
          durationMinutes: e.durationMinutes,
          note: e.note,
          billable: e.billable,
          agentId: e.agentId,
          agentName: e.agentName,
          date: e.entryDate,
        }));
      },
    }),

    createTimeEntry: tool({
      description: 'Create a time entry for a ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID'),
        durationMinutes: z.number().describe('Duration in minutes'),
        note: z.string().optional().describe('Description of work done'),
        agentId: z.number().optional().describe('Agent ID (defaults to current user)'),
        billable: z.boolean().optional().default(true).describe('Whether this time is billable'),
        activityType: z.string().optional().describe('Type of activity'),
      }),
      execute: async ({ ticketId, durationMinutes, note, agentId, billable, activityType }) => {
        const entry = await ctx.timeEntries.createForTicket(ticketId, {
          durationMinutes,
          note,
          agentId,
          billable,
          activityType,
        });

        return {
          success: true,
          entryId: entry.id,
          durationMinutes: entry.durationMinutes,
          billable: entry.billable,
        };
      },
    }),

    getTimeSummary: tool({
      description: 'Get time tracking summary with totals.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ agentId, clientId, startDate, endDate }) => {
        return ctx.timeEntries.getSummary({ agentId, clientId, startDate, endDate });
      },
    }),

    // === INVOICE OPERATIONS ===
    listInvoices: tool({
      description: 'List invoices with optional filters.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional().describe('Filter by status'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, status, startDate, endDate, count }) => {
        const invoices = await ctx.invoices.listFiltered({
          clientId,
          status,
          startDate,
          endDate,
          count: count || DEFAULT_COUNT,
        });

        return invoices.map((i: Invoice) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          client: i.clientName,
          total: i.totalAmount,
          status: i.status,
          dateDue: i.dateDue,
        }));
      },
    }),

    getInvoice: tool({
      description: 'Get detailed information about an invoice.',
      parameters: z.object({
        invoiceId: z.number().describe('The invoice ID'),
      }),
      execute: async ({ invoiceId }) => {
        const invoice = await ctx.invoices.get(invoiceId);
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          client: invoice.clientName,
          total: invoice.totalAmount,
          balanceDue: invoice.amountDue,
          status: invoice.status,
          dateDue: invoice.dateDue,
          dateIssued: invoice.dateIssued,
          lines: invoice.lines,
        };
      },
    }),

    createInvoice: tool({
      description: 'Create a new invoice for a client.',
      parameters: z.object({
        clientId: z.number().describe('Client ID'),
        dateDue: z.string().optional().describe('Due date (YYYY-MM-DD)'),
        description: z.string().optional().describe('Invoice description/notes'),
        lines: z.array(z.object({
          description: z.string().describe('Line item description'),
          quantity: z.number().describe('Quantity'),
          unitPrice: z.number().describe('Unit price'),
          taxable: z.boolean().optional().describe('Whether the line is taxable'),
        })).optional().describe('Invoice line items'),
      }),
      execute: async ({ clientId, dateDue, description, lines }) => {
        const invoiceData: Record<string, unknown> = {
          client_id: clientId,
        };
        if (dateDue) invoiceData.datedue = dateDue;
        if (description) invoiceData.description = description;
        if (lines) {
          invoiceData.lines = lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitprice: line.unitPrice,
            taxable: line.taxable,
          }));
        }

        const invoices = await ctx.invoices.create([invoiceData]);
        if (invoices && invoices.length > 0) {
          return {
            success: true,
            invoiceId: invoices[0].id,
            invoiceNumber: invoices[0].invoiceNumber,
            total: invoices[0].totalAmount,
            message: `Invoice ${invoices[0].invoiceNumber} created successfully`,
          };
        }
        return { success: false, error: 'Failed to create invoice' };
      },
    }),

    createInvoiceFromTime: tool({
      description: 'Create an invoice from unbilled time entries for a client.',
      parameters: z.object({
        clientId: z.number().describe('Client ID'),
        startDate: z.string().optional().describe('Start date for time entries (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date for time entries (YYYY-MM-DD)'),
        dateDue: z.string().optional().describe('Invoice due date (YYYY-MM-DD)'),
        includeExpenses: z.boolean().optional().default(false).describe('Include unbilled expenses'),
      }),
      execute: async ({ clientId, startDate, endDate, dateDue, includeExpenses }) => {
        // Get unbilled time entries for the client
        const timeEntries = await ctx.timeEntries.listFiltered({
          clientId,
          startDate,
          endDate,
          unbilledOnly: true,
          billableOnly: true,
          count: 1000,
        });

        if (timeEntries.length === 0) {
          return {
            success: false,
            error: 'No unbilled time entries found for this client in the specified date range',
          };
        }

        // Create invoice data
        const invoiceData: Record<string, unknown> = {
          client_id: clientId,
        };
        if (dateDue) invoiceData.datedue = dateDue;

        const invoices = await ctx.invoices.create([invoiceData]);
        if (invoices && invoices.length > 0) {
          return {
            success: true,
            invoiceId: invoices[0].id,
            invoiceNumber: invoices[0].invoiceNumber,
            timeEntriesIncluded: timeEntries.length,
            message: `Invoice ${invoices[0].invoiceNumber} created from ${timeEntries.length} time entries`,
          };
        }
        return { success: false, error: 'Failed to create invoice from time entries' };
      },
    }),

    sendInvoice: tool({
      description: 'Send an invoice to the client.',
      parameters: z.object({
        invoiceId: z.number().describe('The invoice ID to send'),
        emailAddresses: z.array(z.string()).optional().describe('Email addresses to send to'),
      }),
      execute: async ({ invoiceId, emailAddresses }) => {
        const success = await ctx.invoices.send(invoiceId, emailAddresses);
        return {
          success,
          message: success ? 'Invoice sent successfully' : 'Failed to send invoice',
        };
      },
    }),

    markInvoicePaid: tool({
      description: 'Mark an invoice as paid.',
      parameters: z.object({
        invoiceId: z.number().describe('The invoice ID'),
        amount: z.number().optional().describe('Payment amount (defaults to full balance)'),
        paymentDate: z.string().optional().describe('Payment date (YYYY-MM-DD)'),
        paymentMethod: z.string().optional().describe('Payment method'),
      }),
      execute: async ({ invoiceId, amount, paymentDate, paymentMethod }) => {
        const invoice = await ctx.invoices.markPaid(invoiceId, {
          amount,
          paymentDate,
          paymentMethod,
        });

        return {
          success: true,
          invoiceId: invoice.id,
          status: invoice.status,
        };
      },
    }),

    getInvoiceSummary: tool({
      description: 'Get invoice summary with totals by status.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
      }),
      execute: async ({ clientId, startDate, endDate }) => {
        return ctx.invoices.getSummary({ clientId, startDate, endDate });
      },
    }),

    // === PROJECT OPERATIONS ===
    listProjects: tool({
      description: 'List projects with optional filters.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        status: z.enum(['active', 'completed', 'on-hold', 'cancelled']).optional().describe('Filter by status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, status, count }) => {
        let projects;
        if (status === 'active') {
          projects = await ctx.projects.listActive({ clientId, count: count || DEFAULT_COUNT });
        } else {
          projects = await ctx.projects.listFiltered({ clientId, status, count: count || DEFAULT_COUNT });
        }

        return projects.map((p: Project) => ({
          id: p.id,
          name: p.name,
          client: p.clientName,
          status: p.status,
          budgetHours: p.budgetHours,
          usedHours: p.hoursUsed,
        }));
      },
    }),

    getProject: tool({
      description: 'Get detailed information about a project including budget status.',
      parameters: z.object({
        projectId: z.number().describe('The project ID'),
      }),
      execute: async ({ projectId }) => {
        const budget = await ctx.projects.getBudgetStatus(projectId);
        return {
          id: budget.projectId,
          name: budget.projectName,
          client: budget.clientName,
          status: budget.status,
          budgetHours: budget.budgetHours,
          usedHours: budget.usedHours,
          remainingHours: budget.remainingHours,
          budgetAmount: budget.budgetAmount,
          usedAmount: budget.usedAmount,
          percentComplete: budget.percentComplete,
        };
      },
    }),

    createProject: tool({
      description: 'Create a new project.',
      parameters: z.object({
        name: z.string().describe('Project name'),
        clientId: z.number().describe('Client ID'),
        description: z.string().optional().describe('Project description'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        budgetHours: z.number().optional().describe('Budget in hours'),
        budgetAmount: z.number().optional().describe('Budget amount'),
        projectManagerId: z.number().optional().describe('Project manager agent ID'),
        isBillable: z.boolean().optional().default(true).describe('Whether the project is billable'),
      }),
      execute: async ({ name, clientId, description, startDate, endDate, budgetHours, budgetAmount, projectManagerId, isBillable }) => {
        const projectData: Record<string, unknown> = {
          name,
          clientId,
          isBillable,
        };

        if (description) projectData.description = description;
        if (startDate) projectData.startDate = startDate;
        if (endDate) projectData.endDate = endDate;
        if (budgetHours) projectData.budgetHours = budgetHours;
        if (budgetAmount) projectData.budgetAmount = budgetAmount;
        if (projectManagerId) projectData.projectManagerId = projectManagerId;

        const projects = await ctx.projects.create([projectData]);
        if (projects && projects.length > 0) {
          return {
            success: true,
            projectId: projects[0].id,
            name: projects[0].name,
          };
        }
        return { success: false, error: 'Failed to create project' };
      },
    }),

    updateProject: tool({
      description: 'Update an existing project.',
      parameters: z.object({
        projectId: z.number().describe('The project ID'),
        name: z.string().optional().describe('New name'),
        status: z.enum(['active', 'completed', 'on-hold', 'cancelled']).optional().describe('New status'),
        budgetHours: z.number().optional().describe('New budget hours'),
        budgetAmount: z.number().optional().describe('New budget amount'),
      }),
      execute: async ({ projectId, name, status, budgetHours, budgetAmount }) => {
        const updateData: Record<string, unknown> = { id: projectId };
        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (budgetHours !== undefined) updateData.budgetHours = budgetHours;
        if (budgetAmount !== undefined) updateData.budgetAmount = budgetAmount;

        const projects = await ctx.projects.update([updateData]);
        if (projects && projects.length > 0) {
          return {
            success: true,
            projectId: projects[0].id,
            name: projects[0].name,
          };
        }
        return { success: false, error: 'Failed to update project' };
      },
    }),

    // === EXPENSE OPERATIONS ===
    listExpenses: tool({
      description: 'List expenses with optional filters.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        projectId: z.number().optional().describe('Filter by project ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        unbilledOnly: z.boolean().optional().default(false).describe('Only show unbilled expenses'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, clientId, projectId, startDate, endDate, unbilledOnly, count }) => {
        const expenses = await ctx.expenses.listFiltered({
          agentId,
          clientId,
          projectId,
          startDate,
          endDate,
          unbilledOnly,
          count: count || DEFAULT_COUNT,
        });

        return expenses.map((e: Expense) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          date: e.expenseDate,
          billable: e.billable,
          category: e.category,
        }));
      },
    }),

    createExpense: tool({
      description: 'Create a new expense.',
      parameters: z.object({
        amount: z.number().describe('Expense amount'),
        description: z.string().describe('Expense description'),
        expenseDate: z.string().describe('Expense date (YYYY-MM-DD)'),
        category: z.string().optional().describe('Expense category'),
        ticketId: z.number().optional().describe('Associated ticket ID'),
        projectId: z.number().optional().describe('Associated project ID'),
        clientId: z.number().optional().describe('Client ID'),
        billable: z.boolean().optional().default(true).describe('Whether the expense is billable'),
        reimbursable: z.boolean().optional().default(true).describe('Whether the expense is reimbursable'),
      }),
      execute: async ({ amount, description, expenseDate, category, ticketId, projectId, clientId, billable, reimbursable }) => {
        const expenseData: Record<string, unknown> = {
          amount,
          description,
          expenseDate,
          billable,
          reimbursable,
        };

        if (category) expenseData.category = category;
        if (ticketId) expenseData.ticketId = ticketId;
        if (projectId) expenseData.projectId = projectId;
        if (clientId) expenseData.clientId = clientId;

        const expenses = await ctx.expenses.create([expenseData]);
        if (expenses && expenses.length > 0) {
          return {
            success: true,
            expenseId: expenses[0].id,
            amount: expenses[0].amount,
          };
        }
        return { success: false, error: 'Failed to create expense' };
      },
    }),
  };
}
