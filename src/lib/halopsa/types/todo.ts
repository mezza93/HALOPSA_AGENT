/**
 * ToDo/Task types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * ToDo priority level.
 */
export type ToDoPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * ToDo status.
 */
export type ToDoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';

/**
 * ToDo entity - represents a task.
 */
export interface ToDo extends HaloBaseEntity {
  title: string;
  description?: string;
  priority: ToDoPriority;
  status: ToDoStatus;
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  ticketId?: number;
  ticketNumber?: string;
  clientId?: number;
  clientName?: string;
  projectId?: number;
  projectName?: string;
  agentId?: number;
  agentName?: string;
  assignedToId?: number;
  assignedToName?: string;
  groupId?: number;
  groupName?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  isRecurring: boolean;
  recurrencePattern?: string;
  parentToDoId?: number;
  order?: number;
  tags?: string[];
  isPrivate: boolean;
  reminderDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw ToDo from API.
 */
export interface ToDoApiResponse {
  id: number;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  due_time?: string;
  completed_at?: string;
  ticket_id?: number;
  ticket_number?: string;
  client_id?: number;
  client_name?: string;
  project_id?: number;
  project_name?: string;
  agent_id?: number;
  agent_name?: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
  group_id?: number;
  group_name?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  parent_todo_id?: number;
  order?: number;
  tags?: string[];
  is_private?: boolean;
  reminder_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * ToDo group for organizing tasks.
 */
export interface ToDoGroup extends HaloBaseEntity {
  name: string;
  description?: string;
  color?: string;
  agentId?: number;
  agentName?: string;
  isShared: boolean;
  order?: number;
  taskCount?: number;
  completedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw ToDo group from API.
 */
export interface ToDoGroupApiResponse {
  id: number;
  name?: string;
  description?: string;
  color?: string;
  agent_id?: number;
  agent_name?: string;
  is_shared?: boolean;
  order?: number;
  task_count?: number;
  completed_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * ToDo summary statistics.
 */
export interface ToDoSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  byPriority: {
    priority: ToDoPriority;
    count: number;
    completedCount: number;
  }[];
  byAgent?: {
    agentId: number;
    agentName: string;
    total: number;
    completed: number;
    overdue: number;
  }[];
  byGroup?: {
    groupId: number;
    groupName: string;
    total: number;
    completed: number;
  }[];
}

/**
 * Transform API response to ToDo interface.
 */
export function transformToDo(data: ToDoApiResponse): ToDo {
  const priorityMap: Record<string, ToDoPriority> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    urgent: 'urgent',
  };

  const statusMap: Record<string, ToDoStatus> = {
    pending: 'pending',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    deferred: 'deferred',
  };

  return {
    id: data.id,
    title: data.title || '',
    description: data.description,
    priority: priorityMap[data.priority || ''] || 'medium',
    status: statusMap[data.status || ''] || 'pending',
    dueDate: data.due_date,
    dueTime: data.due_time,
    completedAt: data.completed_at,
    ticketId: data.ticket_id,
    ticketNumber: data.ticket_number,
    clientId: data.client_id,
    clientName: data.client_name,
    projectId: data.project_id,
    projectName: data.project_name,
    agentId: data.agent_id,
    agentName: data.agent_name,
    assignedToId: data.assigned_to_id,
    assignedToName: data.assigned_to_name,
    groupId: data.group_id,
    groupName: data.group_name,
    estimatedMinutes: data.estimated_minutes,
    actualMinutes: data.actual_minutes,
    isRecurring: data.is_recurring ?? false,
    recurrencePattern: data.recurrence_pattern,
    parentToDoId: data.parent_todo_id,
    order: data.order,
    tags: data.tags,
    isPrivate: data.is_private ?? false,
    reminderDate: data.reminder_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to ToDoGroup interface.
 */
export function transformToDoGroup(data: ToDoGroupApiResponse): ToDoGroup {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    color: data.color,
    agentId: data.agent_id,
    agentName: data.agent_name,
    isShared: data.is_shared ?? false,
    order: data.order,
    taskCount: data.task_count,
    completedCount: data.completed_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
