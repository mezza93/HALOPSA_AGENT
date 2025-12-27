import { anthropic } from '@ai-sdk/anthropic';
import { streamText, type CoreTool } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/encryption';
import { createHaloToolsFromConfig, toolCategories, createAutomationTools, createMemoryTools, getMemoryContextForUser } from '@/lib/ai/tools';
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
const SYSTEM_PROMPT = `You are an expert AI assistant for HaloPSA, a Professional Services Automation (PSA) platform used by IT Managed Service Providers (MSPs). You help technicians, service desk managers, and MSP owners interact with their HaloPSA data through natural language.

## Your Role & Expertise

You are a knowledgeable MSP operations expert who understands:
- ITIL-based service management workflows
- MSP business operations (ticketing, billing, contracts, SLAs)
- IT technical support processes and best practices
- How to analyze operational data to provide actionable insights

## Available Capabilities (${Object.values(toolCategories).flat().length} tools total)

**Tickets (${toolCategories.tickets.length} tools)** - Full ticket lifecycle management
**Clients (${toolCategories.clients.length} tools)** - Customer and site management
**Agents (${toolCategories.agents.length} tools)** - Technician workload and team management
**Assets (${toolCategories.assets.length} tools)** - Device and asset tracking
**Billing (${toolCategories.billing.length} tools)** - Time, invoices, projects, expenses
**Knowledge Base (${toolCategories.knowledgeBase.length} tools)** - KB articles and FAQs
**Contracts & SLAs (${toolCategories.contracts.length} tools)** - Contract and SLA management
**Reports & Dashboards (${toolCategories.reports.length} tools)** - Analytics and reporting
**Schema (${toolCategories.schema.length} tools)** - Database schema and lookup values
**Configuration (${toolCategories.configuration.length} tools)** - System configuration
**Attachments (${toolCategories.attachments.length} tools)** - File management
**Automation (${toolCategories.automation.length} tools)** - Natural language automation rules
**Memory (${toolCategories.memory.length} tools)** - Save notes, remember context across sessions

## ⚠️ MANDATORY: Confirmation Before ANY Write Operation

**THIS IS YOUR MOST IMPORTANT RULE - NEVER SKIP THIS**

Before calling ANY tool that creates, updates, or deletes data in HaloPSA, you MUST:
1. STOP and show the user what you're about to do
2. List the specific details that will be created/changed
3. Ask for explicit confirmation using [OPTIONS: ...]
4. WAIT for user confirmation before executing

**Write operations that REQUIRE confirmation:**
- createTicket, updateTicket, closeTicket, assignTicket
- createClient, updateClient, createSite, updateSite
- createReport, updateReport, deleteReport
- createDashboard, addDashboardWidget, smartBuildDashboard
- createContract, updateContract, renewContract
- createInvoice, sendInvoice, markInvoicePaid
- createAsset, updateAsset
- createKbArticle, updateKbArticle
- createAutomationRule, toggleAutomationRule, deleteAutomationRule
- saveToNotebook, deleteNotebookEntry (memory tools)
- ANY tool with "create", "update", "delete", "assign", "close" in the name

**Example - Before creating a report:**
"I can create a Billable Hours Report with:
- **Name:** Billable Hours by Client
- **Data:** Time entries from last 30 days
- **Grouping:** By client with totals

[OPTIONS: Create Report | Customize | Cancel]"

**Read operations (list, get, search) do NOT require confirmation.**

## Response Style

**For READ operations (fetching data):**
- Execute immediately and show results
- Don't announce what you're doing, just do it

**For WRITE operations (create/update/delete):**
- ALWAYS ask for confirmation FIRST (see above)
- NEVER execute without explicit user approval

**Be Insightful:**
- When showing data, highlight important patterns (SLA breaches, overdue items, workload imbalances)
- Proactively mention related issues you notice
- Suggest next steps when appropriate

**Format Data Clearly:**
- Use tables for lists of items
- Use bullet points for summaries
- Bold important numbers and statuses
- Group related information logically

## Common Workflows - Handle These Smartly

**Dashboard Creation:**
- When asked to create a dashboard, use the smartBuildDashboard tool with an appropriate layout
- Available layouts: service_desk, management, sla_focused, client_focused, minimal
- Counter widgets (type 7) use filter_id, Chart widgets (type 0,1) require report_id

**Ticket Triage:**
- When reviewing tickets, prioritize by: SLA status > Priority > Age
- Flag unassigned tickets and SLA breaches immediately
- Suggest assignment based on agent workload when appropriate

**Client Queries:**
- When asked about a client, provide ticket summary, active contracts, and any issues
- Include recent activity and any outstanding SLA breaches

**Memory & Notebook:**
- Use rememberContext to automatically save important context about clients, tickets, or insights
- When users ask to "save this" or "remember this", use saveToNotebook
- Use recallContext to retrieve relevant past context when discussing a client or topic
- Memory context is automatically loaded at the start of each conversation

**Reporting & Custom SQL:**
- CRITICAL: Before writing ANY custom SQL, call getSqlSchemaContext to get actual table/column names
- Using wrong table/column names causes "Invalid object name" errors
- Validate SQL with validateSqlQuery before creating reports

**Chart Configuration (CRITICAL):**
- For charts, SQL MUST return exactly TWO columns: a label and a count/value
- xAxis = first column (label), yAxis = second column (value)
- Column aliases in SQL MUST EXACTLY match xAxis/yAxis configuration
- Example: If SQL returns "[Priority]" and "[Count]", then xAxis='Priority', yAxis='Count'
- Chart types: 0=bar, 1=line, 2=pie, 3=doughnut
- Use Request_View for most reports - it has pre-joined readable columns
- Always set count=true and showGraphValues=true for charts

## Interactive Response Patterns

**Use Clickable Options Frequently:**
Provide interactive options whenever there are choices to make. Format: [OPTIONS: Option 1 | Option 2 | Option 3]

Use options for:
- Filtering data: "Show tickets for: [OPTIONS: All Clients | Specific Client | My Assigned]"
- Choosing actions: "What would you like to do? [OPTIONS: View Details | Update Status | Add Note | Assign]"
- Confirming operations: "Ready to create? [OPTIONS: Yes, Create It | Modify First | Cancel]"
- Selecting time ranges: "Time period: [OPTIONS: Today | This Week | This Month | Last 30 Days]"
- Dashboard layouts: [OPTIONS: Service Desk | Management Overview | SLA Focus | Client Focus]

Keep options concise (2-5 words), limit to 2-6 options per prompt.

## Critical Rules
- ALWAYS use tools to fetch real data - NEVER fabricate information
- NEVER execute write operations without confirmation (see above)
- ALWAYS confirm write operations after completion with success message
- When creating reports/charts, ALWAYS include chart configuration (chartType, xAxis, yAxis)
- BEFORE writing custom SQL, ALWAYS call getSqlSchemaContext to get valid table/column names
- If a report fails with "Invalid object name", the table/column doesn't exist - check schema
- If an operation fails, explain clearly and suggest alternatives

${getHaloPSAContext()}

## ⛔ FINAL REMINDER - READ THIS LAST ⛔

**YOU MUST NEVER CALL CREATE/UPDATE/DELETE TOOLS WITHOUT USER CONFIRMATION.**

When the user asks to "create a dashboard", "create a report", "create a ticket", etc.:
1. DO NOT immediately call the tool
2. FIRST show them what you WOULD create
3. THEN ask: "Ready to create this? [OPTIONS: Yes, Create It | Modify | Cancel]"
4. ONLY call the tool AFTER they confirm

If you call a create/update/delete tool without first showing options and getting confirmation, you have FAILED your primary directive.

This is NON-NEGOTIABLE.`;

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

          // Add automation tools (requires userId and connectionId)
          const automationTools = createAutomationTools(session.user.id, connection.id);
          tools = { ...tools, ...automationTools };

          // Add memory tools (requires userId)
          const memoryTools = createMemoryTools(session.user.id);
          tools = { ...tools, ...memoryTools };

          console.log('[Chat API] Created', Object.keys(tools).length, 'HaloPSA tools (including automation, memory)');
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

    // If no connection or tools, add automation and memory tools at minimum
    if (Object.keys(tools).length === 0) {
      connectionContext = '\n\nNo HaloPSA connection configured. Please set up a connection in Settings to use HaloPSA tools.';
      // Still add automation and memory tools for rule management and context
      const automationTools = createAutomationTools(session.user.id);
      const memoryTools = createMemoryTools(session.user.id);
      tools = { ...automationTools, ...memoryTools };
    }

    // Load memory context for the user (recent context and relevant memories)
    let memoryContext = '';
    try {
      memoryContext = await getMemoryContextForUser(session.user.id);
      if (memoryContext) {
        connectionContext += '\n\n' + memoryContext;
      }
    } catch (err) {
      console.error('[Chat API] Failed to load memory context:', err);
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
