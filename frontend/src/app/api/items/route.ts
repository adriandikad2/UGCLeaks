import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/items
 * Fetch all UGC items with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get('creator');
    const method = searchParams.get('method');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let query = 'SELECT * FROM ugc_items WHERE 1=1';
    const params: any[] = [];

    if (creator) {
      query += ' AND creator ILIKE $' + (params.length + 1);
      params.push(`%${creator}%`);
    }

    if (method) {
      query += ' AND method = $' + (params.length + 1);
      params.push(method);
    }

    query += ' ORDER BY release_date_time DESC';

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
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

/**
 * POST /api/items
 * Create a new UGC item
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
    const result = await pool.query(
      `INSERT INTO ugc_items (
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
        limit_per_user || 1,
        color || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
