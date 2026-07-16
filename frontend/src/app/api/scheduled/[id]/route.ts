import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireRole } from '@/lib/auth-server';
import { sanitizeString, sanitizeUrl, truncateField, FIELD_LIMITS } from '@/lib/security';

/**
 * DELETE /api/scheduled/:id
 * Delete a scheduled item (requires 'editor' role)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require editor or owner role
  const authResult = requireRole(request, 'editor');
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = params;

    // Check if ID is a UUID or numeric
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query: string;
    let queryParams: any[];

    if (isUUID) {
      query = 'DELETE FROM scheduled_items WHERE uuid = $1 RETURNING *';
      queryParams = [id];
    } else {
      query = 'DELETE FROM scheduled_items WHERE id = $1 RETURNING *';
      queryParams = [parseInt(id)];
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Scheduled item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Scheduled item deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled item:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled item' }, { status: 500 });
  }
}

/**
 * PUT /api/scheduled/:id
 * Update a scheduled item (requires 'editor' role)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require editor or owner role
  const authResult = requireRole(request, 'editor');
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // Ensure codes_info column exists without throwing on migration
    await pool.query('ALTER TABLE scheduled_items ADD COLUMN IF NOT EXISTS codes_info JSONB').catch((e: any) => console.error('Migration notice:', e.message));

    const { id } = params;
    const body = await request.json();
    const updates: any = {};
    const allowedFields = [
      'title',
      'item_name',
      'creator',
      'stock',
      'release_date_time',
      'method',
      'instruction',
      'game_link',
      'game_links',
      'item_link',
      'image_url',
      'screenshots',
      'limit_per_user',
      'sold_out',
      'final_current_stock',
      'final_total_stock',
      'ugc_code',
      'codes_info',
      'is_abandoned',
      'is_paid',
      'is_regular',
      'region_lock',
      'restock_info'
    ];

    // Fields that need text sanitization
    const textFields = ['title', 'item_name', 'creator', 'instruction', 'ugc_code'];
    // Fields that need URL sanitization
    const urlFields = ['game_link', 'item_link', 'image_url'];
    // Allowed methods
    const allowedMethods = ['Web Drop', 'In-Game', 'Code Drop', 'Quest', 'Launcher', 'J&C', 'Twitch Points', 'Unknown'];

    // Build dynamic update query with sanitization
    allowedFields.forEach((field) => {
      const value = body[field];
      if (value !== undefined) {
        // Special handling for limit_per_user
        if (field === 'limit_per_user') {
          if (value === 'Unlimited' || value === -1 || value === null) {
            updates[field] = null;
          } else {
            updates[field] = parseInt(value);
          }
        } else if (field === 'method') {
          // Validate method is allowed array
          if (Array.isArray(value)) {
            const validMethods = value.filter(m => allowedMethods.includes(m));
            updates[field] = validMethods.length > 0 ? validMethods : ['Unknown'];
          } else if (typeof value === 'string' && allowedMethods.includes(value)) {
            updates[field] = [value];
          } else {
            updates[field] = ['Unknown'];
          }
        } else if (field === 'game_links') {
          // Sanitize array of game links
          if (Array.isArray(value)) {
            updates[field] = value.map((link: string) => sanitizeUrl(link)).filter((link: string | null) => link && link.length > 0);
            // Also update the legacy game_link field to first link
            if (updates[field].length > 0) {
              updates['game_link'] = updates[field][0];
            }
          } else {
            updates[field] = [];
          }
        } else if (field === 'screenshots') {
          // Sanitize array of screenshot URLs
          if (Array.isArray(value)) {
            updates[field] = value.map((url: string) => sanitizeUrl(url)).filter((url: string | null) => url && url.length > 0);
          } else {
            updates[field] = [];
          }
        } else if (textFields.includes(field)) {
          // Sanitize text fields
          const limit = FIELD_LIMITS[field as keyof typeof FIELD_LIMITS] || 200;
          updates[field] = truncateField(sanitizeString(value), limit);
        } else if (urlFields.includes(field)) {
          // Sanitize URL fields
          updates[field] = sanitizeUrl(value);
        } else if (field === 'stock') {
          // Validate stock is a positive number or -1 (unknown stock)
          updates[field] = typeof value === 'number' && (value === -1 || value >= 0) ? value : 0;
        } else if (field === 'region_lock') {
          // Region lock: valid 2-char country code, empty string, or null to clear
          if (value === null || value === '' || value === 'none') {
            updates[field] = null;
          } else if (typeof value === 'string' && value.length <= 2) {
            updates[field] = value.toUpperCase();
          }
        } else if (field === 'codes_info') {
          if (Array.isArray(value) && value.length > 0) {
            const validCodes = value
              .map((c: any) => ({
                code: typeof c?.code === 'string' ? sanitizeString(c.code).trim() : (typeof c === 'string' ? sanitizeString(c).trim() : ''),
                uses: typeof c?.uses === 'number' && c.uses > 0 ? c.uses : (c?.uses === 'Unlimited' || c?.uses === null || c?.uses === -1 ? null : null)
              }))
              .filter((c: any) => c.code.length > 0);
            updates[field] = validCodes.length > 0 ? JSON.stringify(validCodes) : null;
            if (validCodes.length > 0) {
              updates['ugc_code'] = truncateField(validCodes.map((c: any) => c.code).join(', '), FIELD_LIMITS.ugc_code);
            }
          } else {
            updates[field] = null;
          }
        } else if (field === 'restock_info') {
          // Validate restock_info is a proper object
          if (value && typeof value === 'object' && value.enabled) {
            const mode = value.mode === 'manual' ? 'manual' : 'auto';
            const manual_type = value.manual_type === 'date' ? 'date' : 'hours';
            let interval = typeof value.interval_hours === 'number' && value.interval_hours > 0 ? value.interval_hours : 0;
            const t1Str = mode === 'manual' && value.next_restock_time && typeof value.next_restock_time === 'string' ? value.next_restock_time : null;
            const t2Str = mode === 'manual' && manual_type === 'date' && value.second_restock_time && typeof value.second_restock_time === 'string' ? value.second_restock_time : null;
            
            if (mode === 'manual' && manual_type === 'date' && t1Str && t2Str) {
              const d1 = new Date(t1Str).getTime();
              const d2 = new Date(t2Str).getTime();
              if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
                interval = Number(((d2 - d1) / 3600000).toFixed(2));
              }
            }
            updates[field] = JSON.stringify({
              enabled: true,
              mode,
              manual_type,
              interval_hours: interval,
              restock_amount: typeof value.restock_amount === 'number' && value.restock_amount > 0 ? value.restock_amount : 0,
              next_restock_time: t1Str,
              second_restock_time: t2Str,
            });
          } else {
            updates[field] = null;
          }
        } else if (value !== null && value !== '') {
          updates[field] = value;
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updateFields = Object.keys(updates)
      .map((field, index) => `${field} = $${index + 1}`)
      .join(', ');
    const updateValues = Object.values(updates);

    // Check if ID is a UUID or numeric
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query: string;
    if (isUUID) {
      updateValues.push(id);
      query = `UPDATE scheduled_items SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE uuid = $${updateValues.length} RETURNING *`;
    } else {
      updateValues.push(parseInt(id));
      query = `UPDATE scheduled_items SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${updateValues.length} RETURNING *`;
    }

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Scheduled item not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating scheduled item:', error);
    return NextResponse.json({ error: 'Failed to update scheduled item' }, { status: 500 });
  }
}
