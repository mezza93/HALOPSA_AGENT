/**
 * Knowledge Base service for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  KBArticle,
  KBArticleApiResponse,
  FAQ,
  FAQApiResponse,
  KBSuggestion,
  KBStats,
  transformKBArticle,
  transformFAQ,
} from '../types/knowledgebase';
import { ListParams } from '../types/common';

/**
 * Service for FAQ operations.
 */
export class FAQService extends BaseService<FAQ, FAQApiResponse> {
  protected endpoint = '/FAQ';

  protected transform(data: FAQApiResponse): FAQ {
    return transformFAQ(data);
  }

  /**
   * List published FAQs.
   */
  async listPublished(count = 50, params: ListParams = {}): Promise<FAQ[]> {
    return this.list({ is_published: true, count, ...params });
  }

  /**
   * List FAQs by category.
   */
  async listByCategory(categoryId: number, params: ListParams = {}): Promise<FAQ[]> {
    return this.list({ category_id: categoryId, ...params });
  }
}

/**
 * Service for Knowledge Base operations.
 */
export class KnowledgeBaseService extends BaseService<KBArticle, KBArticleApiResponse> {
  protected endpoint = '/KBArticle';

  public faqs: FAQService;

  constructor(client: HaloPSAClient) {
    super(client);
    this.faqs = new FAQService(client);
  }

  protected transform(data: KBArticleApiResponse): KBArticle {
    return transformKBArticle(data);
  }

  /**
   * List published articles.
   */
  async listPublished(count = 50, params: ListParams = {}): Promise<KBArticle[]> {
    return this.list({ is_published: true, count, ...params });
  }

  /**
   * List articles by category.
   */
  async listByCategory(categoryId: number, params: ListParams = {}): Promise<KBArticle[]> {
    return this.list({ category_id: categoryId, ...params });
  }

  /**
   * Search articles.
   */
  async search(query: string, count = 20, params: ListParams = {}): Promise<KBArticle[]> {
    return this.list({ search: query, count, ...params });
  }

  /**
   * Get KB suggestions for a ticket or issue description.
   */
  async getSuggestions(options: {
    ticketId?: number;
    summary?: string;
    details?: string;
    count?: number;
  }): Promise<KBSuggestion[]> {
    const { summary, details, count = 5 } = options;

    if (!summary && !details) {
      return [];
    }

    // Search for relevant articles based on summary and details
    const searchQuery = [summary, details].filter(Boolean).join(' ');
    const articles = await this.search(searchQuery, count);

    // Calculate relevance scores based on keyword matching
    const searchWords = new Set(searchQuery.toLowerCase().split(/\s+/));

    return articles.map((article) => {
      const articleWords = new Set(
        [article.title, article.keywords, article.summary]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .split(/\s+/)
      );

      const matchingKeywords = [...searchWords].filter((w) => articleWords.has(w));
      const relevanceScore = matchingKeywords.length / searchWords.size;

      return {
        articleId: article.id,
        title: article.title,
        summary: article.summary,
        relevanceScore: Math.round(relevanceScore * 100) / 100,
        matchingKeywords,
      };
    });
  }

  /**
   * Get KB statistics.
   */
  async getStats(): Promise<KBStats> {
    const allArticles = await this.list({ count: 1000 });
    const publishedArticles = allArticles.filter((a) => a.isPublished);
    const draftArticles = allArticles.filter((a) => !a.isPublished);

    const allFaqs = await this.faqs.list({ count: 1000 });

    // Top viewed articles
    const topViewedArticles = allArticles
      .filter((a) => a.viewCount && a.viewCount > 0)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        title: a.title,
        views: a.viewCount || 0,
      }));

    // Articles by category
    const articlesByCategory: Record<string, number> = {};
    for (const article of allArticles) {
      const category = article.categoryName || 'Uncategorized';
      articlesByCategory[category] = (articlesByCategory[category] || 0) + 1;
    }

    return {
      totalArticles: allArticles.length,
      publishedArticles: publishedArticles.length,
      draftArticles: draftArticles.length,
      totalFaqs: allFaqs.length,
      topViewedArticles,
      articlesByCategory,
    };
  }
}
