/**
 * HaloPSA Ticket Rules Service.
 * Phase 4: Productivity & Automation
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  TicketRule,
  TicketRuleAPI,
  TicketRuleListParams,
  RuleExecutionLog,
  RuleExecutionLogAPI,
  RuleExecutionLogListParams,
  RuleTestResult,
  RuleTestResultAPI,
  transformTicketRule,
  transformRuleExecutionLog,
  transformRuleTestResult,
} from '../types';

/**
 * Service for managing ticket automation rules.
 */
export class TicketRuleService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List ticket rules with optional filters.
   */
  async list(params?: TicketRuleListParams): Promise<TicketRule[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.search) queryParams.search = params.search;
    if (params?.triggerEvent) queryParams.trigger_event = params.triggerEvent;
    if (params?.isEnabled !== undefined) queryParams.is_enabled = params.isEnabled;
    if (params?.clientId) queryParams.client_id = params.clientId;
    if (params?.ticketTypeId) queryParams.ticket_type_id = params.ticketTypeId;
    if (params?.categoryId) queryParams.category_id = params.categoryId;
    if (params?.teamId) queryParams.team_id = params.teamId;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ rules: TicketRuleAPI[] }>('/TicketRules', queryParams);
    return (response.rules || []).map(transformTicketRule);
  }

  /**
   * Get a specific ticket rule by ID.
   */
  async get(id: number): Promise<TicketRule> {
    const response = await this.client.get<TicketRuleAPI>(`/TicketRules/${id}`);
    return transformTicketRule(response);
  }

  /**
   * Create a new ticket rule.
   */
  async create(rule: Partial<TicketRule>): Promise<TicketRule> {
    const payload = this.toAPIFormat(rule);
    const response = await this.client.post<TicketRuleAPI>('/TicketRules', [payload]);
    return transformTicketRule(response);
  }

  /**
   * Update an existing ticket rule.
   */
  async update(id: number, rule: Partial<TicketRule>): Promise<TicketRule> {
    const payload = { ...this.toAPIFormat(rule), id };
    const response = await this.client.post<TicketRuleAPI>('/TicketRules', [payload]);
    return transformTicketRule(response);
  }

  /**
   * Delete a ticket rule.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/TicketRules/${id}`);
  }

  /**
   * Enable a ticket rule.
   */
  async enable(id: number): Promise<TicketRule> {
    return this.update(id, { isEnabled: true });
  }

  /**
   * Disable a ticket rule.
   */
  async disable(id: number): Promise<TicketRule> {
    return this.update(id, { isEnabled: false });
  }

  /**
   * Clone an existing ticket rule.
   */
  async clone(id: number, newName?: string): Promise<TicketRule> {
    const original = await this.get(id);
    const cloned = {
      ...original,
      id: undefined,
      name: newName || `${original.name} (Copy)`,
      isEnabled: false,
      triggerCount: undefined,
      lastTriggeredAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    return this.create(cloned);
  }

  /**
   * Test a rule against a specific ticket.
   */
  async testRule(ruleId: number, ticketId: number): Promise<RuleTestResult> {
    const response = await this.client.post<RuleTestResultAPI>(
      `/TicketRules/${ruleId}/Test`,
      { ticket_id: ticketId }
    );
    return transformRuleTestResult(response);
  }

  /**
   * Test rule conditions without a specific rule ID (preview mode).
   */
  async testConditions(
    conditions: TicketRule['conditions'],
    ticketId: number
  ): Promise<RuleTestResult> {
    const conditionsAPI = conditions.map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value,
      value_type: c.valueType,
      logical_operator: c.logicalOperator,
      group_id: c.groupId,
      order: c.order,
      is_negated: c.isNegated,
    }));

    const response = await this.client.post<RuleTestResultAPI>(
      '/TicketRules/TestConditions',
      { conditions: conditionsAPI, ticket_id: ticketId }
    );
    return transformRuleTestResult(response);
  }

  /**
   * Reorder ticket rules (change execution order).
   */
  async reorder(ruleIds: number[]): Promise<void> {
    await this.client.post('/TicketRules/Reorder', {
      rule_ids: ruleIds,
    });
  }

  /**
   * Get execution logs for ticket rules.
   */
  async getExecutionLogs(params?: RuleExecutionLogListParams): Promise<RuleExecutionLog[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.ruleId) queryParams.rule_id = params.ruleId;
    if (params?.ticketId) queryParams.ticket_id = params.ticketId;
    if (params?.success !== undefined) queryParams.success = params.success;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ logs: RuleExecutionLogAPI[] }>(
      '/TicketRules/ExecutionLogs',
      queryParams
    );
    return (response.logs || []).map(transformRuleExecutionLog);
  }

  /**
   * Get execution log for a specific rule.
   */
  async getRuleExecutionLogs(
    ruleId: number,
    params?: Omit<RuleExecutionLogListParams, 'ruleId'>
  ): Promise<RuleExecutionLog[]> {
    return this.getExecutionLogs({ ...params, ruleId });
  }

  /**
   * Get available fields for rule conditions.
   */
  async getAvailableFields(): Promise<{ field: string; label: string; type: string }[]> {
    const response = await this.client.get<{ fields: { field: string; label: string; type: string }[] }>(
      '/TicketRules/Fields'
    );
    return response.fields || [];
  }

  /**
   * Get available actions for rules.
   */
  async getAvailableActions(): Promise<{ action: string; label: string; parameters: string[] }[]> {
    const response = await this.client.get<{ actions: { action: string; label: string; parameters: string[] }[] }>(
      '/TicketRules/Actions'
    );
    return response.actions || [];
  }

  /**
   * Execute a rule manually on a ticket.
   */
  async executeRule(ruleId: number, ticketId: number): Promise<RuleExecutionLog> {
    const response = await this.client.post<RuleExecutionLogAPI>(
      `/TicketRules/${ruleId}/Execute`,
      { ticket_id: ticketId }
    );
    return transformRuleExecutionLog(response);
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(rule: Partial<TicketRule>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (rule.name !== undefined) api.name = rule.name;
    if (rule.description !== undefined) api.description = rule.description;
    if (rule.triggerEvent !== undefined) api.trigger_event = rule.triggerEvent;
    if (rule.isEnabled !== undefined) api.is_enabled = rule.isEnabled;
    if (rule.priority !== undefined) api.priority = rule.priority;
    if (rule.matchAll !== undefined) api.match_all = rule.matchAll;
    if (rule.stopProcessing !== undefined) api.stop_processing = rule.stopProcessing;
    if (rule.clientId !== undefined) api.client_id = rule.clientId;
    if (rule.siteId !== undefined) api.site_id = rule.siteId;
    if (rule.ticketTypeId !== undefined) api.ticket_type_id = rule.ticketTypeId;
    if (rule.categoryId !== undefined) api.category_id = rule.categoryId;
    if (rule.teamId !== undefined) api.team_id = rule.teamId;
    if (rule.executionOrder !== undefined) api.execution_order = rule.executionOrder;

    if (rule.conditions) {
      api.conditions = rule.conditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
        value_type: c.valueType,
        logical_operator: c.logicalOperator,
        group_id: c.groupId,
        order: c.order,
        is_negated: c.isNegated,
      }));
    }

    if (rule.actions) {
      api.actions = rule.actions.map((a) => ({
        action_type: a.actionType,
        target_field: a.targetField,
        target_value: a.targetValue,
        template_id: a.templateId,
        webhook_id: a.webhookId,
        workflow_id: a.workflowId,
        agent_id: a.agentId,
        team_id: a.teamId,
        priority: a.priority,
        status_id: a.statusId,
        category_id: a.categoryId,
        delay: a.delay,
        delay_unit: a.delayUnit,
        order: a.order,
        is_enabled: a.isEnabled,
        parameters: a.parameters,
      }));
    }

    return api;
  }
}
