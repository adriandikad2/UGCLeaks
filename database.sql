-- UGC Leaks Database Schema
-- PostgreSQL Schema for Roblox UGC Items and Scheduled Releases

-- Enum types
CREATE TYPE ugc_method AS ENUM ('Web Drop', 'In-Game', 'Unknown');

-- UGC Items table
CREATE TABLE IF NOT EXISTS ugc_items (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  creator_link VARCHAR(2048),
  stock INTEGER DEFAULT 1000,
  release_date_time TIMESTAMP NOT NULL,
  method ugc_method DEFAULT 'Unknown',
  instruction TEXT,
  game_link VARCHAR(2048),
  item_link VARCHAR(2048),
  image_url VARCHAR(2048),
  limit_per_user INTEGER DEFAULT 1,
  color VARCHAR(7), -- HEX color code for card border (#RRGGBB)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT FALSE
);

-- Scheduled Items table
CREATE TABLE IF NOT EXISTS scheduled_items (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  creator_link VARCHAR(2048),
  stock INTEGER DEFAULT 1000,
  release_date_time TIMESTAMP NOT NULL,
  method ugc_method DEFAULT 'Unknown',
  instruction TEXT,
  game_link VARCHAR(2048),
  item_link VARCHAR(2048),
  image_url VARCHAR(2048),
  limit_per_user INTEGER DEFAULT 1,
  color VARCHAR(7), -- HEX color code for card background gradient
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creators table (for tracking creator information)
CREATE TABLE IF NOT EXISTS creators (
  id SERIAL PRIMARY KEY,
  creator_name VARCHAR(255) UNIQUE NOT NULL,
  creator_link VARCHAR(2048),
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gradients/Colors table (for storing pre-generated random gradients)
CREATE TABLE IF NOT EXISTS color_gradients (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES ugc_items(id) ON DELETE CASCADE,
  scheduled_item_id INTEGER REFERENCES scheduled_items(id) ON DELETE CASCADE,
  color_1 VARCHAR(7) NOT NULL,
  color_2 VARCHAR(7) NOT NULL,
  color_3 VARCHAR(7) NOT NULL,
  color_4 VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_ugc_items_creator ON ugc_items(creator);
CREATE INDEX idx_ugc_items_method ON ugc_items(method);
CREATE INDEX idx_ugc_items_release_date ON ugc_items(release_date_time);
CREATE INDEX idx_ugc_items_published ON ugc_items(is_published);
CREATE INDEX idx_scheduled_items_creator ON scheduled_items(creator);
CREATE INDEX idx_scheduled_items_method ON scheduled_items(method);
CREATE INDEX idx_scheduled_items_release_date ON scheduled_items(release_date_time);
CREATE INDEX idx_creators_name ON creators(creator_name);
CREATE INDEX idx_color_gradients_item ON color_gradients(item_id);
CREATE INDEX idx_color_gradients_scheduled ON color_gradients(scheduled_item_id);

-- ============ AUTHENTICATION TABLES ============

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'editor', 'owner')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for authentication tables
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Sample data for testing
INSERT INTO ugc_items (title, item_name, creator, creator_link, stock, release_date_time, method, instruction, game_link, item_link, image_url, limit_per_user, color, is_published)
VALUES
  ('Neon Glow Visor', 'Neon Glow Visor', 'RobloxianCreations', 'https://www.roblox.com/users/1234567890/profile', 500, '2025-12-24 10:00:00', 'Web Drop', 'Visit https://www.roblox.com/catalog for drop information', 'https://www.roblox.com/games/123456', 'https://www.roblox.com/catalog', 'https://placehold.co/400x400?text=Neon+Visor', 3, '#ff006e', TRUE),
  ('Cosmic Backpack', 'Cosmic Backpack', 'StyleMaster', 'https://www.roblox.com/users/9876543210/profile', 250, '2025-12-25 15:30:00', 'In-Game', 'Join the game and visit the shop', 'https://www.roblox.com/games/654321', 'https://www.roblox.com/catalog/cosmic-backpack', 'https://placehold.co/400x400?text=Cosmic+Backpack', 1, '#00d9ff', TRUE),
  ('Diamond Crown', 'Diamond Crown', 'LuxeDesigns', NULL, 100, '2025-12-26 12:00:00', 'Web Drop', 'Check the official announcements', 'https://www.roblox.com/games/789456', '', 'https://placehold.co/400x400?text=Diamond+Crown', 2, '#ffbe0b', FALSE);
