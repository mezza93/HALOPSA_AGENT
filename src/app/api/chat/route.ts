import { anthropic } from '@ai-sdk/anthropic';
import { streamText, type CoreTool } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/encryption';
import { createHaloToolsFromConfig, toolCategories } from '@/lib/ai/tools';
import { getHaloPSAContext } from '@/lib/context/halopsa-context';

// Log environment check on startup (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[Chat API] Environment check:', {
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}

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

## Clarifying Questions with Options
When you need to ask the user for clarification or offer choices, provide clickable options using this format:
[OPTIONS: Option 1 | Option 2 | Option 3 | Option 4]

Examples:
- "What type of dashboard would you like to create? [OPTIONS: Ticket Overview | SLA Performance | Agent Workload | Client Summary]"
- "Which widgets should I include? [OPTIONS: Open Ticket Count | Stale Tickets | Tickets by Priority | Tickets by Status]"
- "How would you like the tickets filtered? [OPTIONS: All Open | High Priority Only | My Tickets | Unassigned]"

The options will be displayed as clickable cards that the user can select. Keep options concise (2-5 words each) and limit to 2-6 options.

Always use the available tools to fetch real data - never make up information.

${getHaloPSAContext()}`;

export async function POST(req: Request) {
  try {
    // Check for required environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Chat API] Missing ANTHROPIC_API_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      console.error('[Chat API] No authenticated session');
      return new Response(
        JSON.stringify({ error: 'Please sign in to continue.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[Chat API] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, connectionId, sessionId: existingSessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get connection details
    let tools: Record<string, CoreTool> = {};
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
        if (!process.env.ENCRYPTION_KEY) {
          console.error('[Chat API] Missing ENCRYPTION_KEY environment variable');
          connectionContext += '\n\nWarning: Encryption not configured. Please contact support.';
        } else {
          const clientId = decrypt(connection.clientId);
          const clientSecret = decrypt(connection.clientSecret);
          tools = createHaloToolsFromConfig({
            baseUrl: connection.baseUrl,
            clientId,
            clientSecret,
            tenant: connection.tenant || undefined,
          });
          console.log('[Chat API] Created', Object.keys(tools).length, 'HaloPSA tools');
        }
      } catch (err) {
        console.error('[Chat API] Failed to decrypt credentials or create tools:', err);
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
    console.log('[Chat API] Starting stream with', Object.keys(tools).length, 'tools');

    let result;
    try {
      result = streamText({
        model: anthropic('claude-sonnet-4-20250514'),
        system: SYSTEM_PROMPT + connectionContext,
        messages,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
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
    } catch (streamError) {
      console.error('[Chat API] Stream creation error:', streamError);
      // Log full error details
      if (streamError instanceof Error) {
        console.error('[Chat API] Error name:', streamError.name);
        console.error('[Chat API] Error message:', streamError.message);
        console.error('[Chat API] Error stack:', streamError.stack);
        if ('cause' in streamError) {
          console.error('[Chat API] Error cause:', streamError.cause);
        }
      }
      const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown streaming error';

      // Check for specific Anthropic API errors
      if (errorMessage.includes('API key') || errorMessage.includes('api_key')) {
        return new Response(
          JSON.stringify({ error: 'AI service configuration error. Please contact support.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (errorMessage.includes('rate') || errorMessage.includes('429')) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'AI model configuration error. Please contact support.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw streamError; // Re-throw to be caught by outer handler
    }

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Chat API] Unhandled error:', error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('[Chat API] Error name:', error.name);
      console.error('[Chat API] Error message:', error.message);
      console.error('[Chat API] Error stack:', error.stack);
    }

    // Provide more specific error messages
    let errorMessage = 'Something went wrong. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('api key') || msg.includes('api_key') || msg.includes('unauthorized')) {
        errorMessage = 'AI service configuration error. Please contact support.';
      } else if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        statusCode = 429;
      } else if (msg.includes('connection') || msg.includes('timeout') || msg.includes('network') || msg.includes('econnrefused')) {
        errorMessage = 'Connection error. Please check your internet and try again.';
      } else if (msg.includes('decrypt') || msg.includes('encryption')) {
        errorMessage = 'HaloPSA connection error. Please reconfigure your connection in Settings.';
      } else if (msg.includes('prisma') || msg.includes('database')) {
        errorMessage = 'Database error. Please try again later.';
      } else if (msg.includes('model') || msg.includes('not found')) {
        errorMessage = 'AI model not available. Please try again later.';
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
