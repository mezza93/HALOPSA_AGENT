/**
 * Canned Text/Quick Response service for HaloPSA API.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  CannedText,
  CannedTextApiResponse,
  CannedTextScope,
  CannedTextCategory,
  CannedTextCategoryApiResponse,
  transformCannedText,
  transformCannedTextCategory,
  replaceCannedTextVariables,
  CANNED_TEXT_VARIABLES,
} from '../types/canned-text';
import type { ListParams } from '../types';

/**
 * Service for managing canned text responses.
 */
export class CannedTextService extends BaseService<CannedText, CannedTextApiResponse> {
  protected endpoint = '/CannedText';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: CannedTextApiResponse): CannedText {
    return transformCannedText(data);
  }

  /**
   * List canned texts with filters.
   */
  async listFiltered(params: {
    agentId?: number;
    teamId?: number;
    categoryId?: number;
    scope?: CannedTextScope;
    isGlobal?: boolean;
    search?: string;
    count?: number;
  }): Promise<CannedText[]> {
    const queryParams: ListParams = {};

    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.teamId) queryParams.team_id = params.teamId;
    if (params.categoryId) queryParams.category_id = params.categoryId;
    if (params.scope) queryParams.scope = params.scope;
    if (params.isGlobal !== undefined) queryParams.is_global = params.isGlobal;
    if (params.search) queryParams.search = params.search;
    if (params.count) queryParams.count = params.count;

    return this.list(queryParams);
  }

  /**
   * Get canned texts available to an agent (personal + team + global).
   */
  async getAvailableForAgent(agentId: number, teamId?: number): Promise<CannedText[]> {
    // Get global texts
    const globalTexts = await this.listFiltered({ isGlobal: true });

    // Get agent's personal texts
    const agentTexts = await this.listFiltered({ agentId });

    // Get team texts if team ID provided
    let teamTexts: CannedText[] = [];
    if (teamId) {
      teamTexts = await this.listFiltered({ teamId });
    }

    // Merge and dedupe by ID
    const textMap = new Map<number, CannedText>();
    for (const text of [...globalTexts, ...teamTexts, ...agentTexts]) {
      if (text.isActive) {
        textMap.set(text.id, text);
      }
    }

    return Array.from(textMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Search canned texts by content or name.
   */
  async search(query: string, scope?: CannedTextScope): Promise<CannedText[]> {
    const queryParams: ListParams = { search: query };
    if (scope) queryParams.scope = scope;

    return this.list(queryParams);
  }

  /**
   * Find a canned text by shortcut.
   */
  async findByShortcut(shortcut: string, agentId?: number): Promise<CannedText | null> {
    const texts = agentId
      ? await this.getAvailableForAgent(agentId)
      : await this.listFiltered({ isGlobal: true });

    return texts.find(t => t.shortcut?.toLowerCase() === shortcut.toLowerCase()) || null;
  }

  /**
   * Create a new canned text.
   */
  async createCannedText(data: {
    name: string;
    content: string;
    shortcut?: string;
    scope?: CannedTextScope;
    categoryId?: number;
    agentId?: number;
    teamId?: number;
    isGlobal?: boolean;
    htmlContent?: string;
  }): Promise<CannedText> {
    const textData: Record<string, unknown> = {
      name: data.name,
      content: data.content,
      scope: data.scope || 'all',
      is_global: data.isGlobal ?? false,
      is_active: true,
    };

    if (data.shortcut) textData.shortcut = data.shortcut;
    if (data.categoryId) textData.category_id = data.categoryId;
    if (data.agentId) textData.agent_id = data.agentId;
    if (data.teamId) textData.team_id = data.teamId;
    if (data.htmlContent) textData.html_content = data.htmlContent;

    const texts = await this.create([textData as Partial<CannedText>]);
    if (texts.length === 0) {
      throw new Error('Failed to create canned text');
    }
    return texts[0];
  }

  /**
   * Get canned text content with variables replaced.
   */
  async getExpandedContent(
    cannedTextId: number,
    variables: Record<string, string>
  ): Promise<string> {
    const text = await this.get(cannedTextId);
    return replaceCannedTextVariables(text.content, variables);
  }

  /**
   * Expand a shortcut to its content with variables.
   */
  async expandShortcut(
    shortcut: string,
    variables: Record<string, string>,
    agentId?: number
  ): Promise<string | null> {
    const text = await this.findByShortcut(shortcut, agentId);
    if (!text) return null;
    return replaceCannedTextVariables(text.content, variables);
  }

  /**
   * Record usage of a canned text (for analytics).
   */
  async recordUsage(cannedTextId: number): Promise<void> {
    // Update the usage count and last used timestamp
    await this.update([{
      id: cannedTextId,
      usageCount: 1, // This would typically be incremented server-side
      lastUsedAt: new Date().toISOString(),
    } as Partial<CannedText>]);
  }

  /**
   * Get most used canned texts.
   */
  async getMostUsed(count: number = 10, agentId?: number): Promise<CannedText[]> {
    const texts = agentId
      ? await this.getAvailableForAgent(agentId)
      : await this.listFiltered({ isGlobal: true });

    return texts
      .filter(t => t.usageCount && t.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, count);
  }

  /**
   * Get recently used canned texts.
   */
  async getRecentlyUsed(count: number = 10, agentId?: number): Promise<CannedText[]> {
    const texts = agentId
      ? await this.getAvailableForAgent(agentId)
      : await this.listFiltered({ isGlobal: true });

    return texts
      .filter(t => t.lastUsedAt)
      .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''))
      .slice(0, count);
  }

  /**
   * Get available variables for canned text templates.
   */
  getAvailableVariables(scope?: CannedTextScope) {
    if (!scope || scope === 'all') {
      return CANNED_TEXT_VARIABLES;
    }
    return CANNED_TEXT_VARIABLES.filter(v => v.scope === scope || v.scope === 'all');
  }

  /**
   * Validate that all variables in content are known.
   */
  validateVariables(content: string): { valid: boolean; unknownVariables: string[] } {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const usedVariables: string[] = [];
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      usedVariables.push(`{{${match[1]}}}`);
    }

    const knownVariableNames = CANNED_TEXT_VARIABLES.map(v => v.name);
    const unknownVariables = usedVariables.filter(v => !knownVariableNames.includes(v));

    return {
      valid: unknownVariables.length === 0,
      unknownVariables,
    };
  }
}

/**
 * Service for managing canned text categories.
 */
export class CannedTextCategoryService extends BaseService<CannedTextCategory, CannedTextCategoryApiResponse> {
  protected endpoint = '/CannedTextCategory';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: CannedTextCategoryApiResponse): CannedTextCategory {
    return transformCannedTextCategory(data);
  }

  /**
   * List active categories.
   */
  async listActive(): Promise<CannedTextCategory[]> {
    const categories = await this.list();
    return categories.filter(c => c.isActive);
  }

  /**
   * Get category tree (with parent-child relationships).
   */
  async getCategoryTree(): Promise<(CannedTextCategory & { children: CannedTextCategory[] })[]> {
    const categories = await this.listActive();

    // Build tree structure
    const rootCategories = categories.filter(c => !c.parentId);
    const childCategories = categories.filter(c => c.parentId);

    return rootCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(c => c.parentId === parent.id),
    }));
  }

  /**
   * Create a new category.
   */
  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: number;
    order?: number;
  }): Promise<CannedTextCategory> {
    const categoryData: Record<string, unknown> = {
      name: data.name,
      is_active: true,
    };

    if (data.description) categoryData.description = data.description;
    if (data.parentId) categoryData.parent_id = data.parentId;
    if (data.order !== undefined) categoryData.order = data.order;

    const categories = await this.create([categoryData as Partial<CannedTextCategory>]);
    if (categories.length === 0) {
      throw new Error('Failed to create canned text category');
    }
    return categories[0];
  }
}
