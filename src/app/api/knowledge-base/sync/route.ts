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

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

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
        syncType: 'full',
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

      // Sync configuration data
      await syncConfiguration(userId, services, result);

      // Sync client data (summary only)
      await syncClients(userId, services, result);

      // Sync agent/team data
      await syncAgents(userId, services, result);

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
        itemsAdded: result.itemsAdded,
        itemsUpdated: result.itemsUpdated,
        itemsRemoved: result.itemsRemoved,
        errorCount: result.errorCount,
      });
    } catch (error) {
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

async function syncConfiguration(
  userId: string,
  services: ReturnType<typeof createHaloServices>,
  result: SyncResult
) {
  // Sync ticket types
  try {
    const ticketTypes = await services.configuration.listTicketTypes();
    for (const type of ticketTypes) {
      await upsertKBItem(userId, {
        category: 'CONFIGURATION',
        subcategory: 'ticket_types',
        title: type.name,
        content: JSON.stringify(type),
        summary: type.description || `Ticket type: ${type.name}`,
        sourceId: String(type.id),
        sourceName: type.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync ticket types: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync ticket statuses
  try {
    const statuses = await services.configuration.listTicketStatuses();
    for (const status of statuses) {
      await upsertKBItem(userId, {
        category: 'CONFIGURATION',
        subcategory: 'statuses',
        title: status.name,
        content: JSON.stringify(status),
        summary: `Status: ${status.name} (${status.isOpen ? 'Open' : status.isClosed ? 'Closed' : 'Other'})`,
        sourceId: String(status.id),
        sourceName: status.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync statuses: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync priorities
  try {
    const priorities = await services.configuration.listPriorities();
    for (const priority of priorities) {
      await upsertKBItem(userId, {
        category: 'CONFIGURATION',
        subcategory: 'priorities',
        title: priority.name,
        content: JSON.stringify(priority),
        summary: `Priority level: ${priority.name}${priority.isDefault ? ' (Default)' : ''}`,
        sourceId: String(priority.id),
        sourceName: priority.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync priorities: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync categories
  try {
    const categories = await services.configuration.listCategories({ count: 200 });
    for (const category of categories) {
      await upsertKBItem(userId, {
        category: 'CONFIGURATION',
        subcategory: 'categories',
        title: category.name,
        content: JSON.stringify(category),
        summary: `Category: ${category.name}${category.parentId ? ` (Level ${category.level})` : ''}`,
        sourceId: String(category.id),
        sourceName: category.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync categories: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync custom fields
  try {
    const customFields = await services.configuration.listCustomFields({ count: 200 });
    for (const field of customFields) {
      await upsertKBItem(userId, {
        category: 'CUSTOM_FIELDS',
        subcategory: field.table || 'general',
        title: field.label || field.name,
        content: JSON.stringify(field),
        summary: `Custom field: ${field.label || field.name} (${field.type})${field.isRequired ? ' - Required' : ''}`,
        sourceId: String(field.id),
        sourceName: field.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync custom fields: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync workflows
  try {
    const workflows = await services.configuration.listWorkflows({ count: 100 });
    for (const workflow of workflows) {
      await upsertKBItem(userId, {
        category: 'WORKFLOWS',
        subcategory: workflow.triggerType || 'general',
        title: workflow.name,
        content: JSON.stringify(workflow),
        summary: `Workflow: ${workflow.name} (${workflow.isActive ? 'Active' : 'Inactive'})`,
        sourceId: String(workflow.id),
        sourceName: workflow.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync workflows: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync email templates
  try {
    const emailTemplates = await services.configuration.listEmailTemplates({ count: 100 });
    for (const template of emailTemplates) {
      await upsertKBItem(userId, {
        category: 'TEMPLATES',
        subcategory: 'email',
        title: template.name,
        content: JSON.stringify(template),
        summary: `Email template: ${template.name} - Subject: ${template.subject}`,
        sourceId: String(template.id),
        sourceName: template.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync email templates: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  // Sync ticket templates
  try {
    const ticketTemplates = await services.configuration.listTicketTemplates({ count: 100 });
    for (const template of ticketTemplates) {
      await upsertKBItem(userId, {
        category: 'TEMPLATES',
        subcategory: 'ticket',
        title: template.name,
        content: JSON.stringify(template),
        summary: `Ticket template: ${template.name} - ${template.summary}`,
        sourceId: String(template.id),
        sourceName: template.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync ticket templates: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }
}

async function syncClients(
  userId: string,
  services: ReturnType<typeof createHaloServices>,
  result: SyncResult
) {
  try {
    const clients = await services.clients.listActive({ count: 200 });

    // Create a summary item for clients
    await upsertKBItem(userId, {
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
    }, result);

    // Add individual clients
    for (const client of clients.slice(0, 50)) { // Limit to top 50 for performance
      await upsertKBItem(userId, {
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
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync clients: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }
}

async function syncAgents(
  userId: string,
  services: ReturnType<typeof createHaloServices>,
  result: SyncResult
) {
  try {
    const agents = await services.agents.list({ count: 100 });

    for (const agent of agents) {
      await upsertKBItem(userId, {
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
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync agents: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }

  try {
    const teams = await services.agents.teams.list({ count: 50 });

    for (const team of teams) {
      await upsertKBItem(userId, {
        category: 'AGENTS',
        subcategory: 'team',
        title: team.name,
        content: JSON.stringify(team),
        summary: `Team: ${team.name}`,
        sourceId: String(team.id),
        sourceName: team.name,
      }, result);
    }
  } catch (e) {
    result.errors.push(`Failed to sync teams: ${e instanceof Error ? e.message : 'Unknown error'}`);
    result.errorCount++;
  }
}

async function upsertKBItem(
  userId: string,
  data: {
    category: string;
    subcategory: string | null;
    title: string;
    content: string;
    summary: string | null;
    sourceId: string | null;
    sourceName: string | null;
  },
  result: SyncResult
) {
  const existing = data.sourceId
    ? await prisma.knowledgeBaseItem.findFirst({
        where: {
          userId,
          category: data.category as KBCategory,
          sourceId: data.sourceId,
        },
      })
    : null;

  if (existing) {
    await prisma.knowledgeBaseItem.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        subcategory: data.subcategory,
        sourceName: data.sourceName,
      },
    });
    result.itemsUpdated++;
  } else {
    await prisma.knowledgeBaseItem.create({
      data: {
        userId,
        category: data.category as KBCategory,
        subcategory: data.subcategory,
        title: data.title,
        content: data.content,
        summary: data.summary,
        sourceId: data.sourceId,
        sourceName: data.sourceName,
      },
    });
    result.itemsAdded++;
  }
}
