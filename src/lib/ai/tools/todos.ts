/**
 * ToDo/Task AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { ToDo, ToDoGroup } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createToDoTools(ctx: HaloContext) {
  return {
    // === TODO OPERATIONS ===
    listToDos: tool({
      description: 'List todos/tasks with optional filters.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        assignedToId: z.number().optional().describe('Filter by assignee ID'),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'deferred']).optional().describe('Filter by status'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Filter by priority'),
        groupId: z.number().optional().describe('Filter by group ID'),
        ticketId: z.number().optional().describe('Filter by ticket ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        projectId: z.number().optional().describe('Filter by project ID'),
        overdue: z.boolean().optional().describe('Only show overdue todos'),
        search: z.string().optional().describe('Search todos'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, assignedToId, status, priority, groupId, ticketId, clientId, projectId, overdue, search, count }) => {
        try {
          const todos = await ctx.todos.listFiltered({
            agentId,
            assignedToId,
            status,
            priority,
            groupId,
            ticketId,
            clientId,
            projectId,
            overdue,
            search,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: todos.length,
            data: todos.map((t: ToDo) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              status: t.status,
              dueDate: t.dueDate,
              assignee: t.assignedToName,
              group: t.groupName,
              ticketId: t.ticketId,
            })),
          };
        } catch (error) {
          return formatError(error, 'listToDos');
        }
      },
    }),

    getToDo: tool({
      description: 'Get detailed information about a todo.',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
      }),
      execute: async ({ todoId }) => {
        try {
          const todo = await ctx.todos.get(todoId);
          return {
            success: true,
            id: todo.id,
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            status: todo.status,
            dueDate: todo.dueDate,
            dueTime: todo.dueTime,
            assignee: todo.assignedToName,
            assigneeId: todo.assignedToId,
            group: todo.groupName,
            groupId: todo.groupId,
            ticketId: todo.ticketId,
            ticketNumber: todo.ticketNumber,
            client: todo.clientName,
            project: todo.projectName,
            estimatedMinutes: todo.estimatedMinutes,
            actualMinutes: todo.actualMinutes,
            completedAt: todo.completedAt,
            tags: todo.tags,
          };
        } catch (error) {
          return formatError(error, 'getToDo');
        }
      },
    }),

    createToDo: tool({
      description: 'Create a new todo/task.',
      parameters: z.object({
        title: z.string().describe('Todo title'),
        description: z.string().optional().describe('Todo description'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium').describe('Priority level'),
        dueDate: z.string().optional().describe('Due date (YYYY-MM-DD)'),
        dueTime: z.string().optional().describe('Due time (HH:MM)'),
        agentId: z.number().optional().describe('Owner agent ID'),
        assignedToId: z.number().optional().describe('Assignee ID'),
        ticketId: z.number().optional().describe('Related ticket ID'),
        clientId: z.number().optional().describe('Related client ID'),
        projectId: z.number().optional().describe('Related project ID'),
        groupId: z.number().optional().describe('Group ID'),
        estimatedMinutes: z.number().optional().describe('Estimated time in minutes'),
        tags: z.array(z.string()).optional().describe('Tags'),
        isPrivate: z.boolean().optional().describe('Whether todo is private'),
        reminderDate: z.string().optional().describe('Reminder date (ISO format)'),
      }),
      execute: async ({ title, description, priority, dueDate, dueTime, agentId, assignedToId, ticketId, clientId, projectId, groupId, estimatedMinutes, tags, isPrivate, reminderDate }) => {
        try {
          const todo = await ctx.todos.createToDo({
            title,
            description,
            priority,
            dueDate,
            dueTime,
            agentId,
            assignedToId,
            ticketId,
            clientId,
            projectId,
            groupId,
            estimatedMinutes,
            tags,
            isPrivate,
            reminderDate,
          });

          return {
            success: true,
            todoId: todo.id,
            title: todo.title,
            message: `Todo "${todo.title}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createToDo');
        }
      },
    }),

    startToDo: tool({
      description: 'Start working on a todo (mark as in progress).',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
      }),
      execute: async ({ todoId }) => {
        try {
          const todo = await ctx.todos.start(todoId);
          return {
            success: true,
            todoId: todo.id,
            status: todo.status,
            message: `Started working on "${todo.title}"`,
          };
        } catch (error) {
          return formatError(error, 'startToDo');
        }
      },
    }),

    completeToDo: tool({
      description: 'Complete a todo.',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
        actualMinutes: z.number().optional().describe('Actual time spent in minutes'),
      }),
      execute: async ({ todoId, actualMinutes }) => {
        try {
          const todo = await ctx.todos.complete(todoId, actualMinutes);
          return {
            success: true,
            todoId: todo.id,
            status: todo.status,
            completedAt: todo.completedAt,
            message: `Completed "${todo.title}"`,
          };
        } catch (error) {
          return formatError(error, 'completeToDo');
        }
      },
    }),

    deferToDo: tool({
      description: 'Defer a todo to a later date.',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
        newDueDate: z.string().optional().describe('New due date (YYYY-MM-DD)'),
      }),
      execute: async ({ todoId, newDueDate }) => {
        try {
          const todo = await ctx.todos.defer(todoId, newDueDate);
          return {
            success: true,
            todoId: todo.id,
            status: todo.status,
            dueDate: todo.dueDate,
            message: `Todo deferred${newDueDate ? ` to ${newDueDate}` : ''}`,
          };
        } catch (error) {
          return formatError(error, 'deferToDo');
        }
      },
    }),

    cancelToDo: tool({
      description: 'Cancel a todo.',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
      }),
      execute: async ({ todoId }) => {
        try {
          const todo = await ctx.todos.cancel(todoId);
          return {
            success: true,
            todoId: todo.id,
            status: todo.status,
            message: `Todo "${todo.title}" cancelled`,
          };
        } catch (error) {
          return formatError(error, 'cancelToDo');
        }
      },
    }),

    reassignToDo: tool({
      description: 'Reassign a todo to another person.',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
        newAssigneeId: z.number().describe('New assignee ID'),
      }),
      execute: async ({ todoId, newAssigneeId }) => {
        try {
          const todo = await ctx.todos.reassign(todoId, newAssigneeId);
          return {
            success: true,
            todoId: todo.id,
            assignee: todo.assignedToName,
            message: `Todo reassigned to ${todo.assignedToName}`,
          };
        } catch (error) {
          return formatError(error, 'reassignToDo');
        }
      },
    }),

    setToDoPriority: tool({
      description: 'Change the priority of a todo.',
      parameters: z.object({
        todoId: z.number().describe('The todo ID'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('New priority level'),
      }),
      execute: async ({ todoId, priority }) => {
        try {
          const todo = await ctx.todos.setPriority(todoId, priority);
          return {
            success: true,
            todoId: todo.id,
            priority: todo.priority,
            message: `Priority updated to ${todo.priority}`,
          };
        } catch (error) {
          return formatError(error, 'setToDoPriority');
        }
      },
    }),

    getDueTodayToDos: tool({
      description: 'Get todos due today.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
      }),
      execute: async ({ agentId }) => {
        try {
          const todos = await ctx.todos.getDueToday(agentId);

          return {
            success: true,
            count: todos.length,
            data: todos.map((t: ToDo) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueTime: t.dueTime,
              assignee: t.assignedToName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getDueTodayToDos');
        }
      },
    }),

    getOverdueToDos: tool({
      description: 'Get overdue todos.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
      }),
      execute: async ({ agentId }) => {
        try {
          const todos = await ctx.todos.getOverdue(agentId);

          return {
            success: true,
            count: todos.length,
            data: todos.map((t: ToDo) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.dueDate,
              assignee: t.assignedToName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getOverdueToDos');
        }
      },
    }),

    getUpcomingToDos: tool({
      description: 'Get upcoming todos for the next N days.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        days: z.number().optional().default(7).describe('Number of days to look ahead'),
      }),
      execute: async ({ agentId, days }) => {
        try {
          const todos = await ctx.todos.getUpcoming(agentId, days);

          return {
            success: true,
            count: todos.length,
            data: todos.map((t: ToDo) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.dueDate,
              status: t.status,
            })),
          };
        } catch (error) {
          return formatError(error, 'getUpcomingToDos');
        }
      },
    }),

    getToDoSummary: tool({
      description: 'Get todo statistics and summary.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        teamId: z.number().optional().describe('Filter by team ID'),
      }),
      execute: async ({ agentId, teamId }) => {
        try {
          const summary = await ctx.todos.getSummary({ agentId, teamId });

          return {
            success: true,
            total: summary.total,
            pending: summary.pending,
            inProgress: summary.inProgress,
            completed: summary.completed,
            overdue: summary.overdue,
            dueToday: summary.dueToday,
            dueThisWeek: summary.dueThisWeek,
            byPriority: summary.byPriority,
            byAgent: summary.byAgent?.slice(0, 10),
          };
        } catch (error) {
          return formatError(error, 'getToDoSummary');
        }
      },
    }),

    // === TODO GROUP OPERATIONS ===
    listToDoGroups: tool({
      description: 'List todo groups for an agent.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        includeShared: z.boolean().optional().default(true).describe('Include shared groups'),
      }),
      execute: async ({ agentId, includeShared }) => {
        try {
          const groups = await ctx.todoGroups.listForAgent(agentId, includeShared);

          return {
            success: true,
            count: groups.length,
            data: groups.map((g: ToDoGroup) => ({
              id: g.id,
              name: g.name,
              color: g.color,
              isShared: g.isShared,
              taskCount: g.taskCount,
              completedCount: g.completedCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listToDoGroups');
        }
      },
    }),

    createToDoGroup: tool({
      description: 'Create a new todo group.',
      parameters: z.object({
        name: z.string().describe('Group name'),
        description: z.string().optional().describe('Group description'),
        color: z.string().optional().describe('Group color (hex)'),
        agentId: z.number().optional().describe('Owner agent ID'),
        isShared: z.boolean().optional().describe('Whether group is shared'),
      }),
      execute: async ({ name, description, color, agentId, isShared }) => {
        try {
          const group = await ctx.todoGroups.createGroup({
            name,
            description,
            color,
            agentId,
            isShared,
          });

          return {
            success: true,
            groupId: group.id,
            name: group.name,
            message: `Group "${group.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createToDoGroup');
        }
      },
    }),
  };
}
