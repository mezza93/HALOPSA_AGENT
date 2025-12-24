import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decryptCredentials } from '@/lib/utils/encryption';

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are an AI assistant for HaloPSA, a Professional Services Automation (PSA) platform used by IT Managed Service Providers (MSPs). You help technicians and managers interact with their HaloPSA data through natural language.

You have access to tools that let you:
- View, create, update, and manage tickets (support requests, incidents, service requests)
- View, create, and update clients/customers
- View agent/technician information and workloads
- View, create, and update assets/devices
- Generate reports, dashboards, and statistics

When responding:
1. Be concise but thorough - provide relevant details without unnecessary verbosity
2. Format data in readable tables or lists when appropriate
3. Proactively offer insights (e.g., if asked about tickets, mention if there are SLA breaches)
4. For write operations (create, update, close), confirm what you did after completion
5. Use proper technical terminology appropriate for IT professionals

Always use the available tools to fetch real data - never make up information.`;

// Define tools for the AI
const tools = {
  listTickets: tool({
    description: 'List tickets from HaloPSA with optional filters',
    parameters: z.object({
      status: z.enum(['open', 'closed', 'all']).optional().describe('Filter by ticket status'),
      clientId: z.number().optional().describe('Filter by client ID'),
      agentId: z.number().optional().describe('Filter by assigned agent ID'),
      priority: z.string().optional().describe('Filter by priority (P1, P2, P3, P4)'),
      limit: z.number().optional().default(20).describe('Maximum number of tickets to return'),
    }),
    execute: async ({ status, clientId, agentId, priority, limit }) => {
      // This would call the actual HaloPSA API
      // For now, return a placeholder
      return {
        message: 'Tool execution placeholder - implement HaloPSA API integration',
        params: { status, clientId, agentId, priority, limit },
      };
    },
  }),

  getTicketDetails: tool({
    description: 'Get detailed information about a specific ticket',
    parameters: z.object({
      ticketId: z.number().describe('The ticket ID to retrieve'),
    }),
    execute: async ({ ticketId }) => {
      return {
        message: 'Tool execution placeholder - implement HaloPSA API integration',
        ticketId,
      };
    },
  }),

  listClients: tool({
    description: 'List clients from HaloPSA',
    parameters: z.object({
      search: z.string().optional().describe('Search term for client name'),
      limit: z.number().optional().default(20).describe('Maximum number of clients to return'),
    }),
    execute: async ({ search, limit }) => {
      return {
        message: 'Tool execution placeholder - implement HaloPSA API integration',
        params: { search, limit },
      };
    },
  }),

  listAgents: tool({
    description: 'List agents/technicians and their workload',
    parameters: z.object({
      includeWorkload: z.boolean().optional().default(true).describe('Include ticket counts'),
    }),
    execute: async ({ includeWorkload }) => {
      return {
        message: 'Tool execution placeholder - implement HaloPSA API integration',
        includeWorkload,
      };
    },
  }),

  createTicket: tool({
    description: 'Create a new ticket in HaloPSA',
    parameters: z.object({
      summary: z.string().describe('Ticket summary/title'),
      details: z.string().describe('Ticket description'),
      clientId: z.number().describe('Client ID'),
      priority: z.string().optional().describe('Priority level'),
      assignTo: z.number().optional().describe('Agent ID to assign to'),
    }),
    execute: async ({ summary, details, clientId, priority, assignTo }) => {
      return {
        message: 'Tool execution placeholder - implement HaloPSA API integration',
        params: { summary, details, clientId, priority, assignTo },
      };
    },
  }),
};

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, connectionId } = await req.json();

    // Get connection details if provided
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

        // Update last used timestamp
        await prisma.haloConnection.update({
          where: { id: connection.id },
          data: { lastUsedAt: new Date() },
        });
      }
    }

    // Stream the response
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT + connectionContext,
      messages,
      tools,
      maxSteps: 10, // Allow multiple tool calls
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
