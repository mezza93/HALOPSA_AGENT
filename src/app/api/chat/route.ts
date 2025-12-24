import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/encryption';
import { createHaloToolsFromConfig, toolCategories } from '@/lib/ai/tools';

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are an AI assistant for HaloPSA, a Professional Services Automation (PSA) platform used by IT Managed Service Providers (MSPs). You help technicians and managers interact with their HaloPSA data through natural language.

## Available Capabilities

You have access to comprehensive tools organized by category:

**Tickets (${toolCategories.tickets.length} tools)**
- View, search, and filter tickets by status, client, agent, priority
- Create new tickets with full details
- Update tickets (summary, details, status, priority, assignment)
- Add notes/actions to tickets
- Close tickets individually or in bulk
- Merge duplicate tickets
- Find potential duplicate tickets
- View SLA-breached and unassigned tickets
- Get ticket statistics

**Clients (${toolCategories.clients.length} tools)**
- List and search clients
- View client details
- Create and update clients
- Manage sites and users/contacts

**Agents (${toolCategories.agents.length} tools)**
- List agents with workload information
- View agent details and workload stats
- List and view teams

**Assets (${toolCategories.assets.length} tools)**
- List and search assets/devices
- Track warranty expiration
- Create and update assets
- View asset statistics

**Billing (${toolCategories.billing.length} tools)**
- Track time entries
- Manage invoices (list, send, mark paid)
- Manage projects with budget tracking
- Track expenses

**Knowledge Base (${toolCategories.knowledgeBase.length} tools)**
- Search and browse KB articles
- Get article suggestions for tickets
- Create and update articles
- Manage FAQs

**Contracts & SLAs (${toolCategories.contracts.length} tools)**
- Manage contracts (create, update, renew)
- Track expiring contracts
- Configure SLAs and targets
- Manage recurring services

**Reports & Dashboards (${toolCategories.reports.length} tools)**
- Run and export reports
- Create custom reports with SQL
- Schedule automated reports
- Manage dashboards and widgets

## Response Guidelines

When responding:
1. Be concise but thorough - provide relevant details without unnecessary verbosity
2. Format data in readable tables or lists when appropriate
3. Proactively offer insights (e.g., if asked about tickets, mention if there are SLA breaches)
4. For write operations (create, update, close), confirm what you did after completion
5. Use proper technical terminology appropriate for IT professionals
6. If an operation fails, explain what went wrong and suggest alternatives

Always use the available tools to fetch real data - never make up information.`;

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, connectionId } = await req.json();

    // Get connection details
    let tools = {};
    let connectionContext = '';

    if (connectionId) {
      const connection = await prisma.haloConnection.findFirst({
        where: {
          id: connectionId,
          userId: session.user.id,
          isActive: true,
        },
      });

      if (connection) {
        connectionContext = `\n\nConnected to HaloPSA instance: ${connection.name} (${connection.baseUrl})`;

        // Decrypt credentials and create tools
        try {
          const clientId = decrypt(connection.clientId);
          const clientSecret = decrypt(connection.clientSecret);
          tools = createHaloToolsFromConfig({
            baseUrl: connection.baseUrl,
            clientId,
            clientSecret,
            tenant: connection.tenant || undefined,
          });
        } catch (err) {
          console.error('Failed to decrypt credentials:', err);
          connectionContext += '\n\nWarning: Unable to connect to HaloPSA. Please check your connection settings.';
        }

        // Update last used timestamp
        await prisma.haloConnection.update({
          where: { id: connection.id },
          data: { lastUsedAt: new Date() },
        });
      }
    }

    // If no connection or tools, use empty tools with a warning
    if (Object.keys(tools).length === 0) {
      connectionContext = '\n\nNo HaloPSA connection configured. Please set up a connection in Settings to use HaloPSA tools.';
    }

    // Stream the response
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT + connectionContext,
      messages,
      tools,
      maxSteps: 15, // Allow multiple tool calls for complex operations
      onFinish: async ({ usage }) => {
        // Log usage for billing
        if (usage) {
          try {
            await prisma.usageRecord.upsert({
              where: {
                userId_periodStart: {
                  userId: session.user.id,
                  periodStart: new Date(new Date().setDate(1)), // First of month
                },
              },
              create: {
                userId: session.user.id,
                periodStart: new Date(new Date().setDate(1)),
                periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
                chatRequests: 1,
              },
              update: {
                inputTokens: { increment: usage.promptTokens },
                outputTokens: { increment: usage.completionTokens },
                chatRequests: { increment: 1 },
              },
            });
          } catch (err) {
            console.error('Failed to log usage:', err);
          }
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
