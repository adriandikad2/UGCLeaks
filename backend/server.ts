import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.BACKEND_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon.tech
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ==================== UGC ITEMS ENDPOINTS ====================

/**
 * GET /api/items
 * Fetch all UGC items with optional filtering
 */
app.get('/api/items', async (req: Request, res: Response) => {
  try {
    const { creator, method, limit, offset } = req.query;
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
      params.push(parseInt(limit as string));
    }

    if (offset) {
      query += ' OFFSET $' + (params.length + 1);
      params.push(parseInt(offset as string));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/items/:id
 * Fetch a single UGC item by ID
 */
app.get('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM ugc_items WHERE uuid = $1 OR id = $2',
      [id, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * POST /api/items
 * Create a new UGC item
 */
app.post('/api/items', async (req: Request, res: Response) => {
  try {
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
    } = req.body;

    // Validation
    if (!title || !item_name || !creator || !release_date_time) {
      return res.status(400).json({
        error: 'Missing required fields: title, item_name, creator, release_date_time',
      });
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/**
 * PUT /api/items/:id
 * Update an existing UGC item
 */
app.put('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

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
      return res.status(400).json({ error: 'No valid fields to update' });
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
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * DELETE /api/items/:id
 * Delete a UGC item
 */
app.delete('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM ugc_items WHERE uuid = $1 OR id = $2 RETURNING *',
      [id, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ==================== SCHEDULED ITEMS ENDPOINTS ====================

/**
 * GET /api/scheduled
 * Fetch all scheduled items
 */
app.get('/api/scheduled', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    let query = 'SELECT * FROM scheduled_items ORDER BY release_date_time ASC';
    const params: any[] = [];

    if (limit) {
      query += ' LIMIT $' + (params.length + 1);
      params.push(parseInt(limit as string));
    }

    if (offset) {
      query += ' OFFSET $' + (params.length + 1);
      params.push(parseInt(offset as string));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scheduled items:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled items' });
  }
});

/**
 * POST /api/scheduled
 * Create a new scheduled item
 */
app.post('/api/scheduled', async (req: Request, res: Response) => {
  try {
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
    } = req.body;

    if (!title || !item_name || !creator || !release_date_time) {
      return res.status(400).json({
        error: 'Missing required fields: title, item_name, creator, release_date_time',
      });
    }

    const uuid = uuidv4();
    
    // LOGIC UPDATE: Handle 'Unlimited' string, -1 number, or explicit null
    const limitValue = (limit_per_user === 'Unlimited' || limit_per_user === -1 || limit_per_user === null) ? null : (parseInt(limit_per_user) || 1);
    
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating scheduled item:', error);
    res.status(500).json({ error: 'Failed to create scheduled item' });
  }
});

/**
 * DELETE /api/scheduled/:id
 * Delete a scheduled item
 */
app.delete('/api/scheduled/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ID is a UUID (contains hyphens) or numeric
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query: string;
    let params: any[];
    
    if (isUUID) {
      query = 'DELETE FROM scheduled_items WHERE uuid = $1 RETURNING *';
      params = [id];
    } else {
      query = 'DELETE FROM scheduled_items WHERE id = $1 RETURNING *';
      params = [parseInt(id)];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled item not found' });
    }

    res.json({ message: 'Scheduled item deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled item:', error);
    res.status(500).json({ error: 'Failed to delete scheduled item' });
  }
});

/**
 * PUT /api/scheduled/:id
 * Update a scheduled item
 */
app.put('/api/scheduled/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    const allowedFields = [
      'title', 'item_name', 'creator', 'stock', 'release_date_time',
      'method', 'instruction', 'game_link', 'item_link', 'image_url',
      'limit_per_user', 'color'
    ];

    // Build dynamic update query - exclude undefined, null, and empty strings
    allowedFields.forEach((field) => {
      const value = req.body[field];
      if (value !== undefined) { 
        // Special handling for limit_per_user
        if (field === 'limit_per_user') {
           if (value === 'Unlimited' || value === -1 || value === null) {
             updates[field] = null;
           } else {
             updates[field] = parseInt(value);
           }
        } else if (value !== null && value !== '') {
           updates[field] = value;
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updateFields = Object.keys(updates)
      .map((field, index) => `${field} = $${index + 1}`)
      .join(', ');
    const updateValues = Object.values(updates);

    // Check if ID is a UUID (contains hyphens) or numeric
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
      return res.status(404).json({ error: 'Scheduled item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating scheduled item:', error);
    res.status(500).json({ error: 'Failed to update scheduled item' });
  }
});

// ==================== AUTH ENDPOINTS ====================

/**
 * POST /api/auth/signup
 * Register a new user account
 */
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with that email or username' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user (they should be owner)
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;
    const role = isFirstUser ? 'owner' : 'user';

    // Create user
    const userId = uuidv4();
    const newUser = await pool.query(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, created_at',
      [userId, username, email, hashedPassword, role]
    );

    res.status(201).json({
      message: `Account created successfully! ${isFirstUser ? 'You are now the owner.' : 'Welcome!'}`,
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /api/auth/signin
 * Authenticate user and return JWT token
 */
app.post('/api/auth/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session record
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await pool.query(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [sessionId, user.id, token, expiresAt]
    );

    res.json({
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    // Don't expose internal error details to prevent exploitation
    res.status(500).json({ 
      error: 'Signin failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/signout
 * Logout user and invalidate token
 */
app.post('/api/auth/signout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Delete session
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Signout failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * GET /api/users/search
 * Search for users by username (owner only)
 */
app.get('/api/users/search', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { username } = req.query;

    // Verify token and check if user is owner
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can search users' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Search for user by username
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE username = $1',
      [username as string]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

/**
 * POST /api/auth/grant-access
 * Owner grants editor or owner role to another user
 */
app.post('/api/auth/grant-access', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { targetUserId, newRole } = req.body;

    // Validate new role
    if (!['editor', 'owner'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be "editor" or "owner"' });
    }

    // Verify token and check if user is owner
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can grant access' });
    }

    // Update target user's role
    const updatedUser = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
      [newRole, targetUserId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'Target user not found' });
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

    res.json({
      message: `User role updated to ${newRole}`,
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Grant access error:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: (error as any).message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💾 Database: Connected to Neon PostgreSQL`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Pool ended');
    process.exit(0);
  });
});
