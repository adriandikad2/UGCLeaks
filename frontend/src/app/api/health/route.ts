import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET() {
  try {
    console.log('Health check: DATABASE_URL =', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    const result = await pool.query('SELECT NOW()');
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      time: result.rows[0],
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      },
      { status: 503 }
    );
  }
}
