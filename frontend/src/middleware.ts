import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { SECURITY_HEADERS } from '@/lib/security';

// ==================== RATE LIMIT CONFIG ====================
const RATE_LIMIT_WINDOW = 60;   // 60 seconds (1 minute)
const RATE_LIMIT_MAX     = 50;  // 50 requests per window per IP

/**
 * Next.js Edge Middleware
 * 1. IP-based rate limiting via Vercel KV (sliding window)
 * 2. Security headers on every response
 *
 * Runs at the Edge — drops abusive requests BEFORE they hit
 * Serverless Functions, protecting against Denial-of-Wallet attacks.
 */
export async function middleware(request: NextRequest) {
  // ---------- 1. Resolve client IP ----------
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
  const key = `rate_limit:${ip}`;

  // ---------- 2. Rate-limit check via Vercel KV ----------
  try {
    // INCR atomically increments the counter and returns the new value.
    // If the key doesn't exist yet, Redis sets it to 0 first, then increments → returns 1.
    const currentCount = await kv.incr(key);

    // If this is the FIRST request in the window (count === 1),
    // set the key to expire after RATE_LIMIT_WINDOW seconds.
    // This creates a "fixed window" that auto-resets.
    if (currentCount === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW);
    }

    // If the IP has exceeded the threshold, reject immediately.
    if (currentCount > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(RATE_LIMIT_WINDOW),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ---------- 3. Proceed with request + security headers ----------
    const response = NextResponse.next();

    // Apply security headers
    Object.entries(SECURITY_HEADERS).forEach(([headerKey, value]) => {
      response.headers.set(headerKey, value);
    });

    // Attach rate-limit info headers (useful for debugging / client awareness)
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - currentCount)));

    return response;
  } catch (error) {
    // ---------- 4. KV failure fallback ----------
    // If KV is unreachable (e.g. local dev without KV, or KV outage),
    // allow the request through with security headers — don't break the app.
    console.error('[Rate Limit] KV error, allowing request through:', error);

    const response = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([headerKey, value]) => {
      response.headers.set(headerKey, value);
    });
    return response;
  }
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, audio, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)',
  ],
};
