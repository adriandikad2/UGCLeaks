import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// ==================== RATE LIMIT CONFIG ====================
const RATE_LIMIT_WINDOW = 60;   // 60 seconds (1 minute)
const RATE_LIMIT_MAX     = 50;  // 50 requests per window per IP

// ==================== SECURITY HEADERS ====================
// Inlined here because @/lib/security uses Node.js constructs
// (in-memory Map, etc.) that are incompatible with Edge Runtime.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://upload-widget.cloudinary.com https://widget.cloudinary.com https://va.vercel-scripts.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://apis.roblox.com https://thumbnails.roblox.com https://economy.roblox.com https://api.cloudinary.com https://res.cloudinary.com https://va.vercel-scripts.com",
    "frame-src https://upload-widget.cloudinary.com https://widget.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// ==================== UPSTASH REDIS CLIENT ====================
// Lazy-initialised so local dev without KV env vars doesn't crash on import.
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;        // KV not configured — skip rate limiting
  redis = new Redis({ url, token });
  return redis;
}

// ==================== HELPERS ====================

/** Apply security headers to a response object. */
function applySecurityHeaders(response: NextResponse): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

// ==================== MIDDLEWARE ====================

/**
 * Next.js Edge Middleware
 * 1. IP-based rate limiting via Upstash Redis (fixed-window counter)
 * 2. Security headers on every response
 *
 * Runs at the Edge — drops abusive requests BEFORE they invoke
 * Serverless Functions, protecting against Denial-of-Wallet attacks.
 *
 * Algorithm (Fixed Window Counter):
 *   • On each request we INCR a Redis key scoped to the client IP.
 *   • If the key is brand-new (count === 1) we set it to expire after
 *     RATE_LIMIT_WINDOW seconds — this starts the "window".
 *   • If the counter exceeds RATE_LIMIT_MAX we return 429.
 *   • Once the TTL expires Redis deletes the key and the window resets.
 *
 *   This is lightweight (1–2 Redis round-trips) and sufficient to stop
 *   volumetric floods.  A sliding-window-log approach is more precise
 *   but costs more KV operations per request.
 */
export async function middleware(request: NextRequest) {
  // ---------- 1. Resolve client IP ----------
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';

  // ---------- 2. Rate-limit check via Upstash Redis ----------
  const kv = getRedis();

  if (kv) {
    try {
      const key = `rate_limit:${ip}`;

      // INCR atomically creates-or-increments the counter.
      const currentCount = await kv.incr(key);

      // First request in the window → set expiry to auto-reset.
      if (currentCount === 1) {
        await kv.expire(key, RATE_LIMIT_WINDOW);
      }

      // Over the limit → reject immediately.
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

      // ---------- 3. Allow request + attach headers ----------
      const response = NextResponse.next();
      applySecurityHeaders(response);
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - currentCount)));
      return response;

    } catch (error) {
      // KV transient failure — let the request through, don't break the app.
      console.error('[Rate Limit] Redis error, allowing request:', error);
    }
  }

  // ---------- 4. Fallback: no KV or KV error → headers only ----------
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
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
