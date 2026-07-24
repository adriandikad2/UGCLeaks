import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Helper to determine if input is an integer or UUID
function parseIdParam(id: string) {
  const num = parseInt(id, 10);
  const isNum = !isNaN(num) && String(num) === id.trim();
  return { id, isNum, num };
}

/**
 * GET /api/items/[id]
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id, isNum, num } = parseIdParam(params.id);

    // Run targeted query to use single index lookup
    const query = isNum
      ? 'SELECT * FROM ugc_items WHERE id = $1'
      : 'SELECT * FROM ugc_items WHERE uuid = $1';

    const result = await pool.query(query, [isNum ? num : id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

/**
 * PUT /api/items/[id]
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id, isNum, num } = parseIdParam(params.id);
    const updates = await request.json();

    const allowedFields = [
      'title',
      'item_name',
      'creator',
      'creator_link',
      'stock',
      'release_date_time',
      'method',
      'instruction',
      'game_link',
      'item_link',
      'image_url',
      'limit_per_user',
      'color',
      'is_published',
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        if (key === 'method') {
          const val = updates[key];
          updateValues.push(Array.isArray(val) ? val : (val ? [val] : ['Unknown']));
        } else {
          updateValues.push(updates[key]);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date());
    paramIndex++;

    updateValues.push(isNum ? num : id);

    const whereClause = isNum ? `id = $${paramIndex}` : `uuid = $${paramIndex}`;
    const query = `
      UPDATE ugc_items 
      SET ${updateFields.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

/**
 * DELETE /api/items/[id]
 */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id, isNum, num } = parseIdParam(params.id);

    const query = isNum
      ? 'DELETE FROM ugc_items WHERE id = $1 RETURNING *'
      : 'DELETE FROM ugc_items WHERE uuid = $1 RETURNING *';

    const result = await pool.query(query, [isNum ? num : id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}