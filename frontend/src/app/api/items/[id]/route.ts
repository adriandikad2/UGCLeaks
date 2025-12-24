import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/items/:id
 * Fetch a single UGC item by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await pool.query(
      'SELECT * FROM ugc_items WHERE uuid = $1 OR id = $2',
      [id, parseInt(id)]
    );

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
 * PUT /api/items/:id
 * Update an existing UGC item
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    // Build dynamic update query
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
        updateValues.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date());
    paramIndex++;

    updateValues.push(id);

    const query = `
      UPDATE ugc_items 
      SET ${updateFields.join(', ')}
      WHERE uuid = $${paramIndex} OR id = $${paramIndex}
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
 * DELETE /api/items/:id
 * Delete a UGC item
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      'DELETE FROM ugc_items WHERE uuid = $1 OR id = $2 RETURNING *',
      [id, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
