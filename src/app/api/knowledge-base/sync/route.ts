import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/encryption';
import { createHaloServices } from '@/lib/halopsa';
import type { Client } from '@/lib/halopsa/types';
import { KBCategory } from '@prisma/client';

interface SyncResult {
  itemsAdded: number;
  itemsUpdated: number;
  itemsRemoved: number;
  errorCount: number;
  errors: string[];
}

// Vercel function timeout configuration
export const maxDuration = 60; // 60 seconds for Pro plan, 10 for hobby

/**
 * POST - Start knowledge base sync
 *
 * Uses batched operations and parallel API calls for performance.
 * Should complete within Vercel's timeout limits.
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for sync mode in request body
    let syncMode: 'quick' | 'full' = 'quick';
    try {
      const body = await request.json().catch(() => ({}));
      syncMode = body.mode === 'full' ? 'full' : 'quick';
    } catch {
      // Default to quick mode
    }

    // Get user's active connection
    const connection = await prisma.haloConnection.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No active HaloPSA connection found. Please set up a connection first.' },
        { status: 400 }
      );
    }

    // Create sync record
    const sync = await prisma.knowledgeBaseSync.create({
      data: {
        userId,
        status: 'IN_PROGRESS',
        syncType: syncMode,
      },
    });

    const result: SyncResult = {
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsRemoved: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // Decrypt credentials and create services
      const clientId = decrypt(connection.clientId);
      const clientSecret = decrypt(connection.clientSecret);
      const services = createHaloServices({
        baseUrl: connection.baseUrl,
        clientId,
        clientSecret,
        tenant: connection.tenant || undefined,
      });

      console.log(`[KB Sync] Starting ${syncMode} sync for user ${userId}`);

      // Run API calls in parallel for speed
      const [
        ticketTypes,
        statuses,
        priorities,
        agents,
        teams,
      ] = await Promise.all([
        services.configuration.listTicketTypes().catch((e: Error) => {
          result.errors.push(`Failed to fetch ticket types: ${e.message}`);
          result.errorCount++;
          return [];
        }),
        services.configuration.listTicketStatuses().catch((e: Error) => {
          result.errors.push(`Failed to fetch statuses: ${e.message}`);
          result.errorCount++;
          return [];
        }),
        services.configuration.listPriorities().catch((e: Error) => {
          result.errors.push(`Failed to fetch priorities: ${e.message}`);
          result.errorCount++;
          return [];
        }),
        services.agents.list({ count: 50 }).catch((e: Error) => {
          result.errors.push(`Failed to fetch agents: ${e.message}`);
          result.errorCount++;
          return [];
        }),
        services.agents.teams.list({ count: 20 }).catch((e: Error) => {
          result.errors.push(`Failed to fetch teams: ${e.message}`);
          result.errorCount++;
          return [];
        }),
      ]);

      // Prepare all items for batch insert
      const items: Array<{
        userId: string;
        category: KBCategory;
        subcategory: string | null;
        title: string;
        content: string;
        summary: string | null;
        sourceId: string | null;
        sourceName: string | null;
      }> = [];

      // Add ticket types
      for (const type of ticketTypes) {
        items.push({
          userId,
          category: 'CONFIGURATION',
          subcategory: 'ticket_types',
          title: type.name,
          content: JSON.stringify(type),
          summary: type.description || `Ticket type: ${type.name}`,
          sourceId: String(type.id),
          sourceName: type.name,
        });
      }

      // Add statuses
      for (const status of statuses) {
        items.push({
          userId,
          category: 'CONFIGURATION',
          subcategory: 'statuses',
          title: status.name,
          content: JSON.stringify(status),
          summary: `Status: ${status.name} (${status.isOpen ? 'Open' : status.isClosed ? 'Closed' : 'Other'})`,
          sourceId: String(status.id),
          sourceName: status.name,
        });
      }

      // Add priorities
      for (const priority of priorities) {
        items.push({
          userId,
          category: 'CONFIGURATION',
          subcategory: 'priorities',
          title: priority.name,
          content: JSON.stringify(priority),
          summary: `Priority level: ${priority.name}${priority.isDefault ? ' (Default)' : ''}`,
          sourceId: String(priority.id),
          sourceName: priority.name,
        });
      }

      // Add agents
      for (const agent of agents) {
        items.push({
          userId,
          category: 'AGENTS',
          subcategory: 'agent',
          title: agent.name,
          content: JSON.stringify({
            id: agent.id,
            name: agent.name,
            email: agent.email,
            team: agent.teamName,
          }),
          summary: `Agent: ${agent.name}${agent.teamName ? ` - Team: ${agent.teamName}` : ''}`,
          sourceId: String(agent.id),
          sourceName: agent.name,
        });
      }

      // Add teams
      for (const team of teams) {
        items.push({
          userId,
          category: 'AGENTS',
          subcategory: 'team',
          title: team.name,
          content: JSON.stringify(team),
          summary: `Team: ${team.name}`,
          sourceId: String(team.id),
          sourceName: team.name,
        });
      }

      // For full sync, also get clients and more configuration
      if (syncMode === 'full') {
        const [clients, categories] = await Promise.all([
          services.clients.listActive({ count: 30 }).catch((e: Error) => {
            result.errors.push(`Failed to fetch clients: ${e.message}`);
            result.errorCount++;
            return [];
          }),
          services.configuration.listCategories({ count: 50 }).catch((e: Error) => {
            result.errors.push(`Failed to fetch categories: ${e.message}`);
            result.errorCount++;
            return [];
          }),
        ]);

        // Add client summary
        if (clients.length > 0) {
          items.push({
            userId,
            category: 'CLIENTS',
            subcategory: 'summary',
            title: 'Client Summary',
            content: JSON.stringify({
              totalClients: clients.length,
              clients: clients.map((c: Client) => ({
                id: c.id,
                name: c.name,
                openTickets: c.openTicketCount || 0,
              })),
            }),
            summary: `${clients.length} active clients in HaloPSA`,
            sourceId: null,
            sourceName: null,
          });

          // Add individual clients (limit to 20)
          for (const client of clients.slice(0, 20)) {
            items.push({
              userId,
              category: 'CLIENTS',
              subcategory: 'client',
              title: client.name,
              content: JSON.stringify({
                id: client.id,
                name: client.name,
                email: client.accountsEmailAddress,
                openTickets: client.openTicketCount,
              }),
              summary: `Client: ${client.name} - ${client.openTicketCount || 0} open tickets`,
              sourceId: String(client.id),
              sourceName: client.name,
            });
          }
        }

        // Add categories
        for (const category of categories) {
          items.push({
            userId,
            category: 'CONFIGURATION',
            subcategory: 'categories',
            title: category.name,
            content: JSON.stringify(category),
            summary: `Category: ${category.name}${category.parentId ? ` (Level ${category.level})` : ''}`,
            sourceId: String(category.id),
            sourceName: category.name,
          });
        }
      }

      // Batch upsert all items using a transaction
      if (items.length > 0) {
        await prisma.$transaction(async (tx) => {
          // Delete existing items for this user to replace with fresh data
          await tx.knowledgeBaseItem.deleteMany({
            where: { userId },
          });

          // Insert all new items
          await tx.knowledgeBaseItem.createMany({
            data: items,
          });
        });

        result.itemsAdded = items.length;
      }

      const duration = Date.now() - startTime;
      console.log(`[KB Sync] Completed in ${duration}ms. Added ${result.itemsAdded} items.`);

      // Update sync record as completed
      await prisma.knowledgeBaseSync.update({
        where: { id: sync.id },
        data: {
          status: result.errorCount > 0 && result.itemsAdded === 0 ? 'FAILED' :
                  result.errorCount > 0 ? 'PARTIAL' : 'COMPLETED',
          itemsAdded: result.itemsAdded,
          itemsUpdated: result.itemsUpdated,
          itemsRemoved: result.itemsRemoved,
          errorCount: result.errorCount,
          errors: result.errors,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        syncMode,
        itemsAdded: result.itemsAdded,
        itemsUpdated: result.itemsUpdated,
        itemsRemoved: result.itemsRemoved,
        errorCount: result.errorCount,
        durationMs: duration,
      });
    } catch (error) {
      console.error('[KB Sync] Error:', error);

      // Update sync record as failed
      await prisma.knowledgeBaseSync.update({
        where: { id: sync.id },
        data: {
          status: 'FAILED',
          errorCount: 1,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          completedAt: new Date(),
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Knowledge base sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get last sync
    const lastSync = await prisma.knowledgeBaseSync.findFirst({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
    });

    // Get item counts by category
    const itemCounts = await prisma.knowledgeBaseItem.groupBy({
      by: ['category'],
      where: { userId },
      _count: true,
    });

    const totalItems = await prisma.knowledgeBaseItem.count({
      where: { userId },
    });

    return NextResponse.json({
      lastSync: lastSync ? {
        id: lastSync.id,
        status: lastSync.status,
        syncType: lastSync.syncType,
        itemsAdded: lastSync.itemsAdded,
        itemsUpdated: lastSync.itemsUpdated,
        itemsRemoved: lastSync.itemsRemoved,
        errorCount: lastSync.errorCount,
        errors: lastSync.errors,
        syncedAt: lastSync.syncedAt,
        completedAt: lastSync.completedAt,
      } : null,
      totalItems,
      itemsByCategory: Object.fromEntries(
        itemCounts.map(c => [c.category, c._count])
      ),
      needsSync: !lastSync ||
        (lastSync.completedAt &&
         new Date().getTime() - new Date(lastSync.completedAt).getTime() > 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('[KB Sync] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
