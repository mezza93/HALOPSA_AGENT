/**
 * Simple AI test endpoint to diagnose issues.
 * GET /api/test-ai - Tests the Anthropic API connection
 * POST /api/test-ai - Tests streaming like the chat endpoint
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...',
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      ...checks,
      status: 'error',
      error: 'ANTHROPIC_API_KEY is not set',
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
      usage: result.usage,
    });
  } catch (error) {
    const errorDetails: Record<string, unknown> = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    };

    if (error instanceof Error && 'cause' in error) {
      errorDetails.cause = String(error.cause);
    }

    return Response.json({
      ...checks,
      status: 'error',
      error: errorDetails,
    }, { status: 500 });
  }
}

// Test streaming like the chat endpoint does
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message = 'Say hello' } = body;

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: 'You are a helpful assistant. Be brief.',
      messages: [{ role: 'user', content: message }],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Test streaming error:', error);
    return Response.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
