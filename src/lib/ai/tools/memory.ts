/**
 * Memory and Notebook AI tools.
 * Enables cross-session context memory and saving important findings.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/db';

/**
 * Entity types that can be remembered
 */
const ENTITY_TYPES = [
  'CLIENT',
  'TICKET',
  'AGENT',
  'ASSET',
  'CONTRACT',
  'PROJECT',
  'REPORT',
  'GENERAL',
] as const;

export function createMemoryTools(userId: string, sessionId?: string) {
  return {
    /**
     * Save something important to the notebook for future reference.
     */
    saveToNotebook: tool({
      description: `Save an important finding, insight, or piece of information to the user's notebook.

Use this when the user:
- Asks to "save this", "remember this", "note this down"
- Discovers an important insight they might want to reference later
- Wants to bookmark a piece of analysis or data

The notebook is persistent across sessions and can be searched later.`,
      parameters: z.object({
        title: z.string().describe('Short, descriptive title for the note'),
        content: z.string().describe('The full content to save (markdown supported)'),
        category: z.string().optional().describe('Category like "SLA Analysis", "Client Issues", "Reports"'),
        tags: z.array(z.string()).optional().describe('Tags for easier searching'),
        relatedEntities: z.array(z.object({
          type: z.enum(ENTITY_TYPES),
          id: z.string().optional(),
          name: z.string(),
        })).optional().describe('Related clients, tickets, etc.'),
      }),
      execute: async ({ title, content, category, tags, relatedEntities }) => {
        try {
          const entry = await prisma.notebookEntry.create({
            data: {
              userId,
              title,
              content,
              category: category || null,
              tags: tags || [],
              relatedEntities: relatedEntities ? JSON.parse(JSON.stringify(relatedEntities)) : null,
              sessionId: sessionId || null,
            },
          });

          return {
            success: true,
            entry: {
              id: entry.id,
              title: entry.title,
              category: entry.category,
              tags: entry.tags,
            },
            message: `Saved to notebook: "${title}"`,
          };
        } catch (error) {
          console.error('[Tool:saveToNotebook] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save to notebook',
          };
        }
      },
    }),

    /**
     * Search the notebook for saved findings.
     */
    searchNotebook: tool({
      description: `Search the user's notebook for previously saved findings and insights.

Use this when the user asks about:
- Previously saved notes
- Past analyses or findings
- "What did I save about X?"
- "Show me my notes"`,
      parameters: z.object({
        query: z.string().optional().describe('Search query to find notes'),
        category: z.string().optional().describe('Filter by category'),
        tags: z.array(z.string()).optional().describe('Filter by tags'),
        limit: z.number().optional().describe('Max results (default 10)'),
      }),
      execute: async ({ query, category, tags, limit = 10 }) => {
        try {
          const entries = await prisma.notebookEntry.findMany({
            where: {
              userId,
              isArchived: false,
              ...(category ? { category } : {}),
              ...(tags && tags.length > 0 ? { tags: { hasSome: tags } } : {}),
              ...(query ? {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { content: { contains: query, mode: 'insensitive' } },
                ],
              } : {}),
            },
            orderBy: [
              { isPinned: 'desc' },
              { createdAt: 'desc' },
            ],
            take: limit,
          });

          return {
            success: true,
            count: entries.length,
            entries: entries.map(e => ({
              id: e.id,
              title: e.title,
              content: e.content.substring(0, 500) + (e.content.length > 500 ? '...' : ''),
              category: e.category,
              tags: e.tags,
              isPinned: e.isPinned,
              createdAt: e.createdAt,
            })),
            message: entries.length > 0
              ? `Found ${entries.length} notebook entries`
              : 'No notebook entries found',
          };
        } catch (error) {
          console.error('[Tool:searchNotebook] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search notebook',
          };
        }
      },
    }),

    /**
     * Get a specific notebook entry by ID.
     */
    getNotebookEntry: tool({
      description: 'Get the full content of a specific notebook entry by its ID.',
      parameters: z.object({
        entryId: z.string().describe('The ID of the notebook entry'),
      }),
      execute: async ({ entryId }) => {
        try {
          const entry = await prisma.notebookEntry.findFirst({
            where: { id: entryId, userId },
          });

          if (!entry) {
            return { success: false, error: 'Notebook entry not found' };
          }

          return {
            success: true,
            entry: {
              id: entry.id,
              title: entry.title,
              content: entry.content,
              category: entry.category,
              tags: entry.tags,
              relatedEntities: entry.relatedEntities,
              isPinned: entry.isPinned,
              createdAt: entry.createdAt,
            },
          };
        } catch (error) {
          console.error('[Tool:getNotebookEntry] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get notebook entry',
          };
        }
      },
    }),

    /**
     * Remember something about a client, ticket, or other entity.
     */
    rememberContext: tool({
      description: `Remember important context about a client, ticket, agent, or other entity.

Use this to save context that will be useful in future conversations:
- Client preferences or issues
- Ongoing ticket situations
- Agent specialties
- Important facts about assets

This creates persistent memory that will be loaded in future sessions.`,
      parameters: z.object({
        entityType: z.enum(ENTITY_TYPES).describe('Type of entity'),
        entityId: z.string().optional().describe('HaloPSA ID if applicable'),
        entityName: z.string().describe('Name of the entity (e.g., "ABC Corp", "Ticket #1234")'),
        summary: z.string().describe('What to remember about this entity'),
        keyFacts: z.array(z.string()).optional().describe('Key facts as bullet points'),
        importance: z.number().min(1).max(10).optional().describe('Importance 1-10 (default 5)'),
      }),
      execute: async ({ entityType, entityId, entityName, summary, keyFacts, importance = 5 }) => {
        try {
          // Check for existing memory about this entity
          const existing = await prisma.conversationMemory.findFirst({
            where: {
              userId,
              entityType: entityType as never,
              entityName: { equals: entityName, mode: 'insensitive' },
            },
          });

          let memory;
          if (existing) {
            // Update existing memory
            const existingFacts = (existing.keyFacts as string[]) || [];
            const newFacts = keyFacts || [];
            const mergedFacts = [...new Set([...existingFacts, ...newFacts])];

            memory = await prisma.conversationMemory.update({
              where: { id: existing.id },
              data: {
                summary: `${existing.summary}\n\n[Updated] ${summary}`,
                keyFacts: JSON.parse(JSON.stringify(mergedFacts)),
                importance: Math.max(existing.importance, importance),
                lastAccessedAt: new Date(),
                sessionId: sessionId || null,
              },
            });
          } else {
            // Create new memory
            memory = await prisma.conversationMemory.create({
              data: {
                userId,
                entityType: entityType as never,
                entityId: entityId || null,
                entityName,
                summary,
                keyFacts: keyFacts ? JSON.parse(JSON.stringify(keyFacts)) : null,
                importance,
                sessionId: sessionId || null,
              },
            });
          }

          return {
            success: true,
            memory: {
              id: memory.id,
              entityType: memory.entityType,
              entityName: memory.entityName,
              isUpdate: !!existing,
            },
            message: existing
              ? `Updated memory for ${entityName}`
              : `Remembered context for ${entityName}`,
          };
        } catch (error) {
          console.error('[Tool:rememberContext] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to remember context',
          };
        }
      },
    }),

    /**
     * Recall context about an entity or topic.
     */
    recallContext: tool({
      description: `Recall what you remember about a client, ticket, or topic from previous conversations.

Use this when:
- User asks about a client you've discussed before
- You need context about an ongoing situation
- User says "what do you know about X?"`,
      parameters: z.object({
        query: z.string().describe('Entity name or topic to recall'),
        entityType: z.enum(ENTITY_TYPES).optional().describe('Filter by entity type'),
      }),
      execute: async ({ query, entityType }) => {
        try {
          const memories = await prisma.conversationMemory.findMany({
            where: {
              userId,
              ...(entityType ? { entityType: entityType as never } : {}),
              OR: [
                { entityName: { contains: query, mode: 'insensitive' } },
                { summary: { contains: query, mode: 'insensitive' } },
              ],
            },
            orderBy: [
              { importance: 'desc' },
              { lastAccessedAt: 'desc' },
            ],
            take: 5,
          });

          // Update last accessed time
          if (memories.length > 0) {
            await prisma.conversationMemory.updateMany({
              where: { id: { in: memories.map(m => m.id) } },
              data: { lastAccessedAt: new Date() },
            });
          }

          return {
            success: true,
            count: memories.length,
            memories: memories.map(m => ({
              id: m.id,
              entityType: m.entityType,
              entityName: m.entityName,
              summary: m.summary,
              keyFacts: m.keyFacts,
              importance: m.importance,
              lastDiscussed: m.updatedAt,
            })),
            message: memories.length > 0
              ? `Found ${memories.length} memories related to "${query}"`
              : `No previous context found for "${query}"`,
          };
        } catch (error) {
          console.error('[Tool:recallContext] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to recall context',
          };
        }
      },
    }),

    /**
     * Get recent conversation context for continuity.
     */
    getRecentContext: tool({
      description: `Get context from recent conversations to maintain continuity.

Use this at the start of conversations when:
- User references something from a previous session
- You need to understand ongoing work
- User says "continue where we left off"`,
      parameters: z.object({
        daysBack: z.number().optional().describe('How many days back to look (default 7)'),
        limit: z.number().optional().describe('Max conversations to retrieve (default 5)'),
      }),
      execute: async ({ daysBack = 7, limit = 5 }) => {
        try {
          const since = new Date();
          since.setDate(since.getDate() - daysBack);

          // Get recent conversation summaries
          const summaries = await prisma.conversationSummary.findMany({
            where: {
              userId,
              createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          });

          // Get recently accessed memories
          const recentMemories = await prisma.conversationMemory.findMany({
            where: {
              userId,
              lastAccessedAt: { gte: since },
            },
            orderBy: { lastAccessedAt: 'desc' },
            take: 10,
          });

          return {
            success: true,
            recentConversations: summaries.map(s => ({
              id: s.id,
              title: s.title,
              summary: s.summary,
              topics: s.topics,
              date: s.createdAt,
            })),
            activeMemories: recentMemories.map(m => ({
              entityType: m.entityType,
              entityName: m.entityName,
              summary: m.summary.substring(0, 200),
              importance: m.importance,
            })),
            message: `Found ${summaries.length} recent conversations and ${recentMemories.length} active memories`,
          };
        } catch (error) {
          console.error('[Tool:getRecentContext] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get recent context',
          };
        }
      },
    }),

    /**
     * Delete a notebook entry.
     */
    deleteNotebookEntry: tool({
      description: 'Delete a notebook entry (or archive it).',
      parameters: z.object({
        entryId: z.string().describe('The ID of the notebook entry to delete'),
        archive: z.boolean().optional().describe('Archive instead of delete (default true)'),
      }),
      execute: async ({ entryId, archive = true }) => {
        try {
          if (archive) {
            await prisma.notebookEntry.update({
              where: { id: entryId, userId },
              data: { isArchived: true },
            });
            return { success: true, message: 'Entry archived' };
          } else {
            await prisma.notebookEntry.delete({
              where: { id: entryId, userId },
            });
            return { success: true, message: 'Entry deleted' };
          }
        } catch (error) {
          console.error('[Tool:deleteNotebookEntry] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete entry',
          };
        }
      },
    }),

    /**
     * Pin/unpin a notebook entry.
     */
    toggleNotebookPin: tool({
      description: 'Pin or unpin a notebook entry for quick access.',
      parameters: z.object({
        entryId: z.string().describe('The ID of the notebook entry'),
        isPinned: z.boolean().describe('Whether to pin (true) or unpin (false)'),
      }),
      execute: async ({ entryId, isPinned }) => {
        try {
          const entry = await prisma.notebookEntry.update({
            where: { id: entryId, userId },
            data: { isPinned },
          });
          return {
            success: true,
            message: isPinned ? `Pinned: "${entry.title}"` : `Unpinned: "${entry.title}"`,
          };
        } catch (error) {
          console.error('[Tool:toggleNotebookPin] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to toggle pin',
          };
        }
      },
    }),
  };
}

/**
 * Get memory context for loading into a new conversation.
 * Called when a new chat session starts.
 */
export async function getMemoryContextForUser(userId: string): Promise<string> {
  try {
    // Get high-importance memories
    const importantMemories = await prisma.conversationMemory.findMany({
      where: {
        userId,
        importance: { gte: 7 },
      },
      orderBy: { importance: 'desc' },
      take: 10,
    });

    // Get recently accessed memories
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const recentMemories = await prisma.conversationMemory.findMany({
      where: {
        userId,
        lastAccessedAt: { gte: recentDate },
        importance: { lt: 7 },
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
    });

    const allMemories = [...importantMemories, ...recentMemories];

    if (allMemories.length === 0) {
      return '';
    }

    // Build context string
    let context = '\n\n## Your Memory (from previous conversations)\n';

    const byType: Record<string, typeof allMemories> = {};
    for (const mem of allMemories) {
      const type = mem.entityType;
      if (!byType[type]) byType[type] = [];
      byType[type].push(mem);
    }

    for (const [type, memories] of Object.entries(byType)) {
      context += `\n**${type.toLowerCase()}s:**\n`;
      for (const mem of memories) {
        context += `- ${mem.entityName}: ${mem.summary.substring(0, 150)}${mem.summary.length > 150 ? '...' : ''}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error('[getMemoryContextForUser] Error:', error);
    return '';
  }
}

/**
 * Save a conversation summary when a session ends or periodically.
 */
export async function saveConversationSummary(
  sessionId: string,
  userId: string,
  summary: {
    title: string;
    summary: string;
    topics: string[];
    entitiesMentioned?: Array<{ type: string; name: string }>;
    actionsPerformed?: string[];
  }
): Promise<void> {
  try {
    await prisma.conversationSummary.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId,
        title: summary.title,
        summary: summary.summary,
        topics: summary.topics,
        entitiesMentioned: summary.entitiesMentioned
          ? JSON.parse(JSON.stringify(summary.entitiesMentioned))
          : null,
        actionsPerformed: summary.actionsPerformed
          ? JSON.parse(JSON.stringify(summary.actionsPerformed))
          : null,
      },
      update: {
        title: summary.title,
        summary: summary.summary,
        topics: summary.topics,
        entitiesMentioned: summary.entitiesMentioned
          ? JSON.parse(JSON.stringify(summary.entitiesMentioned))
          : null,
        actionsPerformed: summary.actionsPerformed
          ? JSON.parse(JSON.stringify(summary.actionsPerformed))
          : null,
      },
    });
  } catch (error) {
    console.error('[saveConversationSummary] Error:', error);
  }
}
