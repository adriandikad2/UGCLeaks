import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, clearRateLimit, getClientIp, isValidEmail, sanitizeString } from '@/lib/security';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Rate limit config: 5 attempts per 15 minutes, block for 30 minutes after exceeding
const SIGNIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
};

/**
 * POST /api/auth/signin
 * Authenticate user and return JWT token
 */
export async function POST(request: Request) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(`signin:${clientIp}`, SIGNIN_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(rateLimitResult.resetIn / 1000);
      return NextResponse.json(
        {
          error: rateLimitResult.blocked
            ? 'Too many failed attempts. Account temporarily locked.'
            : 'Too many signin attempts. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) }
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Find user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = userResult.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session record
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await pool.query(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [sessionId, user.id, token, expiresAt]
    );

    // Clear rate limit on successful login
    clearRateLimit(`signin:${clientIp}`);

    return NextResponse.json({
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    // Don't expose internal error details to prevent exploitation
    return NextResponse.json({ error: 'Signin failed. Please try again.' }, { status: 500 });
  }
}
