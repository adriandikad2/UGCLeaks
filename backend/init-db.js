#!/usr/bin/env node
/**
 * Database Initialization Script
 * Runs the database.sql schema on your PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false
});

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split SQL into individual statements and execute them separately
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code && (error.code === '42710' || error.code === '42P07' || error.message.includes('already exists'))) {
          console.log(`   ⚠️  ${error.message.split('\n')[0]}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Database schema initialized successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - ugc_items');
    console.log('   - scheduled_items');
    console.log('   - creators');
    console.log('   - color_gradients');
    console.log('   - users (for authentication)');
    console.log('   - sessions (for authentication)');
    console.log('   - audit_log (for authentication)');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

initializeDatabase();
