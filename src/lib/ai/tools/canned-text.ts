/**
 * Canned Text/Quick Response AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { CannedText, CannedTextCategory, CannedTextVariable } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createCannedTextTools(ctx: HaloContext) {
  return {
    // === CANNED TEXT OPERATIONS ===
    listCannedTexts: tool({
      description: 'List canned text/quick response templates.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        teamId: z.number().optional().describe('Filter by team ID'),
        categoryId: z.number().optional().describe('Filter by category ID'),
        scope: z.enum(['ticket', 'email', 'chat', 'note', 'all']).optional().describe('Filter by scope'),
        isGlobal: z.boolean().optional().describe('Filter global templates only'),
        search: z.string().optional().describe('Search canned texts'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, teamId, categoryId, scope, isGlobal, search, count }) => {
        try {
          const texts = await ctx.cannedTexts.listFiltered({
            agentId,
            teamId,
            categoryId,
            scope,
            isGlobal,
            search,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: texts.length,
            data: texts.map((t: CannedText) => ({
              id: t.id,
              name: t.name,
              shortcut: t.shortcut,
              scope: t.scope,
              category: t.categoryName,
              isGlobal: t.isGlobal,
              usageCount: t.usageCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCannedTexts');
        }
      },
    }),

    getCannedText: tool({
      description: 'Get a canned text template with its content.',
      parameters: z.object({
        cannedTextId: z.number().describe('The canned text ID'),
      }),
      execute: async ({ cannedTextId }) => {
        try {
          const text = await ctx.cannedTexts.get(cannedTextId);
          return {
            success: true,
            id: text.id,
            name: text.name,
            shortcut: text.shortcut,
            content: text.content,
            htmlContent: text.htmlContent,
            scope: text.scope,
            category: text.categoryName,
            isGlobal: text.isGlobal,
            variables: text.variables,
            usageCount: text.usageCount,
            lastUsedAt: text.lastUsedAt,
          };
        } catch (error) {
          return formatError(error, 'getCannedText');
        }
      },
    }),

    getAvailableCannedTexts: tool({
      description: 'Get all canned texts available to an agent (personal + team + global).',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        teamId: z.number().optional().describe('Team ID'),
      }),
      execute: async ({ agentId, teamId }) => {
        try {
          const texts = await ctx.cannedTexts.getAvailableForAgent(agentId, teamId);

          return {
            success: true,
            count: texts.length,
            data: texts.map((t: CannedText) => ({
              id: t.id,
              name: t.name,
              shortcut: t.shortcut,
              scope: t.scope,
              category: t.categoryName,
              isGlobal: t.isGlobal,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAvailableCannedTexts');
        }
      },
    }),

    searchCannedTexts: tool({
      description: 'Search canned texts by content or name.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        scope: z.enum(['ticket', 'email', 'chat', 'note', 'all']).optional().describe('Filter by scope'),
      }),
      execute: async ({ query, scope }) => {
        try {
          const texts = await ctx.cannedTexts.search(query, scope);

          return {
            success: true,
            count: texts.length,
            data: texts.map((t: CannedText) => ({
              id: t.id,
              name: t.name,
              shortcut: t.shortcut,
              scope: t.scope,
              preview: t.content.substring(0, 100) + (t.content.length > 100 ? '...' : ''),
            })),
          };
        } catch (error) {
          return formatError(error, 'searchCannedTexts');
        }
      },
    }),

    findCannedTextByShortcut: tool({
      description: 'Find a canned text by its shortcut code.',
      parameters: z.object({
        shortcut: z.string().describe('Shortcut code'),
        agentId: z.number().optional().describe('Agent ID to check available texts'),
      }),
      execute: async ({ shortcut, agentId }) => {
        try {
          const text = await ctx.cannedTexts.findByShortcut(shortcut, agentId);

          if (!text) {
            return {
              success: true,
              found: false,
              message: `No canned text found with shortcut "${shortcut}"`,
            };
          }

          return {
            success: true,
            found: true,
            id: text.id,
            name: text.name,
            shortcut: text.shortcut,
            content: text.content,
            scope: text.scope,
          };
        } catch (error) {
          return formatError(error, 'findCannedTextByShortcut');
        }
      },
    }),

    createCannedText: tool({
      description: 'Create a new canned text template.',
      parameters: z.object({
        name: z.string().describe('Template name'),
        content: z.string().describe('Template content (can include variables like {{ticket.id}})'),
        shortcut: z.string().optional().describe('Shortcut code for quick access'),
        scope: z.enum(['ticket', 'email', 'chat', 'note', 'all']).optional().default('all').describe('Where this template can be used'),
        categoryId: z.number().optional().describe('Category ID'),
        agentId: z.number().optional().describe('Owner agent ID (for personal templates)'),
        teamId: z.number().optional().describe('Team ID (for team templates)'),
        isGlobal: z.boolean().optional().describe('Whether template is available to everyone'),
        htmlContent: z.string().optional().describe('HTML version of content'),
      }),
      execute: async ({ name, content, shortcut, scope, categoryId, agentId, teamId, isGlobal, htmlContent }) => {
        try {
          const text = await ctx.cannedTexts.createCannedText({
            name,
            content,
            shortcut,
            scope,
            categoryId,
            agentId,
            teamId,
            isGlobal,
            htmlContent,
          });

          return {
            success: true,
            cannedTextId: text.id,
            name: text.name,
            shortcut: text.shortcut,
            message: `Canned text "${text.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createCannedText');
        }
      },
    }),

    expandCannedText: tool({
      description: 'Get canned text content with variables replaced.',
      parameters: z.object({
        cannedTextId: z.number().describe('Canned text ID'),
        variables: z.record(z.string()).describe('Variables to replace (e.g., {"ticket.id": "12345", "client.name": "Acme"})'),
      }),
      execute: async ({ cannedTextId, variables }) => {
        try {
          const content = await ctx.cannedTexts.getExpandedContent(cannedTextId, variables);

          return {
            success: true,
            cannedTextId,
            expandedContent: content,
          };
        } catch (error) {
          return formatError(error, 'expandCannedText');
        }
      },
    }),

    expandShortcut: tool({
      description: 'Expand a shortcut to its content with variables replaced.',
      parameters: z.object({
        shortcut: z.string().describe('Shortcut code'),
        variables: z.record(z.string()).describe('Variables to replace'),
        agentId: z.number().optional().describe('Agent ID to check available texts'),
      }),
      execute: async ({ shortcut, variables, agentId }) => {
        try {
          const content = await ctx.cannedTexts.expandShortcut(shortcut, variables, agentId);

          if (!content) {
            return {
              success: false,
              error: `No canned text found with shortcut "${shortcut}"`,
            };
          }

          return {
            success: true,
            shortcut,
            expandedContent: content,
          };
        } catch (error) {
          return formatError(error, 'expandShortcut');
        }
      },
    }),

    getMostUsedCannedTexts: tool({
      description: 'Get most frequently used canned texts.',
      parameters: z.object({
        count: z.number().optional().default(10).describe('Number to return'),
        agentId: z.number().optional().describe('Filter by agent ID'),
      }),
      execute: async ({ count, agentId }) => {
        try {
          const texts = await ctx.cannedTexts.getMostUsed(count, agentId);

          return {
            success: true,
            count: texts.length,
            data: texts.map((t: CannedText) => ({
              id: t.id,
              name: t.name,
              shortcut: t.shortcut,
              usageCount: t.usageCount,
              scope: t.scope,
            })),
          };
        } catch (error) {
          return formatError(error, 'getMostUsedCannedTexts');
        }
      },
    }),

    getRecentlyUsedCannedTexts: tool({
      description: 'Get recently used canned texts.',
      parameters: z.object({
        count: z.number().optional().default(10).describe('Number to return'),
        agentId: z.number().optional().describe('Filter by agent ID'),
      }),
      execute: async ({ count, agentId }) => {
        try {
          const texts = await ctx.cannedTexts.getRecentlyUsed(count, agentId);

          return {
            success: true,
            count: texts.length,
            data: texts.map((t: CannedText) => ({
              id: t.id,
              name: t.name,
              shortcut: t.shortcut,
              lastUsedAt: t.lastUsedAt,
              scope: t.scope,
            })),
          };
        } catch (error) {
          return formatError(error, 'getRecentlyUsedCannedTexts');
        }
      },
    }),

    getAvailableVariables: tool({
      description: 'Get available variables that can be used in canned text templates.',
      parameters: z.object({
        scope: z.enum(['ticket', 'email', 'chat', 'note', 'all']).optional().describe('Filter by scope'),
      }),
      execute: async ({ scope }) => {
        try {
          const variables = ctx.cannedTexts.getAvailableVariables(scope);

          return {
            success: true,
            count: variables.length,
            data: variables.map((v: CannedTextVariable) => ({
              name: v.name,
              displayName: v.displayName,
              description: v.description,
              scope: v.scope,
              example: v.example,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAvailableVariables');
        }
      },
    }),

    validateCannedTextVariables: tool({
      description: 'Validate that all variables in content are valid.',
      parameters: z.object({
        content: z.string().describe('Content to validate'),
      }),
      execute: async ({ content }) => {
        try {
          const result = ctx.cannedTexts.validateVariables(content);

          return {
            success: true,
            valid: result.valid,
            unknownVariables: result.unknownVariables,
            message: result.valid
              ? 'All variables are valid'
              : `Unknown variables found: ${result.unknownVariables.join(', ')}`,
          };
        } catch (error) {
          return formatError(error, 'validateCannedTextVariables');
        }
      },
    }),

    // === CANNED TEXT CATEGORY OPERATIONS ===
    listCannedTextCategories: tool({
      description: 'List canned text categories.',
      parameters: z.object({
        activeOnly: z.boolean().optional().default(true).describe('Only show active categories'),
      }),
      execute: async ({ activeOnly }) => {
        try {
          const categories = activeOnly
            ? await ctx.cannedTextCategories.listActive()
            : await ctx.cannedTextCategories.list();

          return {
            success: true,
            count: categories.length,
            data: categories.map((c: CannedTextCategory) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              parentId: c.parentId,
              textCount: c.textCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCannedTextCategories');
        }
      },
    }),

    getCannedTextCategoryTree: tool({
      description: 'Get canned text categories in a tree structure.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const tree = await ctx.cannedTextCategories.getCategoryTree();

          return {
            success: true,
            data: tree.map((parent: CannedTextCategory & { children: CannedTextCategory[] }) => ({
              id: parent.id,
              name: parent.name,
              children: parent.children.map((child: CannedTextCategory) => ({
                id: child.id,
                name: child.name,
              })),
            })),
          };
        } catch (error) {
          return formatError(error, 'getCannedTextCategoryTree');
        }
      },
    }),

    createCannedTextCategory: tool({
      description: 'Create a new canned text category.',
      parameters: z.object({
        name: z.string().describe('Category name'),
        description: z.string().optional().describe('Category description'),
        parentId: z.number().optional().describe('Parent category ID'),
        order: z.number().optional().describe('Display order'),
      }),
      execute: async ({ name, description, parentId, order }) => {
        try {
          const category = await ctx.cannedTextCategories.createCategory({
            name,
            description,
            parentId,
            order,
          });

          return {
            success: true,
            categoryId: category.id,
            name: category.name,
            message: `Category "${category.name}" created successfully`,
          };
        } catch (error) {
          return formatError(error, 'createCannedTextCategory');
        }
      },
    }),
  };
}
