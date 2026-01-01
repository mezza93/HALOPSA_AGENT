/**
 * HaloPSA Ticket Rules types.
 * Phase 4: Productivity & Automation
 */

import { HaloBaseEntity } from './common';

// ==========================================
// Ticket Rule Types
// ==========================================

/**
 * Rule condition operator types.
 */
export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'matches_regex'
  | 'in_list'
  | 'not_in_list';

/**
 * Rule action types.
 */
export type RuleActionType =
  | 'set_field'
  | 'send_email'
  | 'send_sms'
  | 'create_ticket'
  | 'update_ticket'
  | 'close_ticket'
  | 'assign_agent'
  | 'assign_team'
  | 'add_note'
  | 'add_tag'
  | 'remove_tag'
  | 'run_workflow'
  | 'trigger_webhook'
  | 'send_notification'
  | 'escalate'
  | 'set_sla'
  | 'set_priority'
  | 'set_status'
  | 'set_category';

/**
 * Rule trigger events.
 */
export type RuleTriggerEvent =
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_status_changed'
  | 'ticket_assigned'
  | 'ticket_escalated'
  | 'ticket_closed'
  | 'ticket_reopened'
  | 'sla_breach'
  | 'sla_warning'
  | 'time_trigger'
  | 'email_received'
  | 'note_added'
  | 'attachment_added'
  | 'approval_received'
  | 'custom_event';

/**
 * Rule condition for triggering actions.
 */
export interface RuleCondition extends HaloBaseEntity {
  id: number;
  ruleId: number;
  field: string;
  operator: RuleOperator;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'list';
  logicalOperator?: 'and' | 'or';
  groupId?: number;
  order: number;
  isNegated?: boolean;
}

/**
 * Rule condition as returned by API.
 */
export interface RuleConditionAPI {
  id: number;
  rule_id: number;
  field: string;
  operator: RuleOperator;
  value: string;
  value_type: 'string' | 'number' | 'boolean' | 'date' | 'list';
  logical_operator?: 'and' | 'or';
  group_id?: number;
  order: number;
  is_negated?: boolean;
  [key: string]: unknown;
}

/**
 * Rule action to execute when conditions are met.
 */
export interface RuleAction extends HaloBaseEntity {
  id: number;
  ruleId: number;
  actionType: RuleActionType;
  targetField?: string;
  targetValue?: string;
  templateId?: number;
  webhookId?: number;
  workflowId?: number;
  agentId?: number;
  teamId?: number;
  priority?: number;
  statusId?: number;
  categoryId?: number;
  delay?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
  order: number;
  isEnabled?: boolean;
  parameters?: Record<string, unknown>;
}

/**
 * Rule action as returned by API.
 */
export interface RuleActionAPI {
  id: number;
  rule_id: number;
  action_type: RuleActionType;
  target_field?: string;
  target_value?: string;
  template_id?: number;
  webhook_id?: number;
  workflow_id?: number;
  agent_id?: number;
  team_id?: number;
  priority?: number;
  status_id?: number;
  category_id?: number;
  delay?: number;
  delay_unit?: 'minutes' | 'hours' | 'days';
  order: number;
  is_enabled?: boolean;
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Ticket automation rule.
 */
export interface TicketRule extends HaloBaseEntity {
  id: number;
  name: string;
  description?: string;
  triggerEvent: RuleTriggerEvent;
  isEnabled: boolean;
  isActive?: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  matchAll?: boolean;
  stopProcessing?: boolean;
  clientId?: number;
  siteId?: number;
  ticketTypeId?: number;
  categoryId?: number;
  teamId?: number;
  createdBy?: number;
  createdByName?: string;
  createdAt?: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
  lastTriggeredAt?: string;
  triggerCount?: number;
  executionOrder?: number;
}

/**
 * Ticket rule as returned by API.
 */
export interface TicketRuleAPI {
  id: number;
  name: string;
  description?: string;
  trigger_event: RuleTriggerEvent;
  is_enabled: boolean;
  is_active?: boolean;
  priority: number;
  conditions: RuleConditionAPI[];
  actions: RuleActionAPI[];
  match_all?: boolean;
  stop_processing?: boolean;
  client_id?: number;
  site_id?: number;
  ticket_type_id?: number;
  category_id?: number;
  team_id?: number;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_by?: number;
  updated_by_name?: string;
  updated_at?: string;
  last_triggered_at?: string;
  trigger_count?: number;
  execution_order?: number;
  [key: string]: unknown;
}

/**
 * Result of testing a rule against a ticket.
 */
export interface RuleTestResult {
  ruleId: number;
  ruleName: string;
  matched: boolean;
  conditionsEvaluated: {
    conditionId: number;
    field: string;
    operator: RuleOperator;
    expectedValue: string;
    actualValue: string;
    matched: boolean;
  }[];
  actionsToExecute?: RuleAction[];
  errors?: string[];
  executionTime?: number;
  [key: string]: unknown;
}

/**
 * Rule test result as returned by API.
 */
export interface RuleTestResultAPI {
  rule_id: number;
  rule_name: string;
  matched: boolean;
  conditions_evaluated: {
    condition_id: number;
    field: string;
    operator: RuleOperator;
    expected_value: string;
    actual_value: string;
    matched: boolean;
  }[];
  actions_to_execute?: RuleActionAPI[];
  errors?: string[];
  execution_time?: number;
  [key: string]: unknown;
}

/**
 * Rule execution log entry.
 */
export interface RuleExecutionLog extends HaloBaseEntity {
  id: number;
  ruleId: number;
  ruleName: string;
  ticketId: number;
  ticketSummary?: string;
  executedAt: string;
  success: boolean;
  actionsExecuted: number;
  duration?: number;
  errorMessage?: string;
  conditionsSnapshot?: RuleCondition[];
  actionsSnapshot?: RuleAction[];
}

/**
 * Rule execution log as returned by API.
 */
export interface RuleExecutionLogAPI {
  id: number;
  rule_id: number;
  rule_name: string;
  ticket_id: number;
  ticket_summary?: string;
  executed_at: string;
  success: boolean;
  actions_executed: number;
  duration?: number;
  error_message?: string;
  conditions_snapshot?: RuleConditionAPI[];
  actions_snapshot?: RuleActionAPI[];
  [key: string]: unknown;
}

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform API rule condition to internal format.
 */
export function transformRuleCondition(api: RuleConditionAPI): RuleCondition {
  return {
    id: api.id,
    ruleId: api.rule_id,
    field: api.field,
    operator: api.operator,
    value: api.value,
    valueType: api.value_type,
    logicalOperator: api.logical_operator,
    groupId: api.group_id,
    order: api.order,
    isNegated: api.is_negated,
  };
}

/**
 * Transform API rule action to internal format.
 */
export function transformRuleAction(api: RuleActionAPI): RuleAction {
  return {
    id: api.id,
    ruleId: api.rule_id,
    actionType: api.action_type,
    targetField: api.target_field,
    targetValue: api.target_value,
    templateId: api.template_id,
    webhookId: api.webhook_id,
    workflowId: api.workflow_id,
    agentId: api.agent_id,
    teamId: api.team_id,
    priority: api.priority,
    statusId: api.status_id,
    categoryId: api.category_id,
    delay: api.delay,
    delayUnit: api.delay_unit,
    order: api.order,
    isEnabled: api.is_enabled,
    parameters: api.parameters,
  };
}

/**
 * Transform API ticket rule to internal format.
 */
export function transformTicketRule(api: TicketRuleAPI): TicketRule {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    triggerEvent: api.trigger_event,
    isEnabled: api.is_enabled,
    isActive: api.is_active,
    priority: api.priority,
    conditions: api.conditions?.map(transformRuleCondition) || [],
    actions: api.actions?.map(transformRuleAction) || [],
    matchAll: api.match_all,
    stopProcessing: api.stop_processing,
    clientId: api.client_id,
    siteId: api.site_id,
    ticketTypeId: api.ticket_type_id,
    categoryId: api.category_id,
    teamId: api.team_id,
    createdBy: api.created_by,
    createdByName: api.created_by_name,
    createdAt: api.created_at,
    updatedBy: api.updated_by,
    updatedByName: api.updated_by_name,
    updatedAt: api.updated_at,
    lastTriggeredAt: api.last_triggered_at,
    triggerCount: api.trigger_count,
    executionOrder: api.execution_order,
  };
}

/**
 * Transform API rule test result to internal format.
 */
export function transformRuleTestResult(api: RuleTestResultAPI): RuleTestResult {
  return {
    ruleId: api.rule_id,
    ruleName: api.rule_name,
    matched: api.matched,
    conditionsEvaluated: api.conditions_evaluated?.map((c) => ({
      conditionId: c.condition_id,
      field: c.field,
      operator: c.operator,
      expectedValue: c.expected_value,
      actualValue: c.actual_value,
      matched: c.matched,
    })) || [],
    actionsToExecute: api.actions_to_execute?.map(transformRuleAction),
    errors: api.errors,
    executionTime: api.execution_time,
  };
}

/**
 * Transform API rule execution log to internal format.
 */
export function transformRuleExecutionLog(api: RuleExecutionLogAPI): RuleExecutionLog {
  return {
    id: api.id,
    ruleId: api.rule_id,
    ruleName: api.rule_name,
    ticketId: api.ticket_id,
    ticketSummary: api.ticket_summary,
    executedAt: api.executed_at,
    success: api.success,
    actionsExecuted: api.actions_executed,
    duration: api.duration,
    errorMessage: api.error_message,
    conditionsSnapshot: api.conditions_snapshot?.map(transformRuleCondition),
    actionsSnapshot: api.actions_snapshot?.map(transformRuleAction),
  };
}

// ==========================================
// List Parameters
// ==========================================

/**
 * Parameters for listing ticket rules.
 */
export interface TicketRuleListParams {
  pageSize?: number;
  pageNo?: number;
  search?: string;
  triggerEvent?: RuleTriggerEvent;
  isEnabled?: boolean;
  clientId?: number;
  ticketTypeId?: number;
  categoryId?: number;
  teamId?: number;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing rule execution logs.
 */
export interface RuleExecutionLogListParams {
  pageSize?: number;
  pageNo?: number;
  ruleId?: number;
  ticketId?: number;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
  orderBy?: string;
  orderDesc?: boolean;
}
