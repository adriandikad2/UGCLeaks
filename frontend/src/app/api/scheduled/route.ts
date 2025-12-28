import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { requireRole } from '@/lib/auth-server';
import { sanitizeString, sanitizeUrl, truncateField, FIELD_LIMITS } from '@/lib/security';

/**
 * GET /api/scheduled
 * Fetch all scheduled items
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Cast release_date_time to text to prevent pg driver from treating it as local time
    // The database stores UTC times, but 'timestamp without time zone' is interpreted as local by the driver
    let query = `SELECT uuid, title, item_name, creator, stock, 
      release_date_time, method, instruction, game_link, item_link, 
      image_url, limit_per_user, ugc_code, is_abandoned, sold_out,
      final_current_stock, final_total_stock,
      TO_CHAR(release_date_time, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as release_date_time_utc 
      FROM scheduled_items ORDER BY release_date_time ASC`;
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
 * Create a new scheduled item (requires 'editor' role)
 */
export async function POST(request: Request) {
  // Require editor or owner role
  const authResult = requireRole(request, 'editor');
  if ('error' in authResult) {
    return authResult.error;
  }

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
      ugc_code,
      is_abandoned,
    } = body;

    if (!title || !item_name || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields: title, item_name, creator' },
        { status: 400 }
      );
    }

    const uuid = uuidv4();

    // Sanitize all text inputs
    const sanitizedTitle = truncateField(sanitizeString(title), FIELD_LIMITS.title);
    const sanitizedItemName = truncateField(sanitizeString(item_name), FIELD_LIMITS.item_name);
    const sanitizedCreator = truncateField(sanitizeString(creator), FIELD_LIMITS.creator);
    const sanitizedInstruction = truncateField(sanitizeString(instruction), FIELD_LIMITS.instruction);
    const sanitizedUgcCode = ugc_code ? truncateField(sanitizeString(ugc_code), FIELD_LIMITS.ugc_code) : null;

    // Validate and sanitize URLs
    const sanitizedGameLink = sanitizeUrl(game_link);
    const sanitizedItemLink = sanitizeUrl(item_link);
    const sanitizedImageUrl = sanitizeUrl(image_url);

    // Validate method is one of allowed values
    const allowedMethods = ['Web Drop', 'In-Game', 'Code Drop', 'Unknown'];
    const sanitizedMethod = allowedMethods.includes(method) ? method : 'Unknown';

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

    // Validate stock is a positive number
    const sanitizedStock = typeof stock === 'number' && stock >= 0 ? stock : 0;

    const result = await pool.query(
      `INSERT INTO scheduled_items (
        uuid, title, item_name, creator, stock, 
        release_date_time, method, instruction, game_link, item_link, 
        image_url, limit_per_user, ugc_code, is_abandoned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        uuid,
        sanitizedTitle,
        sanitizedItemName,
        sanitizedCreator,
        sanitizedStock,
        release_date_time,
        sanitizedMethod,
        sanitizedInstruction,
        sanitizedGameLink,
        sanitizedItemLink,
        sanitizedImageUrl,
        limitValue,
        sanitizedUgcCode,
        is_abandoned || false
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled item:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create scheduled item', details: errorMessage }, { status: 500 });
  }
}
