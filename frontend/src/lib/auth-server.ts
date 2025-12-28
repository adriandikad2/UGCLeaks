/**
 * Server-side authentication utilities for API routes
 */
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface TokenPayload {
    userId: string;
    email: string;
    role: 'user' | 'editor' | 'owner';
    iat?: number;
    exp?: number;
}

/**
 * Verify JWT token from Authorization header
 * Returns the decoded token payload or null if invalid
 */
export function verifyToken(request: Request): TokenPayload | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Check if user has required role level
 * Role hierarchy: user < editor < owner
 */
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
    const roles = ['user', 'editor', 'owner'];
    const userRoleIndex = roles.indexOf(userRole);
    const requiredRoleIndex = roles.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
}

/**
 * Middleware-like function to require authentication
 * Returns error response if not authenticated, or the decoded token if valid
 */
export function requireAuth(request: Request): { error: NextResponse } | { user: TokenPayload } {
    const decoded = verifyToken(request);

    if (!decoded) {
        return {
            error: NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        };
    }

    return { user: decoded };
}

/**
 * Middleware-like function to require specific role level
 * Returns error response if not authorized, or the decoded token if valid
 */
export function requireRole(request: Request, requiredRole: string = 'editor'): { error: NextResponse } | { user: TokenPayload } {
    const authResult = requireAuth(request);

    if ('error' in authResult) {
        return authResult;
    }

    if (!hasRequiredRole(authResult.user.role, requiredRole)) {
        return {
            error: NextResponse.json(
                { error: `Access denied. Required role: ${requiredRole}` },
                { status: 403 }
            )
        };
    }

    return authResult;
}
