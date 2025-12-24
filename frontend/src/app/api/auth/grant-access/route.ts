import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * POST /api/auth/grant-access
 * Owner grants user, editor, or owner role to another user
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { targetUserId, newRole } = body;

    // Validate new role
    if (!['user', 'editor', 'owner'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user", "editor", or "owner"' },
        { status: 400 }
      );
    }

    // Verify token and check if user is owner
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can grant access' }, { status: 403 });
    }

    // Update target user's role
    const updatedUser = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
      [newRole, targetUserId]
    );

    if (updatedUser.rows.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Log the action in audit log
    await pool.query(
      'INSERT INTO audit_log (action, user_id, target_user_id, details) VALUES ($1, $2, $3, $4)',
      [
        'GRANT_ACCESS',
        decoded.userId,
        targetUserId,
        JSON.stringify({ newRole, previousRole: 'user' }),
      ]
    );

    return NextResponse.json({
      message: `User role updated to ${newRole}`,
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
  }
}
