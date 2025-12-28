import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security';

/**
 * Next.js Middleware
 * Applies security headers to all responses
 */
export function middleware(request: NextRequest) {
    // Get the response
    const response = NextResponse.next();

    // Apply security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // Add HSTS for production (uncomment when using HTTPS)
    // response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

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
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)',
    ],
};
