/**
 * Automation Rules AI tools.
 * Enables natural language automation rule creation and management.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Trigger type mappings from natural language
const TRIGGER_KEYWORDS: Record<string, { type: string; description: string }> = {
  'ticket created': { type: 'TICKET_CREATED', description: 'When a new ticket is created' },
  'new ticket': { type: 'TICKET_CREATED', description: 'When a new ticket is created' },
  'ticket is created': { type: 'TICKET_CREATED', description: 'When a new ticket is created' },
  'ticket updated': { type: 'TICKET_UPDATED', description: 'When a ticket is updated' },
  'ticket changes': { type: 'TICKET_UPDATED', description: 'When a ticket is updated' },
  'status changes': { type: 'TICKET_STATUS_CHANGED', description: 'When ticket status changes' },
  'status changed': { type: 'TICKET_STATUS_CHANGED', description: 'When ticket status changes' },
  'assigned': { type: 'TICKET_ASSIGNED', description: 'When ticket is assigned' },
  'ticket assigned': { type: 'TICKET_ASSIGNED', description: 'When ticket is assigned' },
  'priority changes': { type: 'TICKET_PRIORITY_CHANGED', description: 'When priority changes' },
  'priority changed': { type: 'TICKET_PRIORITY_CHANGED', description: 'When priority changes' },
  'sla warning': { type: 'SLA_BREACH_WARNING', description: 'Before SLA breach' },
  'sla about to breach': { type: 'SLA_BREACH_WARNING', description: 'Before SLA breach' },
  'sla breach': { type: 'SLA_BREACHED', description: 'When SLA is breached' },
  'sla breached': { type: 'SLA_BREACHED', description: 'When SLA is breached' },
  'every day': { type: 'SCHEDULED', description: 'Daily scheduled trigger' },
  'every hour': { type: 'SCHEDULED', description: 'Hourly scheduled trigger' },
  'scheduled': { type: 'SCHEDULED', description: 'Time-based trigger' },
};

// Action type mappings from natural language
const ACTION_KEYWORDS: Record<string, { type: string; description: string }> = {
  'assign to': { type: 'ASSIGN_TICKET', description: 'Assign to agent/team' },
  'auto-assign': { type: 'ASSIGN_TICKET', description: 'Assign to agent/team' },
  'assign': { type: 'ASSIGN_TICKET', description: 'Assign to agent/team' },
  'change priority': { type: 'CHANGE_PRIORITY', description: 'Change ticket priority' },
  'set priority': { type: 'CHANGE_PRIORITY', description: 'Change ticket priority' },
  'escalate priority': { type: 'CHANGE_PRIORITY', description: 'Change ticket priority' },
  'change status': { type: 'CHANGE_STATUS', description: 'Change ticket status' },
  'set status': { type: 'CHANGE_STATUS', description: 'Change ticket status' },
  'add note': { type: 'ADD_NOTE', description: 'Add a note to ticket' },
  'add comment': { type: 'ADD_NOTE', description: 'Add a note to ticket' },
  'notify': { type: 'SEND_NOTIFICATION', description: 'Send email/notification' },
  'send notification': { type: 'SEND_NOTIFICATION', description: 'Send email/notification' },
  'email': { type: 'SEND_NOTIFICATION', description: 'Send email/notification' },
  'alert': { type: 'SEND_NOTIFICATION', description: 'Send email/notification' },
  'add tag': { type: 'ADD_TAG', description: 'Add tag/category' },
  'tag': { type: 'ADD_TAG', description: 'Add tag/category' },
  'categorize': { type: 'ADD_TAG', description: 'Add tag/category' },
  'escalate': { type: 'ESCALATE', description: 'Escalate the ticket' },
  'create task': { type: 'CREATE_TASK', description: 'Create a task' },
  'webhook': { type: 'WEBHOOK', description: 'Call external webhook' },
};

// Priority mappings
const PRIORITY_KEYWORDS: Record<string, string> = {
  'p1': 'P1',
  'p2': 'P2',
  'p3': 'P3',
  'p4': 'P4',
  'critical': 'P1',
  'high': 'P2',
  'medium': 'P3',
  'low': 'P4',
  'urgent': 'P1',
  'emergency': 'P1',
};

/**
 * Parse natural language to extract trigger type.
 */
function parseTrigger(text: string): { type: string; config: Record<string, unknown> } | null {
  const lowerText = text.toLowerCase();

  for (const [keyword, mapping] of Object.entries(TRIGGER_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      const config: Record<string, unknown> = {};

      // Extract priority conditions
      for (const [priorityKey, priorityValue] of Object.entries(PRIORITY_KEYWORDS)) {
        if (lowerText.includes(priorityKey)) {
          config.priority = priorityValue;
        }
      }

      // Extract keywords for matching
      const keywordMatches = lowerText.match(/(?:about|regarding|contains?|mentions?|includes?)\s+["']?([^"']+)["']?/i);
      if (keywordMatches) {
        config.keywords = keywordMatches[1].split(/[,\s]+/).filter(Boolean);
      }

      return { type: mapping.type, config };
    }
  }

  return null;
}

/**
 * Parse natural language to extract action type.
 */
function parseAction(text: string): { type: string; config: Record<string, unknown> } | null {
  const lowerText = text.toLowerCase();

  for (const [keyword, mapping] of Object.entries(ACTION_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      const config: Record<string, unknown> = {};

      // Extract target for assignment
      const assignMatch = text.match(/assign(?:\s+to)?\s+["']?([^"',]+)["']?/i);
      if (assignMatch) {
        config.assignTo = assignMatch[1].trim();
      }

      // Extract notification target
      const notifyMatch = text.match(/notify\s+(?:the\s+)?["']?([^"',]+)["']?/i);
      if (notifyMatch) {
        config.notifyTarget = notifyMatch[1].trim();
      }

      // Extract priority target
      for (const [priorityKey, priorityValue] of Object.entries(PRIORITY_KEYWORDS)) {
        if (lowerText.includes(`to ${priorityKey}`) || lowerText.includes(`as ${priorityKey}`)) {
          config.targetPriority = priorityValue;
        }
      }

      // Extract note content
      const noteMatch = text.match(/add\s+(?:a\s+)?note[:\s]+["']?([^"']+)["']?/i);
      if (noteMatch) {
        config.noteContent = noteMatch[1].trim();
      }

      return { type: mapping.type, config };
    }
  }

  return null;
}

/**
 * Parse conditions from natural language.
 */
function parseConditions(text: string): Array<{ field: string; operator: string; value: string }> {
  const conditions: Array<{ field: string; operator: string; value: string }> = [];
  const lowerText = text.toLowerCase();

  // Priority conditions
  for (const [priorityKey, priorityValue] of Object.entries(PRIORITY_KEYWORDS)) {
    if (lowerText.includes(`is ${priorityKey}`) || lowerText.includes(`priority ${priorityKey}`)) {
      conditions.push({ field: 'priority', operator: 'equals', value: priorityValue });
    }
  }

  // Keyword conditions
  const keywordPatterns = [
    /(?:about|regarding|contains?|mentions?|subject)\s+["']?([^"']+)["']?/gi,
    /["']([^"']+)["']\s+(?:in\s+)?(?:subject|title|summary)/gi,
  ];

  for (const pattern of keywordPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      conditions.push({ field: 'keywords', operator: 'contains', value: match[1].trim() });
    }
  }

  // Client/customer conditions
  const clientMatch = text.match(/(?:from|for|client)\s+["']?([^"',]+)["']?/i);
  if (clientMatch) {
    conditions.push({ field: 'client', operator: 'equals', value: clientMatch[1].trim() });
  }

  return conditions;
}

export function createAutomationTools(userId: string, connectionId?: string) {
  return {
    /**
     * Parse and create an automation rule from natural language.
     */
    createAutomationRule: tool({
      description: `Create an automation rule from a natural language description.

Examples:
- "When a P1 ticket is created, notify the on-call team"
- "Auto-assign printer issues to John"
- "When a ticket about VPN is created, add the networking tag"
- "Escalate tickets that have been open for 4 hours"

The AI will parse the natural language and create a structured rule.`,
      parameters: z.object({
        name: z.string().describe('Short name for the rule'),
        description: z.string().describe('Natural language description of what the rule should do'),
      }),
      execute: async ({ name, description }) => {
        try {
          // Parse the natural language
          const trigger = parseTrigger(description);
          const action = parseAction(description);
          const conditions = parseConditions(description);

          if (!trigger) {
            return {
              success: false,
              error: 'Could not understand the trigger condition. Try using phrases like "When a ticket is created" or "When priority changes".',
              suggestions: Object.keys(TRIGGER_KEYWORDS).slice(0, 5),
            };
          }

          if (!action) {
            return {
              success: false,
              error: 'Could not understand the action. Try using phrases like "assign to", "notify", or "change priority".',
              suggestions: Object.keys(ACTION_KEYWORDS).slice(0, 5),
            };
          }

          // Create the rule
          const rule = await prisma.automationRule.create({
            data: {
              userId,
              connectionId: connectionId || null,
              name,
              description,
              triggerType: trigger.type as never,
              triggerConfig: JSON.parse(JSON.stringify(trigger.config)),
              actionType: action.type as never,
              actionConfig: JSON.parse(JSON.stringify(action.config)),
              conditions: conditions.length > 0 ? JSON.parse(JSON.stringify(conditions)) : null,
              isActive: true,
            },
          });

          return {
            success: true,
            rule: {
              id: rule.id,
              name: rule.name,
              description: rule.description,
              trigger: {
                type: rule.triggerType,
                config: trigger.config,
              },
              action: {
                type: rule.actionType,
                config: action.config,
              },
              conditions,
              isActive: rule.isActive,
            },
            message: `Automation rule "${name}" created successfully!`,
          };
        } catch (error) {
          console.error('[Tool:createAutomationRule] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create automation rule',
          };
        }
      },
    }),

    /**
     * List automation rules.
     */
    listAutomationRules: tool({
      description: 'List all automation rules for the current user.',
      parameters: z.object({
        activeOnly: z.boolean().optional().describe('Only show active rules'),
      }),
      execute: async ({ activeOnly = false }) => {
        try {
          const rules = await prisma.automationRule.findMany({
            where: {
              userId,
              ...(activeOnly ? { isActive: true } : {}),
            },
            orderBy: { createdAt: 'desc' },
          });

          return {
            success: true,
            count: rules.length,
            rules: rules.map(rule => ({
              id: rule.id,
              name: rule.name,
              description: rule.description,
              trigger: rule.triggerType,
              action: rule.actionType,
              isActive: rule.isActive,
              executionCount: rule.executionCount,
              lastExecutedAt: rule.lastExecutedAt,
            })),
          };
        } catch (error) {
          console.error('[Tool:listAutomationRules] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list automation rules',
          };
        }
      },
    }),

    /**
     * Toggle automation rule active status.
     */
    toggleAutomationRule: tool({
      description: 'Enable or disable an automation rule.',
      parameters: z.object({
        ruleId: z.string().describe('The ID of the rule to toggle'),
        isActive: z.boolean().describe('Whether to enable or disable the rule'),
      }),
      execute: async ({ ruleId, isActive }) => {
        try {
          const rule = await prisma.automationRule.update({
            where: { id: ruleId, userId },
            data: { isActive },
          });

          return {
            success: true,
            rule: {
              id: rule.id,
              name: rule.name,
              isActive: rule.isActive,
            },
            message: `Rule "${rule.name}" ${isActive ? 'enabled' : 'disabled'} successfully!`,
          };
        } catch (error) {
          console.error('[Tool:toggleAutomationRule] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to toggle automation rule',
          };
        }
      },
    }),

    /**
     * Delete an automation rule.
     */
    deleteAutomationRule: tool({
      description: 'Delete an automation rule.',
      parameters: z.object({
        ruleId: z.string().describe('The ID of the rule to delete'),
      }),
      execute: async ({ ruleId }) => {
        try {
          const rule = await prisma.automationRule.delete({
            where: { id: ruleId, userId },
          });

          return {
            success: true,
            message: `Rule "${rule.name}" deleted successfully!`,
          };
        } catch (error) {
          console.error('[Tool:deleteAutomationRule] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete automation rule',
          };
        }
      },
    }),

    /**
     * Suggest automation rules based on patterns.
     */
    suggestAutomationRules: tool({
      description: 'Get AI-suggested automation rules based on common patterns and best practices.',
      parameters: z.object({
        focus: z.enum(['tickets', 'sla', 'assignment', 'notifications', 'all']).optional()
          .describe('Focus area for suggestions'),
      }),
      execute: async ({ focus = 'all' }) => {
        const suggestions: Array<{ name: string; description: string; category: string }> = [];

        if (focus === 'all' || focus === 'tickets') {
          suggestions.push(
            { name: 'Auto-categorize Printer Issues', description: 'When a ticket is created with "printer" in the subject, add the Printing category', category: 'tickets' },
            { name: 'Flag VIP Clients', description: 'When a ticket is created from a VIP client, set priority to High', category: 'tickets' },
          );
        }

        if (focus === 'all' || focus === 'sla') {
          suggestions.push(
            { name: 'SLA Warning Alert', description: 'When a ticket is 80% through its SLA time, notify the assigned agent', category: 'sla' },
            { name: 'SLA Breach Escalation', description: 'When SLA is breached, escalate to team lead and add urgent tag', category: 'sla' },
          );
        }

        if (focus === 'all' || focus === 'assignment') {
          suggestions.push(
            { name: 'Network Issues to Network Team', description: 'When a ticket mentions network, VPN, or connectivity, assign to Network Team', category: 'assignment' },
            { name: 'After-Hours Assignment', description: 'When a P1 ticket is created outside business hours, assign to on-call team', category: 'assignment' },
          );
        }

        if (focus === 'all' || focus === 'notifications') {
          suggestions.push(
            { name: 'New Ticket Notification', description: 'When any ticket is created, notify the service desk manager', category: 'notifications' },
            { name: 'P1 Alert', description: 'When a P1 ticket is created, immediately notify the management team', category: 'notifications' },
          );
        }

        return {
          success: true,
          suggestions,
          message: `Found ${suggestions.length} automation suggestions. Would you like to create any of these?`,
        };
      },
    }),
  };
}
