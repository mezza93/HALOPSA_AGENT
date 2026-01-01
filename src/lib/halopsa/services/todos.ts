/**
 * ToDo/Task service for HaloPSA API.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  ToDo,
  ToDoApiResponse,
  ToDoPriority,
  ToDoStatus,
  ToDoGroup,
  ToDoGroupApiResponse,
  ToDoSummary,
  transformToDo,
  transformToDoGroup,
} from '../types/todo';
import type { ListParams } from '../types';

/**
 * Service for managing todos/tasks.
 */
export class ToDoService extends BaseService<ToDo, ToDoApiResponse> {
  protected endpoint = '/ToDo';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: ToDoApiResponse): ToDo {
    return transformToDo(data);
  }

  /**
   * List todos with filters.
   */
  async listFiltered(params: {
    agentId?: number;
    assignedToId?: number;
    status?: ToDoStatus;
    priority?: ToDoPriority;
    groupId?: number;
    ticketId?: number;
    clientId?: number;
    projectId?: number;
    dueDate?: string;
    overdue?: boolean;
    search?: string;
    count?: number;
  }): Promise<ToDo[]> {
    const queryParams: ListParams = {};

    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.assignedToId) queryParams.assigned_to_id = params.assignedToId;
    if (params.status) queryParams.status = params.status;
    if (params.priority) queryParams.priority = params.priority;
    if (params.groupId) queryParams.group_id = params.groupId;
    if (params.ticketId) queryParams.ticket_id = params.ticketId;
    if (params.clientId) queryParams.client_id = params.clientId;
    if (params.projectId) queryParams.project_id = params.projectId;
    if (params.dueDate) queryParams.due_date = params.dueDate;
    if (params.overdue) queryParams.overdue = true;
    if (params.search) queryParams.search = params.search;
    if (params.count) queryParams.count = params.count;

    return this.list(queryParams);
  }

  /**
   * Create a new todo.
   */
  async createToDo(data: {
    title: string;
    description?: string;
    priority?: ToDoPriority;
    dueDate?: string;
    dueTime?: string;
    agentId?: number;
    assignedToId?: number;
    ticketId?: number;
    clientId?: number;
    projectId?: number;
    groupId?: number;
    estimatedMinutes?: number;
    tags?: string[];
    isPrivate?: boolean;
    reminderDate?: string;
  }): Promise<ToDo> {
    const todoData: Record<string, unknown> = {
      title: data.title,
      priority: data.priority || 'medium',
      status: 'pending',
      is_private: data.isPrivate ?? false,
      is_recurring: false,
    };

    if (data.description) todoData.description = data.description;
    if (data.dueDate) todoData.due_date = data.dueDate;
    if (data.dueTime) todoData.due_time = data.dueTime;
    if (data.agentId) todoData.agent_id = data.agentId;
    if (data.assignedToId) todoData.assigned_to_id = data.assignedToId;
    if (data.ticketId) todoData.ticket_id = data.ticketId;
    if (data.clientId) todoData.client_id = data.clientId;
    if (data.projectId) todoData.project_id = data.projectId;
    if (data.groupId) todoData.group_id = data.groupId;
    if (data.estimatedMinutes) todoData.estimated_minutes = data.estimatedMinutes;
    if (data.tags) todoData.tags = data.tags;
    if (data.reminderDate) todoData.reminder_date = data.reminderDate;

    const todos = await this.create([todoData as Partial<ToDo>]);
    if (todos.length === 0) {
      throw new Error('Failed to create todo');
    }
    return todos[0];
  }

  /**
   * Start working on a todo.
   */
  async start(todoId: number): Promise<ToDo> {
    const todos = await this.update([{
      id: todoId,
      status: 'in_progress',
    } as Partial<ToDo>]);
    if (todos.length === 0) {
      throw new Error('Failed to start todo');
    }
    return todos[0];
  }

  /**
   * Complete a todo.
   */
  async complete(todoId: number, actualMinutes?: number): Promise<ToDo> {
    const updateData: Partial<ToDo> = {
      id: todoId,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    if (actualMinutes !== undefined) {
      updateData.actualMinutes = actualMinutes;
    }

    const todos = await this.update([updateData]);
    if (todos.length === 0) {
      throw new Error('Failed to complete todo');
    }
    return todos[0];
  }

  /**
   * Defer a todo.
   */
  async defer(todoId: number, newDueDate?: string): Promise<ToDo> {
    const updateData: Partial<ToDo> = {
      id: todoId,
      status: 'deferred',
    };
    if (newDueDate) {
      updateData.dueDate = newDueDate;
    }

    const todos = await this.update([updateData]);
    if (todos.length === 0) {
      throw new Error('Failed to defer todo');
    }
    return todos[0];
  }

  /**
   * Cancel a todo.
   */
  async cancel(todoId: number): Promise<ToDo> {
    const todos = await this.update([{
      id: todoId,
      status: 'cancelled',
    } as Partial<ToDo>]);
    if (todos.length === 0) {
      throw new Error('Failed to cancel todo');
    }
    return todos[0];
  }

  /**
   * Reassign a todo.
   */
  async reassign(todoId: number, newAssigneeId: number): Promise<ToDo> {
    const todos = await this.update([{
      id: todoId,
      assignedToId: newAssigneeId,
    } as Partial<ToDo>]);
    if (todos.length === 0) {
      throw new Error('Failed to reassign todo');
    }
    return todos[0];
  }

  /**
   * Change priority of a todo.
   */
  async setPriority(todoId: number, priority: ToDoPriority): Promise<ToDo> {
    const todos = await this.update([{
      id: todoId,
      priority,
    } as Partial<ToDo>]);
    if (todos.length === 0) {
      throw new Error('Failed to update todo priority');
    }
    return todos[0];
  }

  /**
   * Get todos due today.
   */
  async getDueToday(agentId?: number): Promise<ToDo[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.listFiltered({
      agentId,
      dueDate: today,
      status: 'pending',
    });
  }

  /**
   * Get overdue todos.
   */
  async getOverdue(agentId?: number): Promise<ToDo[]> {
    return this.listFiltered({
      agentId,
      overdue: true,
    });
  }

  /**
   * Get todos for the next N days.
   */
  async getUpcoming(agentId: number, days: number = 7): Promise<ToDo[]> {
    const todos = await this.listFiltered({
      agentId,
      status: 'pending',
    });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      return todo.dueDate <= endDateStr;
    });
  }

  /**
   * Get todo summary statistics.
   */
  async getSummary(params: {
    agentId?: number;
    teamId?: number;
  }): Promise<ToDoSummary> {
    const todos = await this.listFiltered({
      agentId: params.agentId,
    });

    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const pending = todos.filter(t => t.status === 'pending');
    const inProgress = todos.filter(t => t.status === 'in_progress');
    const completed = todos.filter(t => t.status === 'completed');
    const overdue = todos.filter(t => t.dueDate && t.dueDate < today && t.status !== 'completed' && t.status !== 'cancelled');
    const dueToday = todos.filter(t => t.dueDate === today && t.status !== 'completed' && t.status !== 'cancelled');
    const dueThisWeek = todos.filter(t => t.dueDate && t.dueDate <= weekEndStr && t.dueDate > today && t.status !== 'completed' && t.status !== 'cancelled');

    // Group by priority
    const priorityGroups: Record<ToDoPriority, { count: number; completedCount: number }> = {
      low: { count: 0, completedCount: 0 },
      medium: { count: 0, completedCount: 0 },
      high: { count: 0, completedCount: 0 },
      urgent: { count: 0, completedCount: 0 },
    };

    for (const todo of todos) {
      priorityGroups[todo.priority].count++;
      if (todo.status === 'completed') {
        priorityGroups[todo.priority].completedCount++;
      }
    }

    // Group by agent
    const byAgentMap = new Map<number, { agentId: number; agentName: string; total: number; completed: number; overdue: number }>();
    for (const todo of todos) {
      const agentId = todo.assignedToId || todo.agentId;
      if (agentId) {
        if (!byAgentMap.has(agentId)) {
          byAgentMap.set(agentId, {
            agentId,
            agentName: todo.assignedToName || todo.agentName || '',
            total: 0,
            completed: 0,
            overdue: 0,
          });
        }
        const entry = byAgentMap.get(agentId)!;
        entry.total++;
        if (todo.status === 'completed') entry.completed++;
        if (todo.dueDate && todo.dueDate < today && todo.status !== 'completed' && todo.status !== 'cancelled') {
          entry.overdue++;
        }
      }
    }

    // Group by group
    const byGroupMap = new Map<number, { groupId: number; groupName: string; total: number; completed: number }>();
    for (const todo of todos) {
      if (todo.groupId) {
        if (!byGroupMap.has(todo.groupId)) {
          byGroupMap.set(todo.groupId, {
            groupId: todo.groupId,
            groupName: todo.groupName || '',
            total: 0,
            completed: 0,
          });
        }
        const entry = byGroupMap.get(todo.groupId)!;
        entry.total++;
        if (todo.status === 'completed') entry.completed++;
      }
    }

    return {
      total: todos.length,
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      dueThisWeek: dueThisWeek.length,
      byPriority: Object.entries(priorityGroups).map(([priority, data]) => ({
        priority: priority as ToDoPriority,
        count: data.count,
        completedCount: data.completedCount,
      })),
      byAgent: Array.from(byAgentMap.values()),
      byGroup: Array.from(byGroupMap.values()),
    };
  }
}

/**
 * Service for managing todo groups.
 */
export class ToDoGroupService extends BaseService<ToDoGroup, ToDoGroupApiResponse> {
  protected endpoint = '/ToDoGroup';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: ToDoGroupApiResponse): ToDoGroup {
    return transformToDoGroup(data);
  }

  /**
   * List groups for an agent.
   */
  async listForAgent(agentId: number, includeShared: boolean = true): Promise<ToDoGroup[]> {
    const groups = await this.list({ agent_id: agentId });
    if (includeShared) {
      const sharedGroups = await this.list({ is_shared: true });
      return [...groups, ...sharedGroups.filter(g => !groups.some(ag => ag.id === g.id))];
    }
    return groups;
  }

  /**
   * Create a new group.
   */
  async createGroup(data: {
    name: string;
    description?: string;
    color?: string;
    agentId?: number;
    isShared?: boolean;
  }): Promise<ToDoGroup> {
    const groupData: Record<string, unknown> = {
      name: data.name,
      is_shared: data.isShared ?? false,
    };

    if (data.description) groupData.description = data.description;
    if (data.color) groupData.color = data.color;
    if (data.agentId) groupData.agent_id = data.agentId;

    const groups = await this.create([groupData as Partial<ToDoGroup>]);
    if (groups.length === 0) {
      throw new Error('Failed to create todo group');
    }
    return groups[0];
  }
}
