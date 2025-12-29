/**
 * Security Utilities Library
 * Comprehensive security measures for the UGC Leaks application
 */

// ==================== RATE LIMITING ====================

interface RateLimitEntry {
    count: number;
    resetTime: number;
    blocked: boolean;
    blockUntil?: number;
}

// In-memory rate limit store (consider Redis for production at scale)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    blockDurationMs?: number; // How long to block after exceeding (optional)
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number; blocked: boolean } {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Check if currently blocked
    if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.blockUntil - now,
            blocked: true
        };
    }

    // Reset if window expired
    if (!entry || now > entry.resetTime) {
        entry = {
            count: 0,
            resetTime: now + config.windowMs,
            blocked: false
        };
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
        if (config.blockDurationMs) {
            entry.blocked = true;
            entry.blockUntil = now + config.blockDurationMs;
        }
        rateLimitStore.set(key, entry);
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
            blocked: entry.blocked
        };
    }

    rateLimitStore.set(key, entry);
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
        blocked: false
    };
}

/**
 * Clear rate limit for an identifier (e.g., after successful login)
 */
export function clearRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        const entries = Array.from(rateLimitStore.entries());
        for (const [key, entry] of entries) {
            if (now > entry.resetTime && (!entry.blockUntil || now > entry.blockUntil)) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

// ==================== INPUT SANITIZATION ====================

/**
 * Sanitize string input to prevent XSS attacks
 * Escapes HTML special characters (not forward slashes to preserve URLs)
 */
export function sanitizeString(input: string | null | undefined): string {
    if (!input) return '';

    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

/**
 * Sanitize input but preserve certain safe HTML for display
 * Only use when you specifically need some formatting
 */
export function sanitizeWithAllowedTags(input: string): string {
    if (!input) return '';

    // First escape everything
    let sanitized = sanitizeString(input);

    // Then restore only safe tags (bold, italic, line breaks)
    sanitized = sanitized
        .replace(/&lt;b&gt;/gi, '<b>')
        .replace(/&lt;\/b&gt;/gi, '</b>')
        .replace(/&lt;i&gt;/gi, '<i>')
        .replace(/&lt;\/i&gt;/gi, '</i>')
        .replace(/&lt;br\s*\/?&gt;/gi, '<br>');

    return sanitized;
}

/**
 * Validate and sanitize URL
 * Returns sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
    if (!url) return '';

    const trimmed = String(url).trim();

    // Only allow http, https protocols
    if (!trimmed.match(/^https?:\/\//i)) {
        return '';
    }

    try {
        const parsed = new URL(trimmed);
        // Additional checks for malicious URLs
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return '';
        }
        // Block javascript: urls that might slip through
        if (parsed.href.toLowerCase().includes('javascript:')) {
            return '';
        }
        return parsed.href;
    } catch {
        return '';
    }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password complexity
 * Returns { valid: boolean, message: string }
 */
export function validatePasswordComplexity(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
        return { valid: false, message: 'Password must not exceed 128 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true, message: 'Password meets requirements' };
}

// ==================== FIELD LENGTH LIMITS ====================

export const FIELD_LIMITS = {
    title: 200,
    item_name: 200,
    creator: 100,
    instruction: 5000,
    game_link: 500,
    item_link: 500,
    image_url: 1000,
    ugc_code: 100,
    email: 254,
    username: 50,
    password: 128,
} as const;

/**
 * Truncate string to max length
 */
export function truncateField(value: string | null | undefined, maxLength: number): string {
    if (!value) return '';
    return String(value).slice(0, maxLength);
}

// ==================== REQUEST HELPERS ====================

/**
 * Extract client IP from request headers
 * Handles various proxy headers
 */
export function getClientIp(request: Request): string {
    // Check common proxy headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Take the first IP in the chain (original client)
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }

    // Fallback - in production, should always have one of the above
    return 'unknown';
}

/**
 * Validate request origin (basic CORS check)
 */
export function isValidOrigin(request: Request, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true; // Same-origin requests don't have origin header

    return allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        return origin === allowed || origin.endsWith(allowed);
    });
}

// ==================== SECURITY HEADERS ====================

export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://apis.roblox.com https://thumbnails.roblox.com https://economy.roblox.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; '),
} as const;
