/**
 * Global Search AI tools for HaloPSA.
 * Phase 4: Productivity & Automation
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { SavedSearch, RecentSearch, SearchResultGroup, SearchResult } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

const searchEntityTypeSchema = z.enum([
  'ticket', 'client', 'site', 'user', 'agent', 'asset', 'contract',
  'invoice', 'opportunity', 'quotation', 'project', 'kb_article',
  'attachment', 'service', 'product', 'supplier', 'all',
]);

export function createSearchTools(ctx: HaloContext) {
  return {
    // === GLOBAL SEARCH ===
    globalSearch: tool({
      description: 'Perform a global search across all or specific entity types.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        entityTypes: z.array(searchEntityTypeSchema).optional().describe('Entity types to search (default: all)'),
        count: z.number().optional().default(20).describe('Max results per entity type'),
        includeHighlights: z.boolean().optional().default(true).describe('Include text highlights'),
      }),
      execute: async ({ query, entityTypes, count, includeHighlights }) => {
        try {
          const response = await ctx.search.search({
            query,
            entityTypes,
            pageSize: count,
            includeHighlights,
            includeFacets: true,
          });

          return {
            success: true,
            query: response.query,
            totalCount: response.totalCount,
            took: response.took,
            didYouMean: response.didYouMean,
            suggestions: response.suggestions,
            groups: response.groups.map((g: SearchResultGroup) => ({
              type: g.entityType,
              typeName: g.entityTypeName,
              count: g.count,
              results: g.results.slice(0, 10).map((r: SearchResult) => ({
                id: r.entityId,
                title: r.title,
                subtitle: r.subtitle,
                description: r.description?.substring(0, 200),
                url: r.url,
                score: r.relevance.score,
              })),
            })),
          };
        } catch (error) {
          return formatError(error, 'globalSearch');
        }
      },
    }),

    quickSearch: tool({
      description: 'Quick search across all entities (for autocomplete/typeahead).',
      parameters: z.object({
        query: z.string().describe('Search query'),
        limit: z.number().optional().default(10).describe('Max results'),
      }),
      execute: async ({ query, limit }) => {
        try {
          const results = await ctx.search.quickSearch(query, limit);

          return {
            success: true,
            count: results.length,
            results: results.map((r: SearchResult) => ({
              type: r.entityType,
              id: r.entityId,
              title: r.title,
              subtitle: r.subtitle,
              url: r.url,
            })),
          };
        } catch (error) {
          return formatError(error, 'quickSearch');
        }
      },
    }),

    searchTickets: tool({
      description: 'Search tickets specifically.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        clientId: z.number().optional().describe('Filter by client'),
        agentId: z.number().optional().describe('Filter by agent'),
        statusId: z.number().optional().describe('Filter by status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ query, clientId, agentId, statusId, count }) => {
        try {
          const results = await ctx.search.searchTickets(query, {
            pageSize: count,
            filters: {
              clientId,
              agentId,
              statusId,
            },
          });

          return {
            success: true,
            count: results.length,
            tickets: results.map((r: SearchResult) => ({
              id: r.entityId,
              title: r.title,
              description: r.description?.substring(0, 200),
              url: r.url,
              score: r.relevance.score,
              matchedFields: r.relevance.matchedFields,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchTickets');
        }
      },
    }),

    searchClients: tool({
      description: 'Search clients specifically.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ query, count }) => {
        try {
          const results = await ctx.search.searchClients(query, { pageSize: count });

          return {
            success: true,
            count: results.length,
            clients: results.map((r: SearchResult) => ({
              id: r.entityId,
              name: r.title,
              description: r.subtitle,
              url: r.url,
              score: r.relevance.score,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchClients');
        }
      },
    }),

    searchAssets: tool({
      description: 'Search assets specifically.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        clientId: z.number().optional().describe('Filter by client'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ query, clientId, count }) => {
        try {
          const results = await ctx.search.searchAssets(query, {
            pageSize: count,
            filters: { clientId },
          });

          return {
            success: true,
            count: results.length,
            assets: results.map((r: SearchResult) => ({
              id: r.entityId,
              name: r.title,
              type: r.subtitle,
              url: r.url,
              score: r.relevance.score,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchAssets');
        }
      },
    }),

    searchKnowledgeBase: tool({
      description: 'Search knowledge base articles.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ query, count }) => {
        try {
          const results = await ctx.search.searchKnowledgeBase(query, { pageSize: count });

          return {
            success: true,
            count: results.length,
            articles: results.map((r: SearchResult) => ({
              id: r.entityId,
              title: r.title,
              summary: r.description?.substring(0, 300),
              url: r.url,
              score: r.relevance.score,
              highlights: r.relevance.highlights,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchKnowledgeBase');
        }
      },
    }),

    getSearchSuggestions: tool({
      description: 'Get search suggestions for a partial query.',
      parameters: z.object({
        query: z.string().describe('Partial search query'),
        limit: z.number().optional().default(10).describe('Max suggestions'),
      }),
      execute: async ({ query, limit }) => {
        try {
          const suggestions = await ctx.search.getSuggestions(query, limit);

          return {
            success: true,
            query,
            suggestions,
          };
        } catch (error) {
          return formatError(error, 'getSearchSuggestions');
        }
      },
    }),

    // === SAVED SEARCHES ===
    listSavedSearches: tool({
      description: 'List saved searches.',
      parameters: z.object({
        publicOnly: z.boolean().optional().describe('Only show public searches'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ publicOnly, count }) => {
        try {
          const searches = publicOnly
            ? await ctx.savedSearches.getPublic({ pageSize: count })
            : await ctx.savedSearches.list({ pageSize: count });

          return {
            success: true,
            count: searches.length,
            searches: searches.map((s: SavedSearch) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              query: s.query,
              entityTypes: s.entityTypes,
              isPublic: s.isPublic,
              isDefault: s.isDefault,
              useCount: s.useCount,
              lastUsed: s.lastUsedAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'listSavedSearches');
        }
      },
    }),

    getSavedSearch: tool({
      description: 'Get details of a saved search.',
      parameters: z.object({
        searchId: z.number().describe('The saved search ID'),
      }),
      execute: async ({ searchId }) => {
        try {
          const search = await ctx.savedSearches.get(searchId);

          return {
            success: true,
            id: search.id,
            name: search.name,
            description: search.description,
            query: search.query,
            entityTypes: search.entityTypes,
            filters: search.filters,
            sortBy: search.sortBy,
            sortOrder: search.sortOrder,
            isPublic: search.isPublic,
            isDefault: search.isDefault,
            useCount: search.useCount,
          };
        } catch (error) {
          return formatError(error, 'getSavedSearch');
        }
      },
    }),

    executeSavedSearch: tool({
      description: 'Execute a saved search.',
      parameters: z.object({
        searchId: z.number().describe('The saved search ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ searchId, count }) => {
        try {
          const response = await ctx.savedSearches.execute(searchId, { pageSize: count });

          return {
            success: true,
            query: response.query,
            totalCount: response.totalCount,
            took: response.took,
            groups: response.groups.map((g: SearchResultGroup) => ({
              type: g.entityType,
              count: g.count,
              results: g.results.slice(0, 10).map((r: SearchResult) => ({
                id: r.entityId,
                title: r.title,
                url: r.url,
              })),
            })),
          };
        } catch (error) {
          return formatError(error, 'executeSavedSearch');
        }
      },
    }),

    createSavedSearch: tool({
      description: 'Save a search for later use.',
      parameters: z.object({
        name: z.string().describe('Search name'),
        description: z.string().optional().describe('Search description'),
        query: z.string().describe('Search query'),
        entityTypes: z.array(searchEntityTypeSchema).optional().describe('Entity types to search'),
        isPublic: z.boolean().optional().default(false).describe('Make search public'),
      }),
      execute: async ({ name, description, query, entityTypes, isPublic }) => {
        try {
          const search = await ctx.savedSearches.create({
            name,
            description,
            query,
            entityTypes,
            isPublic,
          });

          return {
            success: true,
            message: `Saved search "${search.name}" created`,
            searchId: search.id,
          };
        } catch (error) {
          return formatError(error, 'createSavedSearch');
        }
      },
    }),

    deleteSavedSearch: tool({
      description: 'Delete a saved search.',
      parameters: z.object({
        searchId: z.number().describe('The saved search ID'),
      }),
      execute: async ({ searchId }) => {
        try {
          await ctx.savedSearches.delete(searchId);
          return {
            success: true,
            message: `Saved search ${searchId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteSavedSearch');
        }
      },
    }),

    // === RECENT SEARCHES ===
    listRecentSearches: tool({
      description: 'List recent searches.',
      parameters: z.object({
        limit: z.number().optional().default(10).describe('Max results'),
      }),
      execute: async ({ limit }) => {
        try {
          const searches = await ctx.recentSearches.getMyRecent(limit);

          return {
            success: true,
            count: searches.length,
            searches: searches.map((s: RecentSearch) => ({
              id: s.id,
              query: s.query,
              entityTypes: s.entityTypes,
              resultCount: s.resultCount,
              searchedAt: s.searchedAt,
            })),
          };
        } catch (error) {
          return formatError(error, 'listRecentSearches');
        }
      },
    }),

    clearRecentSearches: tool({
      description: 'Clear recent search history.',
      parameters: z.object({}),
      execute: async () => {
        try {
          await ctx.recentSearches.clearMyRecent();
          return {
            success: true,
            message: 'Recent search history cleared',
          };
        } catch (error) {
          return formatError(error, 'clearRecentSearches');
        }
      },
    }),

    // === ENTITY TYPES ===
    getSearchableEntityTypes: tool({
      description: 'Get available searchable entity types with counts.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const types = await ctx.search.getEntityTypes();

          return {
            success: true,
            types: types.map((t: { type: string; label: string; count: number }) => ({
              type: t.type,
              label: t.label,
              count: t.count,
            })),
          };
        } catch (error) {
          return formatError(error, 'getSearchableEntityTypes');
        }
      },
    }),
  };
}
