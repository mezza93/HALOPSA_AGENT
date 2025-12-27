/**
 * Configuration-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { CustomField, TicketStatus, TicketType, Priority, Category } from '@/lib/halopsa/types';
import type { Workflow, EmailTemplate, TicketTemplate } from '@/lib/halopsa/services/configuration';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createConfigurationTools(ctx: HaloContext) {
  return {
    // === Custom Fields ===
    listCustomFields: tool({
      description: 'List custom fields defined in HaloPSA.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const fields = await ctx.configuration.listCustomFields({ count: count || DEFAULT_COUNT });
          return {
            success: true,
            data: fields.map((f: CustomField) => ({
              id: f.id,
              name: f.name,
              label: f.label,
              type: f.type,
              table: f.table,
              isRequired: f.isRequired,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCustomFields');
        }
      },
    }),

    getCustomField: tool({
      description: 'Get details about a specific custom field.',
      parameters: z.object({
        fieldId: z.number().describe('The custom field ID'),
      }),
      execute: async ({ fieldId }) => {
        try {
          const field = await ctx.configuration.getCustomField(fieldId);
          return { success: true, data: field };
        } catch (error) {
          return formatError(error, 'getCustomField');
        }
      },
    }),

    // === Ticket Statuses ===
    listTicketStatuses: tool({
      description: 'List all ticket statuses available in HaloPSA.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const statuses = await ctx.configuration.listTicketStatuses();
          return {
            success: true,
            data: statuses.map((s: TicketStatus) => ({
              id: s.id,
              name: s.name,
              isOpen: s.isOpen,
              isClosed: s.isClosed,
              isDefault: s.isDefault,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTicketStatuses');
        }
      },
    }),

    // === Ticket Types ===
    listTicketTypes: tool({
      description: 'List all ticket types (e.g., Incident, Service Request).',
      parameters: z.object({}),
      execute: async () => {
        try {
          const types = await ctx.configuration.listTicketTypes();
          return {
            success: true,
            data: types.map((t: TicketType) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              isDefault: t.isDefault,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTicketTypes');
        }
      },
    }),

    // === Priorities ===
    listPriorities: tool({
      description: 'List all priority levels.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const priorities = await ctx.configuration.listPriorities();
          return {
            success: true,
            data: priorities.map((p: Priority) => ({
              id: p.id,
              name: p.name,
              isDefault: p.isDefault,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPriorities');
        }
      },
    }),

    // === Categories ===
    listCategories: tool({
      description: 'List ticket categories.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const categories = await ctx.configuration.listCategories({ count: count || DEFAULT_COUNT });
          return {
            success: true,
            data: categories.map((c: Category) => ({
              id: c.id,
              name: c.name,
              level: c.level,
              parentId: c.parentId,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCategories');
        }
      },
    }),

    // === Workflows ===
    listWorkflows: tool({
      description: 'List automation workflows.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const workflows = await ctx.configuration.listWorkflows({ count: count || DEFAULT_COUNT });
          return {
            success: true,
            data: workflows.map((w: Workflow) => ({
              id: w.id,
              name: w.name,
              description: w.description,
              isActive: w.isActive,
              triggerType: w.triggerType,
            })),
          };
        } catch (error) {
          return formatError(error, 'listWorkflows');
        }
      },
    }),

    getWorkflow: tool({
      description: 'Get details about a specific workflow.',
      parameters: z.object({
        workflowId: z.number().describe('The workflow ID'),
      }),
      execute: async ({ workflowId }) => {
        try {
          const workflow = await ctx.configuration.getWorkflow(workflowId);
          return { success: true, data: workflow };
        } catch (error) {
          return formatError(error, 'getWorkflow');
        }
      },
    }),

    toggleWorkflow: tool({
      description: 'Enable or disable a workflow.',
      parameters: z.object({
        workflowId: z.number().describe('The workflow ID'),
        isActive: z.boolean().describe('Whether the workflow should be active'),
      }),
      execute: async ({ workflowId, isActive }) => {
        try {
          const result = await ctx.configuration.toggleWorkflow(workflowId, isActive);
          return {
            success: true,
            workflowId,
            isActive,
            message: `Workflow ${isActive ? 'enabled' : 'disabled'} successfully`,
          };
        } catch (error) {
          return formatError(error, 'toggleWorkflow');
        }
      },
    }),

    // === Email Templates ===
    listEmailTemplates: tool({
      description: 'List email templates.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const templates = await ctx.configuration.listEmailTemplates({ count: count || DEFAULT_COUNT });
          return {
            success: true,
            data: templates.map((t: EmailTemplate) => ({
              id: t.id,
              name: t.name,
              subject: t.subject,
              isActive: t.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listEmailTemplates');
        }
      },
    }),

    getEmailTemplate: tool({
      description: 'Get details of an email template including its body.',
      parameters: z.object({
        templateId: z.number().describe('The email template ID'),
      }),
      execute: async ({ templateId }) => {
        try {
          const template = await ctx.configuration.getEmailTemplate(templateId);
          return { success: true, data: template };
        } catch (error) {
          return formatError(error, 'getEmailTemplate');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'createEmailTemplate');
        }
      },
    }),

    // === Ticket Templates ===
    listTicketTemplates: tool({
      description: 'List ticket templates for quick ticket creation.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const templates = await ctx.configuration.listTicketTemplates({ count: count || DEFAULT_COUNT });
          return {
            success: true,
            data: templates.map((t: TicketTemplate) => ({
              id: t.id,
              name: t.name,
              summary: t.summary,
              ticketTypeId: t.ticketTypeId,
              priorityId: t.priorityId,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTicketTemplates');
        }
      },
    }),

    getTicketTemplate: tool({
      description: 'Get details of a ticket template.',
      parameters: z.object({
        templateId: z.number().describe('The ticket template ID'),
      }),
      execute: async ({ templateId }) => {
        try {
          const template = await ctx.configuration.getTicketTemplate(templateId);
          return { success: true, data: template };
        } catch (error) {
          return formatError(error, 'getTicketTemplate');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'createTicketFromTemplate');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'createTicketTemplate');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'createCustomField');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'createWorkflow');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'updateEmailTemplate');
        }
      },
    }),

    // === Escalation Rules ===
    listEscalationRules: tool({
      description: 'List escalation rules.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        try {
          const rules = await ctx.configuration.listEscalationRules({ count: count || DEFAULT_COUNT });
          return { success: true, data: rules };
        } catch (error) {
          return formatError(error, 'listEscalationRules');
        }
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
        try {
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
        } catch (error) {
          return formatError(error, 'createEscalationRule');
        }
      },
    }),

    // === System Settings ===
    listSystemSettings: tool({
      description: 'List system settings.',
      parameters: z.object({
        category: z.string().optional().describe('Filter by category'),
      }),
      execute: async ({ category }) => {
        try {
          const settings = await ctx.configuration.listSystemSettings({ category });
          return { success: true, data: settings };
        } catch (error) {
          return formatError(error, 'listSystemSettings');
        }
      },
    }),

    getSystemSetting: tool({
      description: 'Get a specific system setting value.',
      parameters: z.object({
        key: z.string().describe('Setting key'),
      }),
      execute: async ({ key }) => {
        try {
          const setting = await ctx.configuration.getSystemSetting(key);
          return { success: true, data: setting };
        } catch (error) {
          return formatError(error, 'getSystemSetting');
        }
      },
    }),

    updateSystemSetting: tool({
      description: 'Update a system setting value.',
      parameters: z.object({
        key: z.string().describe('Setting key'),
        value: z.string().describe('New setting value'),
      }),
      execute: async ({ key, value }) => {
        try {
          await ctx.configuration.updateSystemSetting(key, value);
          return {
            success: true,
            key,
            message: `System setting '${key}' updated successfully`,
          };
        } catch (error) {
          return formatError(error, 'updateSystemSetting');
        }
      },
    }),

    // === API & Lookup ===
    getApiInfo: tool({
      description: 'Get HaloPSA API information and version.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const info = await ctx.configuration.getApiInfo();
          return { success: true, data: info };
        } catch (error) {
          return formatError(error, 'getApiInfo');
        }
      },
    }),

    getLookupValues: tool({
      description: 'Get lookup values for a specific field or table.',
      parameters: z.object({
        lookupType: z.enum(['status', 'priority', 'category', 'type', 'team', 'agent']).describe('Type of lookup values'),
        parentId: z.number().optional().describe('Parent ID for hierarchical lookups'),
      }),
      execute: async ({ lookupType, parentId }) => {
        try {
          const values = await ctx.configuration.getLookupValues(lookupType, { parentId });
          return { success: true, data: values };
        } catch (error) {
          return formatError(error, 'getLookupValues');
        }
      },
    }),

    getFieldInfo: tool({
      description: 'Get information about a specific field including its type, options, and constraints.',
      parameters: z.object({
        tableName: z.enum(['ticket', 'client', 'asset', 'user', 'contract']).describe('Table name'),
        fieldName: z.string().describe('Field name'),
      }),
      execute: async ({ tableName, fieldName }) => {
        try {
          const fieldInfo = await ctx.configuration.getFieldInfo(tableName, fieldName);
          return { success: true, data: fieldInfo };
        } catch (error) {
          return formatError(error, 'getFieldInfo');
        }
      },
    }),

    getSlaPolicies: tool({
      description: 'Get SLA policies and their configurations.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        ticketTypeId: z.number().optional().describe('Filter by ticket type ID'),
      }),
      execute: async ({ clientId, ticketTypeId }) => {
        try {
          const policies = await ctx.configuration.getSlaPolicies({ clientId, ticketTypeId });
          return { success: true, data: policies };
        } catch (error) {
          return formatError(error, 'getSlaPolicies');
        }
      },
    }),
  };
}
