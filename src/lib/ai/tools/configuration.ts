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

    // === Custom Fields ===
    createCustomField: tool({
      description: 'Create a new custom field.',
      parameters: z.object({
        name: z.string().describe('Field name (internal)'),
        label: z.string().describe('Field label (displayed to users)'),
        type: z.enum(['text', 'number', 'date', 'dropdown', 'checkbox', 'textarea']).describe('Field type'),
        table: z.enum(['ticket', 'client', 'asset', 'user', 'contract']).describe('Table to add field to'),
        isRequired: z.boolean().optional().default(false).describe('Whether field is required'),
        options: z.array(z.string()).optional().describe('Options for dropdown fields'),
      }),
      execute: async ({ name, label, type, table, isRequired, options }) => {
        const fieldData: Record<string, unknown> = {
          name,
          label,
          type,
          table,
          isRequired,
        };
        if (options) fieldData.options = options;

        const result = await ctx.configuration.createCustomField(fieldData);
        return {
          success: true,
          fieldId: result[0]?.id,
          name,
          message: `Custom field '${label}' created successfully`,
        };
      },
    }),

    // === Workflows ===
    createWorkflow: tool({
      description: 'Create a new automation workflow.',
      parameters: z.object({
        name: z.string().describe('Workflow name'),
        description: z.string().optional().describe('Workflow description'),
        triggerType: z.enum(['ticket_created', 'ticket_updated', 'ticket_closed', 'sla_breach', 'scheduled']).describe('When workflow triggers'),
        isActive: z.boolean().optional().default(true).describe('Whether workflow is active'),
        conditions: z.string().optional().describe('Workflow conditions (JSON)'),
        actions: z.string().optional().describe('Workflow actions (JSON)'),
      }),
      execute: async ({ name, description, triggerType, isActive, conditions, actions }) => {
        const workflowData: Record<string, unknown> = {
          name,
          triggerType,
          isActive,
        };
        if (description) workflowData.description = description;
        if (conditions) workflowData.conditions = JSON.parse(conditions);
        if (actions) workflowData.actions = JSON.parse(actions);

        const result = await ctx.configuration.createWorkflow(workflowData);
        return {
          success: true,
          workflowId: result[0]?.id,
          name,
          message: `Workflow '${name}' created successfully`,
        };
      },
    }),

    // === Email Templates ===
    updateEmailTemplate: tool({
      description: 'Update an existing email template.',
      parameters: z.object({
        templateId: z.number().describe('The email template ID'),
        name: z.string().optional().describe('New template name'),
        subject: z.string().optional().describe('New email subject'),
        body: z.string().optional().describe('New email body (HTML)'),
        isActive: z.boolean().optional().describe('Whether template is active'),
      }),
      execute: async ({ templateId, name, subject, body, isActive }) => {
        const updateData: Record<string, unknown> = { id: templateId };
        if (name !== undefined) updateData.name = name;
        if (subject !== undefined) updateData.subject = subject;
        if (body !== undefined) updateData.body = body;
        if (isActive !== undefined) updateData.isActive = isActive;

        const result = await ctx.configuration.updateEmailTemplate(updateData);
        return {
          success: true,
          templateId,
          message: `Email template updated successfully`,
        };
      },
    }),

    // === Escalation Rules ===
    listEscalationRules: tool({
      description: 'List escalation rules.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const rules = await ctx.configuration.listEscalationRules({ count: count || DEFAULT_COUNT });
        return rules;
      },
    }),

    createEscalationRule: tool({
      description: 'Create a new escalation rule.',
      parameters: z.object({
        name: z.string().describe('Rule name'),
        description: z.string().optional().describe('Rule description'),
        triggerMinutes: z.number().describe('Minutes before escalation triggers'),
        escalateTo: z.number().describe('Agent or team ID to escalate to'),
        escalateToType: z.enum(['agent', 'team']).describe('Escalate to agent or team'),
        isActive: z.boolean().optional().default(true).describe('Whether rule is active'),
      }),
      execute: async ({ name, description, triggerMinutes, escalateTo, escalateToType, isActive }) => {
        const ruleData: Record<string, unknown> = {
          name,
          triggerMinutes,
          escalateTo,
          escalateToType,
          isActive,
        };
        if (description) ruleData.description = description;

        const result = await ctx.configuration.createEscalationRule(ruleData);
        return {
          success: true,
          ruleId: result[0]?.id,
          name,
          message: `Escalation rule '${name}' created successfully`,
        };
      },
    }),

    // === System Settings ===
    listSystemSettings: tool({
      description: 'List system settings.',
      parameters: z.object({
        category: z.string().optional().describe('Filter by category'),
      }),
      execute: async ({ category }) => {
        const settings = await ctx.configuration.listSystemSettings({ category });
        return settings;
      },
    }),

    getSystemSetting: tool({
      description: 'Get a specific system setting value.',
      parameters: z.object({
        key: z.string().describe('Setting key'),
      }),
      execute: async ({ key }) => {
        return ctx.configuration.getSystemSetting(key);
      },
    }),

    updateSystemSetting: tool({
      description: 'Update a system setting value.',
      parameters: z.object({
        key: z.string().describe('Setting key'),
        value: z.string().describe('New setting value'),
      }),
      execute: async ({ key, value }) => {
        await ctx.configuration.updateSystemSetting(key, value);
        return {
          success: true,
          key,
          message: `System setting '${key}' updated successfully`,
        };
      },
    }),

    // === API & Lookup ===
    getApiInfo: tool({
      description: 'Get HaloPSA API information and version.',
      parameters: z.object({}),
      execute: async () => {
        return ctx.configuration.getApiInfo();
      },
    }),

    getLookupValues: tool({
      description: 'Get lookup values for a specific field or table.',
      parameters: z.object({
        lookupType: z.enum(['status', 'priority', 'category', 'type', 'team', 'agent']).describe('Type of lookup values'),
        parentId: z.number().optional().describe('Parent ID for hierarchical lookups'),
      }),
      execute: async ({ lookupType, parentId }) => {
        return ctx.configuration.getLookupValues(lookupType, { parentId });
      },
    }),

    getFieldInfo: tool({
      description: 'Get information about a specific field including its type, options, and constraints.',
      parameters: z.object({
        tableName: z.enum(['ticket', 'client', 'asset', 'user', 'contract']).describe('Table name'),
        fieldName: z.string().describe('Field name'),
      }),
      execute: async ({ tableName, fieldName }) => {
        return ctx.configuration.getFieldInfo(tableName, fieldName);
      },
    }),

    getSlaPolicies: tool({
      description: 'Get SLA policies and their configurations.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        ticketTypeId: z.number().optional().describe('Filter by ticket type ID'),
      }),
      execute: async ({ clientId, ticketTypeId }) => {
        return ctx.configuration.getSlaPolicies({ clientId, ticketTypeId });
      },
    }),
  };
}
