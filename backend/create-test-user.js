#!/usr/bin/env node
/**
 * Create Test User for Authentication Testing
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false
});

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');
    
    const username = 'testuser';
    const email = 'test@example.com';
    const password = 'TestPassword123';
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      await pool.end();
      return;
    }
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, passwordHash, 'user']
    );
    
    console.log('✅ Test user created successfully!');
    console.log('\n👤 Test User Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Username: ${username}`);
    console.log(`   Role: user`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create test user:');
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
