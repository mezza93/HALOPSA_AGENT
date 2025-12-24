/**
 * Knowledge Base-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { KBArticle, FAQ, KBSuggestion } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const DEFAULT_SUGGESTION_COUNT = 5;

export function createKnowledgeBaseTools(ctx: HaloContext) {
  return {
    // === ARTICLE OPERATIONS ===
    listKbArticles: tool({
      description: 'List knowledge base articles with optional filters.',
      parameters: z.object({
        categoryId: z.number().optional().describe('Filter by category ID'),
        isPublished: z.boolean().optional().describe('Filter by published status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ categoryId, isPublished, count }) => {
        const articles = isPublished
          ? await ctx.kb.listPublished({ categoryId, count: count || DEFAULT_COUNT })
          : await ctx.kb.list({ categoryId, isPublished, count: count || DEFAULT_COUNT });

        return articles.map((a: KBArticle) => ({
          id: a.id,
          title: a.title,
          category: a.categoryName,
          isPublished: a.isPublished,
          viewCount: a.viewCount,
        }));
      },
    }),

    getKbArticle: tool({
      description: 'Get full content of a knowledge base article.',
      parameters: z.object({
        articleId: z.number().describe('The article ID'),
      }),
      execute: async ({ articleId }) => {
        const article = await ctx.kb.get(articleId);
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          category: article.categoryName,
          keywords: article.keywords,
          viewCount: article.viewCount,
          isPublished: article.isPublished,
          isPublic: article.isPublic,
          dateCreated: article.dateCreated,
          dateModified: article.dateModified,
        };
      },
    }),

    searchKbArticles: tool({
      description: 'Search knowledge base articles by keyword.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        count: z.number().optional().default(10).describe('Maximum number to return'),
      }),
      execute: async ({ query, count }) => {
        const articles = await ctx.kb.search(query, { count: count || 10 });

        return articles.map((a: KBArticle) => ({
          id: a.id,
          title: a.title,
          summary: a.summary,
          category: a.categoryName,
        }));
      },
    }),

    getKbSuggestions: tool({
      description: 'Get KB article suggestions for a ticket based on its content.',
      parameters: z.object({
        ticketId: z.number().optional().describe('Ticket ID to get suggestions for'),
        summary: z.string().optional().describe('Ticket summary text'),
        details: z.string().optional().describe('Ticket details text'),
        count: z.number().optional().default(DEFAULT_SUGGESTION_COUNT).describe('Maximum suggestions to return'),
      }),
      execute: async ({ ticketId, summary, details, count }) => {
        const suggestions = await ctx.kb.getSuggestions({
          ticketId,
          summary,
          details,
          count: count || DEFAULT_SUGGESTION_COUNT,
        });

        return suggestions.map((s: KBSuggestion) => ({
          articleId: s.articleId,
          title: s.title,
          relevance: s.relevanceScore,
        }));
      },
    }),

    createKbArticle: tool({
      description: 'Create a new knowledge base article.',
      parameters: z.object({
        title: z.string().describe('Article title'),
        content: z.string().describe('Article content (HTML or markdown)'),
        categoryId: z.number().optional().describe('Category ID'),
        summary: z.string().optional().describe('Short summary'),
        keywords: z.string().optional().describe('Keywords for search'),
        isPublic: z.boolean().optional().default(false).describe('Whether visible to end users'),
        isPublished: z.boolean().optional().default(false).describe('Whether the article is published'),
      }),
      execute: async ({ title, content, categoryId, summary, keywords, isPublic, isPublished }) => {
        const articleData: Record<string, unknown> = {
          title,
          content,
          isPublic: isPublic || false,
          isPublished: isPublished || false,
        };

        if (categoryId) articleData.categoryId = categoryId;
        if (summary) articleData.summary = summary;
        if (keywords) articleData.keywords = keywords;

        const articles = await ctx.kb.create([articleData]);
        if (articles && articles.length > 0) {
          return {
            success: true,
            articleId: articles[0].id,
            title: articles[0].title,
          };
        }
        return { success: false, error: 'Failed to create article' };
      },
    }),

    updateKbArticle: tool({
      description: 'Update an existing knowledge base article.',
      parameters: z.object({
        articleId: z.number().describe('The article ID'),
        title: z.string().optional().describe('New title'),
        content: z.string().optional().describe('New content'),
        summary: z.string().optional().describe('New summary'),
        keywords: z.string().optional().describe('New keywords'),
        isPublished: z.boolean().optional().describe('Published status'),
      }),
      execute: async ({ articleId, title, content, summary, keywords, isPublished }) => {
        const updateData: Record<string, unknown> = { id: articleId };

        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (summary !== undefined) updateData.summary = summary;
        if (keywords !== undefined) updateData.keywords = keywords;
        if (isPublished !== undefined) updateData.isPublished = isPublished;

        const articles = await ctx.kb.update([updateData]);
        if (articles && articles.length > 0) {
          return {
            success: true,
            articleId: articles[0].id,
            title: articles[0].title,
          };
        }
        return { success: false, error: 'Failed to update article' };
      },
    }),

    getKbStats: tool({
      description: 'Get knowledge base statistics including article counts by category.',
      parameters: z.object({}),
      execute: async () => {
        return ctx.kb.getStats();
      },
    }),

    // === FAQ OPERATIONS ===
    listFaqs: tool({
      description: 'List frequently asked questions.',
      parameters: z.object({
        categoryId: z.number().optional().describe('Filter by category ID'),
        isPublished: z.boolean().optional().describe('Filter by published status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ categoryId, isPublished, count }) => {
        const faqs = await ctx.kb.faqs.list({
          categoryId,
          isPublished,
          count: count || DEFAULT_COUNT,
        });

        return faqs.map((f: FAQ) => ({
          id: f.id,
          question: f.question,
          answer: f.answer.length > 200 ? f.answer.slice(0, 200) + '...' : f.answer,
        }));
      },
    }),

    createFaq: tool({
      description: 'Create a new FAQ entry.',
      parameters: z.object({
        question: z.string().describe('The question'),
        answer: z.string().describe('The answer'),
        categoryId: z.number().optional().describe('Category ID'),
        isPublic: z.boolean().optional().default(false).describe('Whether visible to end users'),
        isPublished: z.boolean().optional().default(false).describe('Whether published'),
      }),
      execute: async ({ question, answer, categoryId, isPublic, isPublished }) => {
        const faqData: Record<string, unknown> = {
          question,
          answer,
          isPublic: isPublic || false,
          isPublished: isPublished || false,
        };

        if (categoryId) faqData.categoryId = categoryId;

        const faqs = await ctx.kb.faqs.create([faqData]);
        if (faqs && faqs.length > 0) {
          return {
            success: true,
            faqId: faqs[0].id,
            question: faqs[0].question,
          };
        }
        return { success: false, error: 'Failed to create FAQ' };
      },
    }),
  };
}
