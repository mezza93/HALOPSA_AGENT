/**
 * AI test endpoint to diagnose issues.
 * GET /api/test-ai - Tests the Anthropic API connection (requires authentication)
 * POST /api/test-ai - Tests streaming like the chat endpoint (requires authentication)
 *
 * SECURITY: This endpoint requires authentication to prevent abuse.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { auth } from '@/lib/auth';

export async function GET() {
  // Require authentication
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    // SECURITY: Never expose API key prefix in production
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      ...checks,
      status: 'error',
      error: 'AI service not configured',
    }, { status: 500 });
  }

  try {
    // Try a simple non-streaming call
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: 'Say "Hello, the API is working!" in exactly those words.',
      maxTokens: 50,
    });

    return Response.json({
      ...checks,
      status: 'success',
      model: 'claude-sonnet-4-20250514',
      response: result.text,
      usage: {
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
      },
    });
  } catch (error) {
    // SECURITY: Don't expose detailed error info in production
    const message = error instanceof Error ? error.message : 'Unknown error';

    return Response.json({
      ...checks,
      status: 'error',
      error: process.env.NODE_ENV === 'development' ? message : 'AI service error',
    }, { status: 500 });
  }
}

// Test streaming like the chat endpoint does
export async function POST(req: Request) {
  // Require authentication
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { message = 'Say hello' } = body;

    // Limit message length to prevent abuse
    const sanitizedMessage = String(message).slice(0, 1000);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: 'You are a helpful assistant. Be brief.',
      messages: [{ role: 'user', content: sanitizedMessage }],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Test streaming error:', error);
    return Response.json({
      status: 'error',
      error: 'AI service error',
    }, { status: 500 });
  }
}
