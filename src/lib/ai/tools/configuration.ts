/**
 * Configuration-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { CustomField, TicketStatus, TicketType, Priority, Category } from '@/lib/halopsa/types';
import type { Workflow, EmailTemplate, TicketTemplate } from '@/lib/halopsa/services/configuration';

const DEFAULT_COUNT = 50;

export function createConfigurationTools(ctx: HaloContext) {
  return {
    // === Custom Fields ===
    listCustomFields: tool({
      description: 'List custom fields defined in HaloPSA.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const fields = await ctx.configuration.listCustomFields({ count: count || DEFAULT_COUNT });
        return fields.map((f: CustomField) => ({
          id: f.id,
          name: f.name,
          label: f.label,
          type: f.type,
          table: f.table,
          isRequired: f.isRequired,
        }));
      },
    }),

    getCustomField: tool({
      description: 'Get details about a specific custom field.',
      parameters: z.object({
        fieldId: z.number().describe('The custom field ID'),
      }),
      execute: async ({ fieldId }) => {
        return ctx.configuration.getCustomField(fieldId);
      },
    }),

    // === Ticket Statuses ===
    listTicketStatuses: tool({
      description: 'List all ticket statuses available in HaloPSA.',
      parameters: z.object({}),
      execute: async () => {
        const statuses = await ctx.configuration.listTicketStatuses();
        return statuses.map((s: TicketStatus) => ({
          id: s.id,
          name: s.name,
          isOpen: s.isOpen,
          isClosed: s.isClosed,
          isDefault: s.isDefault,
        }));
      },
    }),

    // === Ticket Types ===
    listTicketTypes: tool({
      description: 'List all ticket types (e.g., Incident, Service Request).',
      parameters: z.object({}),
      execute: async () => {
        const types = await ctx.configuration.listTicketTypes();
        return types.map((t: TicketType) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          isDefault: t.isDefault,
        }));
      },
    }),

    // === Priorities ===
    listPriorities: tool({
      description: 'List all priority levels.',
      parameters: z.object({}),
      execute: async () => {
        const priorities = await ctx.configuration.listPriorities();
        return priorities.map((p: Priority) => ({
          id: p.id,
          name: p.name,
          isDefault: p.isDefault,
        }));
      },
    }),

    // === Categories ===
    listCategories: tool({
      description: 'List ticket categories.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const categories = await ctx.configuration.listCategories({ count: count || DEFAULT_COUNT });
        return categories.map((c: Category) => ({
          id: c.id,
          name: c.name,
          level: c.level,
          parentId: c.parentId,
        }));
      },
    }),

    // === Workflows ===
    listWorkflows: tool({
      description: 'List automation workflows.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const workflows = await ctx.configuration.listWorkflows({ count: count || DEFAULT_COUNT });
        return workflows.map((w: Workflow) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          isActive: w.isActive,
          triggerType: w.triggerType,
        }));
      },
    }),

    getWorkflow: tool({
      description: 'Get details about a specific workflow.',
      parameters: z.object({
        workflowId: z.number().describe('The workflow ID'),
      }),
      execute: async ({ workflowId }) => {
        return ctx.configuration.getWorkflow(workflowId);
      },
    }),

    toggleWorkflow: tool({
      description: 'Enable or disable a workflow.',
      parameters: z.object({
        workflowId: z.number().describe('The workflow ID'),
        isActive: z.boolean().describe('Whether the workflow should be active'),
      }),
      execute: async ({ workflowId, isActive }) => {
        const result = await ctx.configuration.toggleWorkflow(workflowId, isActive);
        return {
          success: true,
          workflowId,
          isActive,
          message: `Workflow ${isActive ? 'enabled' : 'disabled'} successfully`,
        };
      },
    }),

    // === Email Templates ===
    listEmailTemplates: tool({
      description: 'List email templates.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const templates = await ctx.configuration.listEmailTemplates({ count: count || DEFAULT_COUNT });
        return templates.map((t: EmailTemplate) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          isActive: t.isActive,
        }));
      },
    }),

    getEmailTemplate: tool({
      description: 'Get details of an email template including its body.',
      parameters: z.object({
        templateId: z.number().describe('The email template ID'),
      }),
      execute: async ({ templateId }) => {
        return ctx.configuration.getEmailTemplate(templateId);
      },
    }),

    createEmailTemplate: tool({
      description: 'Create a new email template.',
      parameters: z.object({
        name: z.string().describe('Template name'),
        subject: z.string().describe('Email subject'),
        body: z.string().describe('Email body (HTML)'),
        isActive: z.boolean().optional().default(true).describe('Whether template is active'),
      }),
      execute: async ({ name, subject, body, isActive }) => {
        const result = await ctx.configuration.createEmailTemplate({
          name,
          subject,
          body,
          isActive: isActive !== false,
        });
        return {
          success: true,
          templateId: result[0]?.id,
          name,
          message: `Email template '${name}' created successfully`,
        };
      },
    }),

    // === Ticket Templates ===
    listTicketTemplates: tool({
      description: 'List ticket templates for quick ticket creation.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const templates = await ctx.configuration.listTicketTemplates({ count: count || DEFAULT_COUNT });
        return templates.map((t: TicketTemplate) => ({
          id: t.id,
          name: t.name,
          summary: t.summary,
          ticketTypeId: t.ticketTypeId,
          priorityId: t.priorityId,
        }));
      },
    }),

    getTicketTemplate: tool({
      description: 'Get details of a ticket template.',
      parameters: z.object({
        templateId: z.number().describe('The ticket template ID'),
      }),
      execute: async ({ templateId }) => {
        return ctx.configuration.getTicketTemplate(templateId);
      },
    }),

    createTicketFromTemplate: tool({
      description: 'Create a new ticket from a template.',
      parameters: z.object({
        templateId: z.number().describe('The ticket template ID to use'),
        clientId: z.number().describe('Client ID for the ticket'),
        userId: z.number().optional().describe('User/contact ID'),
        summary: z.string().optional().describe('Override the template summary'),
        details: z.string().optional().describe('Override or append to template details'),
      }),
      execute: async ({ templateId, clientId, userId, summary, details }) => {
        // Get template
        const template = await ctx.configuration.getTicketTemplate(templateId);

        // Create ticket using template values
        const ticketData: Record<string, unknown> = {
          summary: summary || template.summary,
          details: details || template.details,
          clientId,
          tickettypeId: template.ticketTypeId,
          priorityId: template.priorityId,
          categoryId: template.categoryId,
        };

        if (userId) ticketData.userId = userId;

        const tickets = await ctx.tickets.create([ticketData]);
        if (tickets && tickets.length > 0) {
          return {
            success: true,
            ticketId: tickets[0].id,
            summary: tickets[0].summary,
            message: `Ticket created from template '${template.name}'`,
          };
        }
        return { success: false, error: 'Failed to create ticket from template' };
      },
    }),

    createTicketTemplate: tool({
      description: 'Create a new ticket template.',
      parameters: z.object({
        name: z.string().describe('Template name'),
        summary: z.string().describe('Default ticket summary'),
        details: z.string().optional().describe('Default ticket details'),
        ticketTypeId: z.number().optional().describe('Default ticket type ID'),
        priorityId: z.number().optional().describe('Default priority ID'),
        categoryId: z.number().optional().describe('Default category ID'),
      }),
      execute: async ({ name, summary, details, ticketTypeId, priorityId, categoryId }) => {
        const templateData: Record<string, unknown> = { name, summary };
        if (details) templateData.details = details;
        if (ticketTypeId) templateData.ticketTypeId = ticketTypeId;
        if (priorityId) templateData.priorityId = priorityId;
        if (categoryId) templateData.categoryId = categoryId;

        const result = await ctx.configuration.createTicketTemplate(templateData);
        return {
          success: true,
          templateId: result[0]?.id,
          name,
          message: `Ticket template '${name}' created successfully`,
        };
      },
    }),
  };
}
