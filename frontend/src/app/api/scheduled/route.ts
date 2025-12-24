import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/scheduled
 * Fetch all scheduled items
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let query = 'SELECT * FROM scheduled_items ORDER BY release_date_time ASC';
    const params: any[] = [];

    if (limit) {
      query += ' LIMIT $' + (params.length + 1);
      params.push(parseInt(limit));
    }

    if (offset) {
      query += ' OFFSET $' + (params.length + 1);
      params.push(parseInt(offset));
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching scheduled items:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Database URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    return NextResponse.json(
      { error: 'Failed to fetch scheduled items', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduled
 * Create a new scheduled item
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      item_name,
      creator,
      creator_link,
      stock,
      release_date_time,
      method,
      instruction,
      game_link,
      item_link,
      image_url,
      limit_per_user,
      color,
    } = body;

    if (!title || !item_name || !creator || !release_date_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, item_name, creator, release_date_time' },
        { status: 400 }
      );
    }

    const uuid = uuidv4();

    // LOGIC UPDATE: Handle 'Unlimited' string, -1 number, or explicit null
    let limitValue: number | null = 1;
    if (limit_per_user === 'Unlimited' || limit_per_user === -1 || limit_per_user === null || limit_per_user === undefined) {
      limitValue = null;
    } else if (typeof limit_per_user === 'string') {
      const parsed = parseInt(limit_per_user);
      limitValue = isNaN(parsed) ? null : parsed;
    } else if (typeof limit_per_user === 'number') {
      limitValue = limit_per_user === -1 ? null : limit_per_user;
    }

    const result = await pool.query(
      `INSERT INTO scheduled_items (
        uuid, title, item_name, creator, creator_link, stock, 
        release_date_time, method, instruction, game_link, item_link, 
        image_url, limit_per_user, color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        uuid,
        title,
        item_name,
        creator,
        creator_link || null,
        stock || 1000,
        release_date_time,
        method || 'Unknown',
        instruction || null,
        game_link || null,
        item_link || null,
        image_url || null,
        limitValue,
        color || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled item:', error);
    return NextResponse.json({ error: 'Failed to create scheduled item' }, { status: 500 });
  }
}
