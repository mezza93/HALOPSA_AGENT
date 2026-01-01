/**
 * HaloPSA Global Search types.
 * Phase 4: Productivity & Automation
 */

import { HaloBaseEntity } from './common';

// ==========================================
// Search Types
// ==========================================

/**
 * Searchable entity types in HaloPSA.
 */
export type SearchEntityType =
  | 'ticket'
  | 'client'
  | 'site'
  | 'user'
  | 'agent'
  | 'asset'
  | 'contract'
  | 'invoice'
  | 'opportunity'
  | 'quotation'
  | 'project'
  | 'kb_article'
  | 'attachment'
  | 'service'
  | 'product'
  | 'supplier'
  | 'all';

/**
 * Search result relevance scoring.
 */
export interface SearchRelevance {
  score: number;
  matchedFields: string[];
  highlights?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Individual search result item.
 */
export interface SearchResult {
  entityType: SearchEntityType;
  entityId: number;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  relevance: SearchRelevance;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Search result as returned by API.
 */
export interface SearchResultAPI {
  entity_type: SearchEntityType;
  entity_id: number;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  relevance: {
    score: number;
    matched_fields: string[];
    highlights?: Record<string, string[]>;
  };
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Grouped search results by entity type.
 */
export interface SearchResultGroup {
  entityType: SearchEntityType;
  entityTypeName: string;
  count: number;
  results: SearchResult[];
  [key: string]: unknown;
}

/**
 * Complete search response.
 */
export interface SearchResponse {
  query: string;
  totalCount: number;
  took: number;
  groups: SearchResultGroup[];
  suggestions?: string[];
  didYouMean?: string;
  facets?: SearchFacets;
  [key: string]: unknown;
}

/**
 * Search response as returned by API.
 */
export interface SearchResponseAPI {
  query: string;
  total_count: number;
  took: number;
  groups: {
    entity_type: SearchEntityType;
    entity_type_name: string;
    count: number;
    results: SearchResultAPI[];
  }[];
  suggestions?: string[];
  did_you_mean?: string;
  facets?: SearchFacetsAPI;
  [key: string]: unknown;
}

/**
 * Search facets for filtering.
 */
export interface SearchFacets {
  entityTypes?: { type: SearchEntityType; count: number }[];
  clients?: { id: number; name: string; count: number }[];
  agents?: { id: number; name: string; count: number }[];
  categories?: { id: number; name: string; count: number }[];
  statuses?: { id: number; name: string; count: number }[];
  dateRanges?: { range: string; count: number }[];
  [key: string]: unknown;
}

/**
 * Search facets as returned by API.
 */
export interface SearchFacetsAPI {
  entity_types?: { type: SearchEntityType; count: number }[];
  clients?: { id: number; name: string; count: number }[];
  agents?: { id: number; name: string; count: number }[];
  categories?: { id: number; name: string; count: number }[];
  statuses?: { id: number; name: string; count: number }[];
  date_ranges?: { range: string; count: number }[];
  [key: string]: unknown;
}

/**
 * Saved search configuration.
 */
export interface SavedSearch extends HaloBaseEntity {
  id: number;
  name: string;
  description?: string;
  query: string;
  entityTypes?: SearchEntityType[];
  filters?: SearchFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPublic?: boolean;
  isDefault?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
  useCount?: number;
}

/**
 * Saved search as returned by API.
 */
export interface SavedSearchAPI {
  id: number;
  name: string;
  description?: string;
  query: string;
  entity_types?: SearchEntityType[];
  filters?: SearchFiltersAPI;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  is_public?: boolean;
  is_default?: boolean;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
  use_count?: number;
  [key: string]: unknown;
}

/**
 * Search filters.
 */
export interface SearchFilters {
  clientId?: number;
  clientIds?: number[];
  agentId?: number;
  agentIds?: number[];
  categoryId?: number;
  categoryIds?: number[];
  statusId?: number;
  statusIds?: number[];
  priorityId?: number;
  priorityIds?: number[];
  teamId?: number;
  teamIds?: number[];
  fromDate?: string;
  toDate?: string;
  createdFromDate?: string;
  createdToDate?: string;
  updatedFromDate?: string;
  updatedToDate?: string;
  customFields?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Search filters as returned by API.
 */
export interface SearchFiltersAPI {
  client_id?: number;
  client_ids?: number[];
  agent_id?: number;
  agent_ids?: number[];
  category_id?: number;
  category_ids?: number[];
  status_id?: number;
  status_ids?: number[];
  priority_id?: number;
  priority_ids?: number[];
  team_id?: number;
  team_ids?: number[];
  from_date?: string;
  to_date?: string;
  created_from_date?: string;
  created_to_date?: string;
  updated_from_date?: string;
  updated_to_date?: string;
  custom_fields?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Recent search entry.
 */
export interface RecentSearch extends HaloBaseEntity {
  id: number;
  query: string;
  entityTypes?: SearchEntityType[];
  resultCount: number;
  searchedAt: string;
  userId: number;
}

/**
 * Recent search as returned by API.
 */
export interface RecentSearchAPI {
  id: number;
  query: string;
  entity_types?: SearchEntityType[];
  result_count: number;
  searched_at: string;
  user_id: number;
  [key: string]: unknown;
}

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform API search result to internal format.
 */
export function transformSearchResult(api: SearchResultAPI): SearchResult {
  return {
    entityType: api.entity_type,
    entityId: api.entity_id,
    title: api.title,
    subtitle: api.subtitle,
    description: api.description,
    url: api.url,
    thumbnail: api.thumbnail,
    relevance: {
      score: api.relevance.score,
      matchedFields: api.relevance.matched_fields || [],
      highlights: api.relevance.highlights,
    },
    metadata: api.metadata,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Transform API search facets to internal format.
 */
export function transformSearchFacets(api: SearchFacetsAPI): SearchFacets {
  return {
    entityTypes: api.entity_types,
    clients: api.clients,
    agents: api.agents,
    categories: api.categories,
    statuses: api.statuses,
    dateRanges: api.date_ranges,
  };
}

/**
 * Transform API search response to internal format.
 */
export function transformSearchResponse(api: SearchResponseAPI): SearchResponse {
  return {
    query: api.query,
    totalCount: api.total_count,
    took: api.took,
    groups: api.groups?.map((g) => ({
      entityType: g.entity_type,
      entityTypeName: g.entity_type_name,
      count: g.count,
      results: g.results?.map(transformSearchResult) || [],
    })) || [],
    suggestions: api.suggestions,
    didYouMean: api.did_you_mean,
    facets: api.facets ? transformSearchFacets(api.facets) : undefined,
  };
}

/**
 * Transform API search filters to internal format.
 */
export function transformSearchFilters(api: SearchFiltersAPI): SearchFilters {
  return {
    clientId: api.client_id,
    clientIds: api.client_ids,
    agentId: api.agent_id,
    agentIds: api.agent_ids,
    categoryId: api.category_id,
    categoryIds: api.category_ids,
    statusId: api.status_id,
    statusIds: api.status_ids,
    priorityId: api.priority_id,
    priorityIds: api.priority_ids,
    teamId: api.team_id,
    teamIds: api.team_ids,
    fromDate: api.from_date,
    toDate: api.to_date,
    createdFromDate: api.created_from_date,
    createdToDate: api.created_to_date,
    updatedFromDate: api.updated_from_date,
    updatedToDate: api.updated_to_date,
    customFields: api.custom_fields,
  };
}

/**
 * Transform API saved search to internal format.
 */
export function transformSavedSearch(api: SavedSearchAPI): SavedSearch {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    query: api.query,
    entityTypes: api.entity_types,
    filters: api.filters ? transformSearchFilters(api.filters) : undefined,
    sortBy: api.sort_by,
    sortOrder: api.sort_order,
    isPublic: api.is_public,
    isDefault: api.is_default,
    userId: api.user_id,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    lastUsedAt: api.last_used_at,
    useCount: api.use_count,
  };
}

/**
 * Transform API recent search to internal format.
 */
export function transformRecentSearch(api: RecentSearchAPI): RecentSearch {
  return {
    id: api.id,
    query: api.query,
    entityTypes: api.entity_types,
    resultCount: api.result_count,
    searchedAt: api.searched_at,
    userId: api.user_id,
  };
}

// ==========================================
// Search Parameters
// ==========================================

/**
 * Parameters for global search.
 */
export interface GlobalSearchParams {
  query: string;
  entityTypes?: SearchEntityType[];
  pageSize?: number;
  pageNo?: number;
  filters?: SearchFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeFacets?: boolean;
  includeHighlights?: boolean;
  includeSuggestions?: boolean;
}

/**
 * Parameters for listing saved searches.
 */
export interface SavedSearchListParams {
  pageSize?: number;
  pageNo?: number;
  search?: string;
  isPublic?: boolean;
  userId?: number;
  orderBy?: string;
  orderDesc?: boolean;
}

/**
 * Parameters for listing recent searches.
 */
export interface RecentSearchListParams {
  pageSize?: number;
  pageNo?: number;
  userId?: number;
  fromDate?: string;
  toDate?: string;
}
