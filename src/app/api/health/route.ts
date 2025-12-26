/**
 * Health check endpoint for debugging and monitoring.
 * GET /api/health - Returns system status
 */

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error' | 'missing'; message?: string }> = {};

  // Check environment variables
  checks.anthropic_api_key = process.env.ANTHROPIC_API_KEY
    ? { status: 'ok' }
    : { status: 'missing', message: 'ANTHROPIC_API_KEY not set' };

  checks.encryption_key = process.env.ENCRYPTION_KEY
    ? { status: 'ok' }
    : { status: 'missing', message: 'ENCRYPTION_KEY not set' };

  checks.database_url = process.env.DATABASE_URL
    ? { status: 'ok' }
    : { status: 'missing', message: 'DATABASE_URL not set' };

  checks.auth_secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)
    ? { status: 'ok' }
    : { status: 'missing', message: 'AUTH_SECRET/NEXTAUTH_SECRET not set' };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database_connection = { status: 'ok' };
  } catch (error) {
    checks.database_connection = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check authentication
  try {
    const session = await auth();
    checks.auth = session?.user
      ? { status: 'ok', message: `Authenticated as ${session.user.email}` }
      : { status: 'ok', message: 'Not authenticated (anonymous request)' };
  } catch (error) {
    checks.auth = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Auth check failed',
    };
  }

  // Overall status
  const hasErrors = Object.values(checks).some(c => c.status === 'error');
  const hasMissing = Object.values(checks).some(c => c.status === 'missing');

  return new Response(
    JSON.stringify({
      status: hasErrors ? 'unhealthy' : hasMissing ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks,
    }),
    {
      status: hasErrors ? 503 : 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
