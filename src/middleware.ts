/**
 * Next.js Middleware for authentication, rate limiting, and security.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/chat', '/settings', '/knowledge-base', '/admin'];

// Routes that should redirect authenticated users
const authRoutes = ['/login', '/register'];

// API routes that need rate limiting
const rateLimitedRoutes = ['/api/chat', '/api/halopsa', '/api/upload'];

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Maximum entries before triggering cleanup (prevents unbounded growth)
const MAX_RATE_LIMIT_ENTRIES = 10000;

// Track last cleanup time to avoid cleaning on every request
let lastCleanupTime = 0;
const CLEANUP_INTERVAL_MS = 60000; // Clean up at most once per minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

/**
 * Clean up expired entries from the rate limit map.
 * Called lazily when map size exceeds threshold or periodically.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  // Don't clean up too frequently
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS && rateLimitMap.size < MAX_RATE_LIMIT_ENTRIES) {
    return;
  }

  lastCleanupTime = now;

  for (const [key, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Trigger cleanup if needed (prevents memory leak)
  if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES || now - lastCleanupTime >= CLEANUP_INTERVAL_MS) {
    cleanupExpiredEntries();
  }

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  const response = NextResponse.next();

  // Content Security Policy - allow OAuth and API connections
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://*.halopsa.com https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.halopsa.com https://api.anthropic.com https://accounts.google.com https://oauth2.googleapis.com",
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Rate limiting for API routes
  if (rateLimitedRoutes.some(route => pathname.startsWith(route))) {
    const key = getRateLimitKey(request);

    // Different limits for different endpoints
    let limit = 60; // Default: 60 requests per minute
    let windowMs = 60000;

    if (pathname.startsWith('/api/chat')) {
      limit = 30; // Chat: 30 requests per minute
    } else if (pathname.startsWith('/api/upload')) {
      limit = 10; // Upload: 10 requests per minute
    }

    const { allowed, remaining } = checkRateLimit(key, limit, windowMs);

    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }
  }

  // Skip auth checks for public routes
  if (pathname.startsWith('/api/auth') || pathname === '/' || pathname.startsWith('/_next') || pathname === '/roadmap') {
    return response;
  }

  // Get the session token
  // Note: In production, the cookie name is prefixed with __Secure-
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
    return response;
  }

  // Protect dashboard routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin access
    if (pathname.startsWith('/admin') && token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
