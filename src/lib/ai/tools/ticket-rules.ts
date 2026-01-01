/**
 * Ticket Rules AI tools for HaloPSA.
 * Phase 4: Productivity & Automation
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { TicketRule, RuleCondition, RuleAction, RuleExecutionLog, RuleTestResult } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

const ruleOperatorSchema = z.enum([
  'equals', 'not_equals', 'contains', 'not_contains', 'starts_with',
  'ends_with', 'greater_than', 'less_than', 'greater_or_equal',
  'less_or_equal', 'is_empty', 'is_not_empty', 'matches_regex',
  'in_list', 'not_in_list',
]);

const ruleTriggerEventSchema = z.enum([
  'ticket_created', 'ticket_updated', 'ticket_status_changed',
  'ticket_assigned', 'ticket_escalated', 'ticket_closed',
  'ticket_reopened', 'sla_breach', 'sla_warning', 'time_trigger',
  'email_received', 'note_added', 'attachment_added',
  'approval_received', 'custom_event',
]);

const ruleActionTypeSchema = z.enum([
  'set_field', 'send_email', 'send_sms', 'create_ticket', 'update_ticket',
  'close_ticket', 'assign_agent', 'assign_team', 'add_note', 'add_tag',
  'remove_tag', 'run_workflow', 'trigger_webhook', 'send_notification',
  'escalate', 'set_sla', 'set_priority', 'set_status', 'set_category',
]);

export function createTicketRuleTools(ctx: HaloContext) {
  return {
    // === TICKET RULE OPERATIONS ===
    listTicketRules: tool({
      description: 'List ticket automation rules with optional filters.',
      parameters: z.object({
        search: z.string().optional().describe('Search in rule name/description'),
        triggerEvent: ruleTriggerEventSchema.optional().describe('Filter by trigger event'),
        isEnabled: z.boolean().optional().describe('Filter by enabled status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ search, triggerEvent, isEnabled, count }) => {
        try {
          const rules = await ctx.ticketRules.list({
            search,
            triggerEvent,
            isEnabled,
            pageSize: count,
          });

          return {
            success: true,
            count: rules.length,
            data: rules.map((r: TicketRule) => ({
              id: r.id,
              name: r.name,
              trigger: r.triggerEvent,
              isEnabled: r.isEnabled,
              priority: r.priority,
              conditionCount: r.conditions?.length || 0,
              actionCount: r.actions?.length || 0,
              lastTriggered: r.lastTriggeredAt,
              triggerCount: r.triggerCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTicketRules');
        }
      },
    }),

    getTicketRule: tool({
      description: 'Get a specific ticket rule with conditions and actions.',
      parameters: z.object({
        ruleId: z.number().describe('The ticket rule ID'),
      }),
      execute: async ({ ruleId }) => {
        try {
          const rule = await ctx.ticketRules.get(ruleId);
          return {
            success: true,
            id: rule.id,
            name: rule.name,
            description: rule.description,
            triggerEvent: rule.triggerEvent,
            isEnabled: rule.isEnabled,
            priority: rule.priority,
            matchAll: rule.matchAll,
            stopProcessing: rule.stopProcessing,
            conditions: rule.conditions?.map((c: RuleCondition) => ({
              field: c.field,
              operator: c.operator,
              value: c.value,
              logicalOperator: c.logicalOperator,
            })),
            actions: rule.actions?.map((a: RuleAction) => ({
              type: a.actionType,
              targetField: a.targetField,
              targetValue: a.targetValue,
              delay: a.delay,
              delayUnit: a.delayUnit,
            })),
            lastTriggered: rule.lastTriggeredAt,
            triggerCount: rule.triggerCount,
          };
        } catch (error) {
          return formatError(error, 'getTicketRule');
        }
      },
    }),

    createTicketRule: tool({
      description: 'Create a new ticket automation rule.',
      parameters: z.object({
        name: z.string().describe('Rule name'),
        description: z.string().optional().describe('Rule description'),
        triggerEvent: ruleTriggerEventSchema.describe('When to trigger the rule'),
        matchAll: z.boolean().optional().default(true).describe('Match all conditions (AND) or any (OR)'),
        stopProcessing: z.boolean().optional().default(false).describe('Stop processing other rules after this'),
        conditions: z.array(z.object({
          field: z.string().describe('Field to check'),
          operator: ruleOperatorSchema.describe('Comparison operator'),
          value: z.string().describe('Value to compare'),
          logicalOperator: z.enum(['and', 'or']).optional(),
        })).describe('Conditions to match'),
        actions: z.array(z.object({
          actionType: ruleActionTypeSchema.describe('Action to perform'),
          targetField: z.string().optional().describe('Target field'),
          targetValue: z.string().optional().describe('Target value'),
        })).describe('Actions to execute'),
      }),
      execute: async ({ name, description, triggerEvent, matchAll, stopProcessing, conditions, actions }) => {
        try {
          const rule = await ctx.ticketRules.create({
            name,
            description,
            triggerEvent,
            matchAll,
            stopProcessing,
            isEnabled: false, // Create disabled by default
            priority: 0,
            conditions: conditions.map((c, i) => ({
              id: 0,
              ruleId: 0,
              field: c.field,
              operator: c.operator,
              value: c.value,
              valueType: 'string',
              logicalOperator: c.logicalOperator,
              order: i,
            })),
            actions: actions.map((a, i) => ({
              id: 0,
              ruleId: 0,
              actionType: a.actionType,
              targetField: a.targetField,
              targetValue: a.targetValue,
              order: i,
            })),
          });

          return {
            success: true,
            message: `Rule "${rule.name}" created (disabled by default)`,
            ruleId: rule.id,
          };
        } catch (error) {
          return formatError(error, 'createTicketRule');
        }
      },
    }),

    enableTicketRule: tool({
      description: 'Enable a ticket automation rule.',
      parameters: z.object({
        ruleId: z.number().describe('The ticket rule ID'),
      }),
      execute: async ({ ruleId }) => {
        try {
          const rule = await ctx.ticketRules.enable(ruleId);
          return {
            success: true,
            message: `Rule "${rule.name}" enabled`,
            ruleId: rule.id,
          };
        } catch (error) {
          return formatError(error, 'enableTicketRule');
        }
      },
    }),

    disableTicketRule: tool({
      description: 'Disable a ticket automation rule.',
      parameters: z.object({
        ruleId: z.number().describe('The ticket rule ID'),
      }),
      execute: async ({ ruleId }) => {
        try {
          const rule = await ctx.ticketRules.disable(ruleId);
          return {
            success: true,
            message: `Rule "${rule.name}" disabled`,
            ruleId: rule.id,
          };
        } catch (error) {
          return formatError(error, 'disableTicketRule');
        }
      },
    }),

    cloneTicketRule: tool({
      description: 'Clone an existing ticket rule.',
      parameters: z.object({
        ruleId: z.number().describe('The ticket rule ID to clone'),
        newName: z.string().optional().describe('Name for the cloned rule'),
      }),
      execute: async ({ ruleId, newName }) => {
        try {
          const rule = await ctx.ticketRules.clone(ruleId, newName);
          return {
            success: true,
            message: `Rule cloned as "${rule.name}" (disabled)`,
            newRuleId: rule.id,
          };
        } catch (error) {
          return formatError(error, 'cloneTicketRule');
        }
      },
    }),

    testTicketRule: tool({
      description: 'Test a ticket rule against a specific ticket.',
      parameters: z.object({
        ruleId: z.number().describe('The ticket rule ID'),
        ticketId: z.number().describe('The ticket ID to test against'),
      }),
      execute: async ({ ruleId, ticketId }) => {
        try {
          const result = await ctx.ticketRules.testRule(ruleId, ticketId);
          return {
            success: true,
            matched: result.matched,
            conditionsEvaluated: result.conditionsEvaluated?.map((c: { field: string; operator: string; expectedValue: string; actualValue: string; matched: boolean }) => ({
              field: c.field,
              operator: c.operator,
              expected: c.expectedValue,
              actual: c.actualValue,
              matched: c.matched,
            })),
            actionsWouldExecute: result.actionsToExecute?.length || 0,
            errors: result.errors,
          };
        } catch (error) {
          return formatError(error, 'testTicketRule');
        }
      },
    }),

    deleteTicketRule: tool({
      description: 'Delete a ticket automation rule.',
      parameters: z.object({
        ruleId: z.number().describe('The ticket rule ID'),
      }),
      execute: async ({ ruleId }) => {
        try {
          await ctx.ticketRules.delete(ruleId);
          return {
            success: true,
            message: `Rule ${ruleId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteTicketRule');
        }
      },
    }),

    // === EXECUTION LOG OPERATIONS ===
    listRuleExecutionLogs: tool({
      description: 'List execution logs for ticket rules.',
      parameters: z.object({
        ruleId: z.number().optional().describe('Filter by rule ID'),
        ticketId: z.number().optional().describe('Filter by ticket ID'),
        successOnly: z.boolean().optional().describe('Only show successful executions'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ ruleId, ticketId, successOnly, count }) => {
        try {
          const logs = await ctx.ticketRules.getExecutionLogs({
            ruleId,
            ticketId,
            success: successOnly,
            pageSize: count,
          });

          return {
            success: true,
            count: logs.length,
            data: logs.map((l: RuleExecutionLog) => ({
              id: l.id,
              ruleId: l.ruleId,
              ruleName: l.ruleName,
              ticketId: l.ticketId,
              executedAt: l.executedAt,
              success: l.success,
              actionsExecuted: l.actionsExecuted,
              duration: l.duration,
              error: l.errorMessage,
            })),
          };
        } catch (error) {
          return formatError(error, 'listRuleExecutionLogs');
        }
      },
    }),

    // === FIELD/ACTION DISCOVERY ===
    getAvailableRuleFields: tool({
      description: 'Get available fields for rule conditions.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const fields = await ctx.ticketRules.getAvailableFields();
          return {
            success: true,
            count: fields.length,
            fields: fields.map((f: { field: string; label: string; type: string }) => ({
              field: f.field,
              label: f.label,
              type: f.type,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAvailableRuleFields');
        }
      },
    }),

    getAvailableRuleActions: tool({
      description: 'Get available actions for rules.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const actions = await ctx.ticketRules.getAvailableActions();
          return {
            success: true,
            count: actions.length,
            actions: actions.map((a: { action: string; label: string; parameters: string[] }) => ({
              action: a.action,
              label: a.label,
              parameters: a.parameters,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAvailableRuleActions');
        }
      },
    }),
  };
}
