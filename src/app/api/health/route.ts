/**
 * Health check endpoint for debugging and monitoring.
 * GET /api/health - Returns system status (requires admin authentication)
 *
 * SECURITY: This endpoint requires admin authentication to prevent
 * information disclosure about system configuration.
 */

import { auth, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  // Check authentication - require admin for detailed checks
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const hasAdminAccess = isAdmin(session?.user?.role);

  // For unauthenticated requests, return minimal health info
  if (!isAuthenticated) {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // For authenticated non-admin users, return basic status
  if (!hasAdminAccess) {
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    return new Response(
      JSON.stringify({
        status: dbStatus === 'ok' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: dbStatus },
          auth: { status: 'ok' },
        },
      }),
      {
        status: dbStatus === 'ok' ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Admin-only: Full health check with detailed status
  const checks: Record<string, { status: 'ok' | 'error' | 'missing' }> = {};

  // Check environment variables (without exposing values)
  checks.anthropic_api_key = process.env.ANTHROPIC_API_KEY
    ? { status: 'ok' }
    : { status: 'missing' };

  checks.encryption_key = process.env.ENCRYPTION_KEY
    ? { status: 'ok' }
    : { status: 'missing' };

  checks.database_url = process.env.DATABASE_URL
    ? { status: 'ok' }
    : { status: 'missing' };

  checks.auth_secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)
    ? { status: 'ok' }
    : { status: 'missing' };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database_connection = { status: 'ok' };
  } catch {
    checks.database_connection = { status: 'error' };
  }

  checks.auth = { status: 'ok' };

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
