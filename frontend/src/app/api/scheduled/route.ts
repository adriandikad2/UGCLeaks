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
      release_date_time, method, instruction, game_link, game_links, item_link, 
      image_url, screenshots, limit_per_user, ugc_code, is_abandoned, is_paid, is_regular, sold_out,
      final_current_stock, final_total_stock, region_lock, restock_info,
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
      game_links,
      item_link,
      image_url,
      screenshots,
      limit_per_user,
      ugc_code,
      is_abandoned,
      is_paid,
      is_regular,
      region_lock,
      restock_info,
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

    // Sanitize game_links array
    const sanitizedGameLinks = Array.isArray(game_links)
      ? game_links.map((link: string) => sanitizeUrl(link)).filter((link: string | null) => link && link.length > 0)
      : (sanitizedGameLink ? [sanitizedGameLink] : []);

    // Sanitize screenshots array
    const sanitizedScreenshots = Array.isArray(screenshots)
      ? screenshots.map((url: string) => sanitizeUrl(url)).filter((url: string | null) => url && url.length > 0)
      : [];

    // Validate method is an array of allowed values
    const allowedMethods = ['Web Drop', 'In-Game', 'Code Drop', 'Quest', 'Launcher', 'J&C', 'Twitch Points', 'Unknown'];
    let sanitizedMethod = ['Unknown'];
    if (Array.isArray(method)) {
      sanitizedMethod = method.filter(m => allowedMethods.includes(m));
      if (sanitizedMethod.length === 0) sanitizedMethod = ['Unknown'];
    } else if (typeof method === 'string' && allowedMethods.includes(method)) {
      sanitizedMethod = [method];
    }

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

    // Validate stock is a positive number or -1 (unknown stock)
    const sanitizedStock = typeof stock === 'number' && (stock === -1 || stock >= 0) ? stock : 0;

    // Sanitize region_lock - must be a valid ISO country code or null
    const sanitizedRegionLock = region_lock && typeof region_lock === 'string' && region_lock.length <= 2
      ? region_lock.toUpperCase()
      : null;

    // Sanitize restock_info - validate it's a proper object with expected fields
    let sanitizedRestockInfo = null;
    if (restock_info && typeof restock_info === 'object') {
      const mode = restock_info.mode === 'manual' ? 'manual' : 'auto';
      const manual_type = restock_info.manual_type === 'date' ? 'date' : 'hours';
      let interval = typeof restock_info.interval_hours === 'number' && restock_info.interval_hours > 0 ? restock_info.interval_hours : 0;
      const t1Str = mode === 'manual' && restock_info.next_restock_time && typeof restock_info.next_restock_time === 'string' ? restock_info.next_restock_time : null;
      const t2Str = mode === 'manual' && manual_type === 'date' && restock_info.second_restock_time && typeof restock_info.second_restock_time === 'string' ? restock_info.second_restock_time : null;
      
      if (mode === 'manual' && manual_type === 'date' && t1Str && t2Str) {
        const d1 = new Date(t1Str).getTime();
        const d2 = new Date(t2Str).getTime();
        if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
          interval = Number(((d2 - d1) / 3600000).toFixed(2));
        }
      }
      sanitizedRestockInfo = {
        enabled: !!restock_info.enabled,
        mode,
        manual_type,
        interval_hours: interval,
        restock_amount: typeof restock_info.restock_amount === 'number' && restock_info.restock_amount > 0 ? restock_info.restock_amount : 0,
        next_restock_time: t1Str,
        second_restock_time: t2Str,
      };
      if (!sanitizedRestockInfo.enabled) sanitizedRestockInfo = null;
    }

    const result = await pool.query(
      `INSERT INTO scheduled_items (
        uuid, title, item_name, creator, stock, 
        release_date_time, method, instruction, game_link, game_links, item_link, 
        image_url, screenshots, limit_per_user, ugc_code, is_abandoned, is_paid, is_regular, region_lock, restock_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
        sanitizedGameLinks.length > 0 ? sanitizedGameLinks[0] : sanitizedGameLink,
        sanitizedGameLinks,
        sanitizedItemLink,
        sanitizedImageUrl,
        sanitizedScreenshots,
        limitValue,
        sanitizedUgcCode,
        is_abandoned || false,
        is_paid || false,
        is_regular || false,
        sanitizedRegionLock,
        sanitizedRestockInfo ? JSON.stringify(sanitizedRestockInfo) : null
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled item:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create scheduled item', details: errorMessage }, { status: 500 });
  }
}
