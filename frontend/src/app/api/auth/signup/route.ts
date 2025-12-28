import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  checkRateLimit,
  getClientIp,
  isValidEmail,
  validatePasswordComplexity,
  sanitizeString,
  FIELD_LIMITS,
  truncateField
} from '@/lib/security';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Rate limit config: 3 signups per hour per IP
const SIGNUP_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
};

/**
 * POST /api/auth/signup
 * Register a new user account
 */
export async function POST(request: Request) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(`signup:${clientIp}`, SIGNUP_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(rateLimitResult.resetIn / 1000);
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await request.json();
    const { username, email, password } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate and sanitize username
    const sanitizedUsername = truncateField(sanitizeString(username), FIELD_LIMITS.username);
    if (sanitizedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, sanitizedUsername]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists with that email or username' },
        { status: 409 }
      );
    }

    // Hash password (bcrypt with cost factor 12 for better security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if this is the first user (they should be owner)
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;
    const role = isFirstUser ? 'owner' : 'user';

    // Create user with sanitized username
    const userId = uuidv4();
    const newUser = await pool.query(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, created_at',
      [userId, sanitizedUsername, email, hashedPassword, role]
    );

    return NextResponse.json(
      {
        message: `Account created successfully! ${isFirstUser ? 'You are now the owner.' : 'Welcome!'}`,
        user: newUser.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
