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
      'item_link',
      'image_url',
      'limit_per_user',
      'sold_out',
      'final_current_stock',
      'final_total_stock',
      'ugc_code',
      'is_abandoned',
    ];

    // Fields that need text sanitization
    const textFields = ['title', 'item_name', 'creator', 'instruction', 'ugc_code'];
    // Fields that need URL sanitization
    const urlFields = ['game_link', 'item_link', 'image_url'];
    // Allowed methods
    const allowedMethods = ['Web Drop', 'In-Game', 'Code Drop', 'Unknown'];

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
          // Validate method is allowed
          updates[field] = allowedMethods.includes(value) ? value : 'Unknown';
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
