import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/encryption';
import { createHaloToolsFromConfig, toolCategories } from '@/lib/ai/tools';
import { getHaloPSAContext } from '@/lib/context/halopsa-context';

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

**Configuration (${toolCategories.configuration.length} tools)**
- List and manage custom fields
- View ticket statuses, types, priorities, categories
- Manage workflows (list, toggle on/off)
- Manage email and ticket templates

**Attachments (${toolCategories.attachments.length} tools)**
- List attachments on tickets
- Get attachment details
- Delete attachments
- Copy attachments between tickets

## Response Guidelines

When responding:
1. Be concise but thorough - provide relevant details without unnecessary verbosity
2. Format data in readable tables or lists when appropriate
3. Proactively offer insights (e.g., if asked about tickets, mention if there are SLA breaches)
4. For write operations (create, update, close), confirm what you did after completion
5. Use proper technical terminology appropriate for IT professionals
6. If an operation fails, explain what went wrong and suggest alternatives

## Critical Rules
- NEVER think out loud or show your reasoning process
- NEVER say things like "Let me think about this", "I'll analyze this", "First, I need to..."
- NEVER explain what you're about to do before doing it
- Just execute actions and provide results directly
- Be direct and action-oriented - skip preamble and explanations of your thought process

Always use the available tools to fetch real data - never make up information.

${getHaloPSAContext()}`;

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, connectionId, sessionId: existingSessionId } = await req.json();

    // Get connection details
    let tools = {};
    let connectionContext = '';

    // Try to find the specified connection, or fall back to user's default/first active connection
    let connection = null;
    if (connectionId) {
      connection = await prisma.haloConnection.findFirst({
        where: {
          id: connectionId,
          userId: session.user.id,
          isActive: true,
        },
      });
    }

    // Fallback: find user's default connection or first active one
    if (!connection) {
      connection = await prisma.haloConnection.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' },
        ],
      });
    }

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

      // Load knowledge base context for better AI responses
      try {
        const kbItems = await prisma.knowledgeBaseItem.findMany({
          where: { userId: session.user.id },
          select: {
            category: true,
            subcategory: true,
            title: true,
            summary: true,
          },
        });

        if (kbItems.length > 0) {
          // Group by category and build context
          const kbByCategory: Record<string, string[]> = {};
          for (const item of kbItems) {
            if (!kbByCategory[item.category]) {
              kbByCategory[item.category] = [];
            }
            kbByCategory[item.category].push(item.summary || item.title);
          }

          connectionContext += '\n\n## Your HaloPSA Configuration\n';
          for (const [category, items] of Object.entries(kbByCategory)) {
            const categoryLabel = category.replace('_', ' ').toLowerCase();
            connectionContext += `\n**${categoryLabel}:** ${items.slice(0, 10).join(', ')}${items.length > 10 ? ` (+${items.length - 10} more)` : ''}`;
          }
        }
      } catch (err) {
        console.error('Failed to load knowledge base context:', err);
      }
    }

    // If no connection or tools, use empty tools with a warning
    if (Object.keys(tools).length === 0) {
      connectionContext = '\n\nNo HaloPSA connection configured. Please set up a connection in Settings to use HaloPSA tools.';
    }

    // Get or create chat session
    let chatSessionId = existingSessionId;
    if (!chatSessionId && messages.length > 0) {
      // Create a new session with the first user message as title
      const firstUserMessage = messages.find((m: { role: string }) => m.role === 'user');
      const title = firstUserMessage?.content?.slice(0, 100) || 'New conversation';

      const chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          connectionId: connection?.id || null,
          title,
        },
      });
      chatSessionId = chatSession.id;
    }

    // Save the user's message to the database
    if (chatSessionId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        await prisma.chatMessage.create({
          data: {
            sessionId: chatSessionId,
            role: 'USER',
            content: typeof lastMessage.content === 'string'
              ? lastMessage.content
              : JSON.stringify(lastMessage.content),
          },
        });

        // Update session last message time
        await prisma.chatSession.update({
          where: { id: chatSessionId },
          data: { lastMessageAt: new Date() },
        });
      }
    }

    // Stream the response
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT + connectionContext,
      messages,
      tools,
      maxSteps: 15, // Allow multiple tool calls for complex operations
      onFinish: async ({ text, usage, toolCalls, toolResults }) => {
        // Save assistant message to database
        if (chatSessionId && text) {
          try {
            await prisma.chatMessage.create({
              data: {
                sessionId: chatSessionId,
                role: 'ASSISTANT',
                content: text,
                toolCalls: toolCalls ? JSON.stringify(toolCalls) : undefined,
                toolResults: toolResults ? JSON.stringify(toolResults) : undefined,
                inputTokens: usage?.promptTokens || 0,
                outputTokens: usage?.completionTokens || 0,
              },
            });

            // Update session token count
            await prisma.chatSession.update({
              where: { id: chatSessionId },
              data: {
                tokensUsed: {
                  increment: (usage?.promptTokens || 0) + (usage?.completionTokens || 0),
                },
              },
            });
          } catch (err) {
            console.error('Failed to save assistant message:', err);
          }
        }

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

    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact support.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        statusCode = 429;
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        errorMessage = 'Connection error. Please check your internet and try again.';
      } else if (error.message.includes('decrypt')) {
        errorMessage = 'HaloPSA connection error. Please reconfigure your connection in Settings.';
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
