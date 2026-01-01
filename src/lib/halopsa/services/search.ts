/**
 * HaloPSA Global Search Service.
 * Phase 4: Productivity & Automation
 */

import { HaloPSAClient } from '../client';
import type { ListParams } from '../types';
import {
  SearchResponse,
  SearchResponseAPI,
  GlobalSearchParams,
  SearchResult,
  SearchEntityType,
  SavedSearch,
  SavedSearchAPI,
  SavedSearchListParams,
  RecentSearch,
  RecentSearchAPI,
  RecentSearchListParams,
  transformSearchResponse,
  transformSavedSearch,
  transformRecentSearch,
} from '../types';

/**
 * Service for global search functionality.
 */
export class SearchService {
  constructor(private client: HaloPSAClient) {}

  /**
   * Perform a global search across all entity types.
   */
  async search(params: GlobalSearchParams): Promise<SearchResponse> {
    const queryParams: ListParams = {
      query: params.query,
    };

    if (params.entityTypes) queryParams.entity_types = params.entityTypes.join(',');
    if (params.pageSize) queryParams.page_size = params.pageSize;
    if (params.pageNo) queryParams.page_no = params.pageNo;
    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.sortOrder) queryParams.sort_order = params.sortOrder;
    if (params.includeFacets !== undefined) queryParams.include_facets = params.includeFacets;
    if (params.includeHighlights !== undefined) queryParams.include_highlights = params.includeHighlights;
    if (params.includeSuggestions !== undefined) queryParams.include_suggestions = params.includeSuggestions;

    // Add filters
    if (params.filters) {
      if (params.filters.clientId) queryParams.client_id = params.filters.clientId;
      if (params.filters.clientIds) queryParams.client_ids = params.filters.clientIds.join(',');
      if (params.filters.agentId) queryParams.agent_id = params.filters.agentId;
      if (params.filters.agentIds) queryParams.agent_ids = params.filters.agentIds.join(',');
      if (params.filters.categoryId) queryParams.category_id = params.filters.categoryId;
      if (params.filters.categoryIds) queryParams.category_ids = params.filters.categoryIds.join(',');
      if (params.filters.statusId) queryParams.status_id = params.filters.statusId;
      if (params.filters.statusIds) queryParams.status_ids = params.filters.statusIds.join(',');
      if (params.filters.priorityId) queryParams.priority_id = params.filters.priorityId;
      if (params.filters.priorityIds) queryParams.priority_ids = params.filters.priorityIds.join(',');
      if (params.filters.teamId) queryParams.team_id = params.filters.teamId;
      if (params.filters.teamIds) queryParams.team_ids = params.filters.teamIds.join(',');
      if (params.filters.fromDate) queryParams.from_date = params.filters.fromDate;
      if (params.filters.toDate) queryParams.to_date = params.filters.toDate;
      if (params.filters.createdFromDate) queryParams.created_from_date = params.filters.createdFromDate;
      if (params.filters.createdToDate) queryParams.created_to_date = params.filters.createdToDate;
      if (params.filters.updatedFromDate) queryParams.updated_from_date = params.filters.updatedFromDate;
      if (params.filters.updatedToDate) queryParams.updated_to_date = params.filters.updatedToDate;
    }

    const response = await this.client.get<SearchResponseAPI>('/Search', queryParams);
    return transformSearchResponse(response);
  }

  /**
   * Quick search with minimal options (for autocomplete/typeahead).
   */
  async quickSearch(query: string, limit?: number): Promise<SearchResult[]> {
    const response = await this.search({
      query,
      pageSize: limit || 10,
      includeFacets: false,
      includeHighlights: true,
      includeSuggestions: false,
    });

    // Flatten all results from all groups
    return response.groups.flatMap((g) => g.results);
  }

  /**
   * Search within a specific entity type.
   */
  async searchEntity(
    entityType: SearchEntityType,
    query: string,
    params?: Omit<GlobalSearchParams, 'query' | 'entityTypes'>
  ): Promise<SearchResponse> {
    return this.search({
      ...params,
      query,
      entityTypes: [entityType],
    });
  }

  /**
   * Search tickets.
   */
  async searchTickets(
    query: string,
    params?: Omit<GlobalSearchParams, 'query' | 'entityTypes'>
  ): Promise<SearchResult[]> {
    const response = await this.searchEntity('ticket', query, params);
    return response.groups.find((g) => g.entityType === 'ticket')?.results || [];
  }

  /**
   * Search clients.
   */
  async searchClients(
    query: string,
    params?: Omit<GlobalSearchParams, 'query' | 'entityTypes'>
  ): Promise<SearchResult[]> {
    const response = await this.searchEntity('client', query, params);
    return response.groups.find((g) => g.entityType === 'client')?.results || [];
  }

  /**
   * Search assets.
   */
  async searchAssets(
    query: string,
    params?: Omit<GlobalSearchParams, 'query' | 'entityTypes'>
  ): Promise<SearchResult[]> {
    const response = await this.searchEntity('asset', query, params);
    return response.groups.find((g) => g.entityType === 'asset')?.results || [];
  }

  /**
   * Search knowledge base articles.
   */
  async searchKnowledgeBase(
    query: string,
    params?: Omit<GlobalSearchParams, 'query' | 'entityTypes'>
  ): Promise<SearchResult[]> {
    const response = await this.searchEntity('kb_article', query, params);
    return response.groups.find((g) => g.entityType === 'kb_article')?.results || [];
  }

  /**
   * Get search suggestions for a partial query.
   */
  async getSuggestions(
    query: string,
    limit?: number
  ): Promise<string[]> {
    const response = await this.client.get<{ suggestions: string[] }>('/Search/Suggestions', {
      query,
      limit: limit || 10,
    });
    return response.suggestions || [];
  }

  /**
   * Get available entity types for search.
   */
  async getEntityTypes(): Promise<{ type: SearchEntityType; label: string; count: number }[]> {
    const response = await this.client.get<{ entity_types: { type: SearchEntityType; label: string; count: number }[] }>(
      '/Search/EntityTypes'
    );
    return response.entity_types || [];
  }
}

/**
 * Service for managing saved searches.
 */
export class SavedSearchService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List saved searches.
   */
  async list(params?: SavedSearchListParams): Promise<SavedSearch[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.search) queryParams.search = params.search;
    if (params?.isPublic !== undefined) queryParams.is_public = params.isPublic;
    if (params?.userId) queryParams.user_id = params.userId;
    if (params?.orderBy) queryParams.order_by = params.orderBy;
    if (params?.orderDesc !== undefined) queryParams.order_desc = params.orderDesc;

    const response = await this.client.get<{ searches: SavedSearchAPI[] }>('/Search/Saved', queryParams);
    return (response.searches || []).map(transformSavedSearch);
  }

  /**
   * Get a specific saved search by ID.
   */
  async get(id: number): Promise<SavedSearch> {
    const response = await this.client.get<SavedSearchAPI>(`/Search/Saved/${id}`);
    return transformSavedSearch(response);
  }

  /**
   * Create a new saved search.
   */
  async create(search: Partial<SavedSearch>): Promise<SavedSearch> {
    const payload = this.toAPIFormat(search);
    const response = await this.client.post<SavedSearchAPI>('/Search/Saved', [payload]);
    return transformSavedSearch(response);
  }

  /**
   * Update an existing saved search.
   */
  async update(id: number, search: Partial<SavedSearch>): Promise<SavedSearch> {
    const payload = { ...this.toAPIFormat(search), id };
    const response = await this.client.post<SavedSearchAPI>('/Search/Saved', [payload]);
    return transformSavedSearch(response);
  }

  /**
   * Delete a saved search.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Search/Saved/${id}`);
  }

  /**
   * Execute a saved search.
   */
  async execute(id: number, additionalParams?: Partial<GlobalSearchParams>): Promise<SearchResponse> {
    const savedSearch = await this.get(id);
    const searchService = new SearchService(this.client);

    return searchService.search({
      query: savedSearch.query,
      entityTypes: savedSearch.entityTypes,
      filters: savedSearch.filters,
      sortBy: savedSearch.sortBy,
      sortOrder: savedSearch.sortOrder,
      ...additionalParams,
    });
  }

  /**
   * Get public saved searches.
   */
  async getPublic(params?: Omit<SavedSearchListParams, 'isPublic'>): Promise<SavedSearch[]> {
    return this.list({ ...params, isPublic: true });
  }

  /**
   * Get user's saved searches.
   */
  async getByUser(
    userId: number,
    params?: Omit<SavedSearchListParams, 'userId'>
  ): Promise<SavedSearch[]> {
    return this.list({ ...params, userId });
  }

  /**
   * Set a saved search as default.
   */
  async setDefault(id: number): Promise<SavedSearch> {
    return this.update(id, { isDefault: true });
  }

  /**
   * Convert internal format to API format.
   */
  private toAPIFormat(search: Partial<SavedSearch>): Record<string, unknown> {
    const api: Record<string, unknown> = {};

    if (search.name !== undefined) api.name = search.name;
    if (search.description !== undefined) api.description = search.description;
    if (search.query !== undefined) api.query = search.query;
    if (search.entityTypes !== undefined) api.entity_types = search.entityTypes;
    if (search.sortBy !== undefined) api.sort_by = search.sortBy;
    if (search.sortOrder !== undefined) api.sort_order = search.sortOrder;
    if (search.isPublic !== undefined) api.is_public = search.isPublic;
    if (search.isDefault !== undefined) api.is_default = search.isDefault;

    if (search.filters) {
      api.filters = {
        client_id: search.filters.clientId,
        client_ids: search.filters.clientIds,
        agent_id: search.filters.agentId,
        agent_ids: search.filters.agentIds,
        category_id: search.filters.categoryId,
        category_ids: search.filters.categoryIds,
        status_id: search.filters.statusId,
        status_ids: search.filters.statusIds,
        priority_id: search.filters.priorityId,
        priority_ids: search.filters.priorityIds,
        team_id: search.filters.teamId,
        team_ids: search.filters.teamIds,
        from_date: search.filters.fromDate,
        to_date: search.filters.toDate,
        created_from_date: search.filters.createdFromDate,
        created_to_date: search.filters.createdToDate,
        updated_from_date: search.filters.updatedFromDate,
        updated_to_date: search.filters.updatedToDate,
        custom_fields: search.filters.customFields,
      };
    }

    return api;
  }
}

/**
 * Service for managing recent searches.
 */
export class RecentSearchService {
  constructor(private client: HaloPSAClient) {}

  /**
   * List recent searches.
   */
  async list(params?: RecentSearchListParams): Promise<RecentSearch[]> {
    const queryParams: ListParams = {};

    if (params?.pageSize) queryParams.page_size = params.pageSize;
    if (params?.pageNo) queryParams.page_no = params.pageNo;
    if (params?.userId) queryParams.user_id = params.userId;
    if (params?.fromDate) queryParams.from_date = params.fromDate;
    if (params?.toDate) queryParams.to_date = params.toDate;

    const response = await this.client.get<{ searches: RecentSearchAPI[] }>('/Search/Recent', queryParams);
    return (response.searches || []).map(transformRecentSearch);
  }

  /**
   * Get recent searches for the current user.
   */
  async getMyRecent(limit?: number): Promise<RecentSearch[]> {
    return this.list({ pageSize: limit || 10 });
  }

  /**
   * Clear recent searches for the current user.
   */
  async clearMyRecent(): Promise<void> {
    await this.client.delete('/Search/Recent');
  }

  /**
   * Delete a specific recent search.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Search/Recent/${id}`);
  }
}
