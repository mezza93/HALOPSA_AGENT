/**
 * Knowledge Base related types for HaloPSA.
 */

import { HaloBaseEntity } from './common';

/**
 * Knowledge Base article.
 */
export interface KBArticle extends HaloBaseEntity {
  title: string;
  content?: string;
  summary?: string;
  keywords?: string;
  categoryId?: number;
  categoryName?: string;
  isPublic: boolean;
  isPublished: boolean;
  viewCount?: number;
  dateCreated?: Date | string;
  dateModified?: Date | string;
  authorId?: number;
  authorName?: string;
}

/**
 * Raw KB article from API.
 */
export interface KBArticleApiResponse {
  id: number;
  title: string;
  content?: string;
  summary?: string;
  keywords?: string;
  category_id?: number;
  category_name?: string;
  is_public?: boolean;
  is_published?: boolean;
  view_count?: number;
  datecreated?: string;
  datemodified?: string;
  author_id?: number;
  author_name?: string;
  [key: string]: unknown;
}

/**
 * FAQ entry.
 */
export interface FAQ extends HaloBaseEntity {
  question: string;
  answer: string;
  categoryId?: number;
  categoryName?: string;
  isPublic: boolean;
  isPublished: boolean;
  order?: number;
}

/**
 * Raw FAQ from API.
 */
export interface FAQApiResponse {
  id: number;
  question: string;
  answer: string;
  category_id?: number;
  category_name?: string;
  is_public?: boolean;
  is_published?: boolean;
  order?: number;
  [key: string]: unknown;
}

/**
 * KB suggestion for a ticket.
 */
export interface KBSuggestion {
  articleId: number;
  title: string;
  summary?: string;
  relevanceScore: number;
  matchingKeywords: string[];
}

/**
 * KB statistics.
 */
export interface KBStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalFaqs: number;
  topViewedArticles: Array<{ id: number; title: string; views: number }>;
  articlesByCategory: Record<string, number>;
}

/**
 * Transform API response to KBArticle interface.
 */
export function transformKBArticle(data: KBArticleApiResponse): KBArticle {
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    summary: data.summary,
    keywords: data.keywords,
    categoryId: data.category_id,
    categoryName: data.category_name,
    isPublic: data.is_public ?? false,
    isPublished: data.is_published ?? false,
    viewCount: data.view_count,
    dateCreated: data.datecreated,
    dateModified: data.datemodified,
    authorId: data.author_id,
    authorName: data.author_name,
  };
}

/**
 * Transform API response to FAQ interface.
 */
export function transformFAQ(data: FAQApiResponse): FAQ {
  return {
    id: data.id,
    question: data.question,
    answer: data.answer,
    categoryId: data.category_id,
    categoryName: data.category_name,
    isPublic: data.is_public ?? false,
    isPublished: data.is_published ?? false,
    order: data.order,
  };
}
