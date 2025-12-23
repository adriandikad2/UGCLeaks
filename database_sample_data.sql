-- ============================================================================
-- UGC LEAKS - COMPLETE DATABASE SCHEMA WITH SAMPLE DATA
-- PostgreSQL Database for Neon.tech
-- ============================================================================
-- This SQL file creates all tables and populates them with comprehensive
-- sample data matching the mock data in the frontend application.
-- ============================================================================

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS color_gradients CASCADE;
DROP TABLE IF EXISTS scheduled_items CASCADE;
DROP TABLE IF EXISTS ugc_items CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TYPE IF EXISTS ugc_method CASCADE;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE ugc_method AS ENUM ('Web Drop', 'In-Game', 'Unknown');

-- ============================================================================
-- CREATORS TABLE
-- ============================================================================
-- Stores information about UGC item creators

CREATE TABLE creators (
  id SERIAL PRIMARY KEY,
  creator_name VARCHAR(255) UNIQUE NOT NULL,
  creator_link VARCHAR(500),
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick creator lookups
CREATE INDEX idx_creators_name ON creators(creator_name);

-- ============================================================================
-- UGC ITEMS TABLE
-- ============================================================================
-- Main table storing all UGC item information

CREATE TABLE ugc_items (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  creator_link VARCHAR(500),
  stock INTEGER,
  release_date_time TIMESTAMP NOT NULL,
  method ugc_method NOT NULL,
  instruction TEXT,
  game_link VARCHAR(500),
  item_link VARCHAR(500),
  image_url VARCHAR(500),
  limit_per_user INTEGER DEFAULT 1,
  color VARCHAR(7),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_creator FOREIGN KEY(creator) REFERENCES creators(creator_name) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX idx_ugc_items_creator ON ugc_items(creator);
CREATE INDEX idx_ugc_items_method ON ugc_items(method);
CREATE INDEX idx_ugc_items_release_date ON ugc_items(release_date_time);
CREATE INDEX idx_ugc_items_published ON ugc_items(is_published);
CREATE INDEX idx_ugc_items_uuid ON ugc_items(uuid);

-- ============================================================================
-- SCHEDULED ITEMS TABLE
-- ============================================================================
-- Stores items scheduled for future drops with same structure as ugc_items

CREATE TABLE scheduled_items (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  creator_link VARCHAR(500),
  stock INTEGER,
  release_date_time TIMESTAMP NOT NULL,
  method ugc_method NOT NULL,
  instruction TEXT,
  game_link VARCHAR(500),
  item_link VARCHAR(500),
  image_url VARCHAR(500),
  limit_per_user INTEGER DEFAULT 1,
  color VARCHAR(7),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scheduled_creator FOREIGN KEY(creator) REFERENCES creators(creator_name) ON DELETE SET NULL
);

-- Indexes for scheduled items
CREATE INDEX idx_scheduled_items_creator ON scheduled_items(creator);
CREATE INDEX idx_scheduled_items_method ON scheduled_items(method);
CREATE INDEX idx_scheduled_items_release_date ON scheduled_items(release_date_time);
CREATE INDEX idx_scheduled_items_published ON scheduled_items(is_published);

-- ============================================================================
-- COLOR GRADIENTS TABLE
-- ============================================================================
-- Stores the 4-color gradients used for animated card backgrounds

CREATE TABLE color_gradients (
  id SERIAL PRIMARY KEY,
  ugc_item_id INTEGER UNIQUE,
  color_1 VARCHAR(7) NOT NULL,
  color_2 VARCHAR(7) NOT NULL,
  color_3 VARCHAR(7) NOT NULL,
  color_4 VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_color_gradient FOREIGN KEY(ugc_item_id) REFERENCES ugc_items(id) ON DELETE CASCADE
);

-- ============================================================================
-- SAMPLE DATA - CREATORS
-- ============================================================================

INSERT INTO creators (creator_name, creator_link, item_count) VALUES
('RobloxianCreations', 'https://www.roblox.com/users/1234567890/profile', 1),
('StyleMaster', 'https://www.roblox.com/users/9876543210/profile', 1),
('LuxeDesigns', NULL, 1),
('DarkArtist', 'https://www.roblox.com/users/5555555555/profile', 1),
('FireCreator', NULL, 1),
('MysticArt', 'https://www.roblox.com/users/3333333333/profile', 1),
('TechGenius', NULL, 1),
('StarDesigner', 'https://www.roblox.com/users/7777777777/profile', 1),
('MysteryCreator', NULL, 1),
('LuxeCreator', 'https://www.roblox.com/users/9999999999/profile', 1);

-- ============================================================================
-- SAMPLE DATA - UGC ITEMS
-- ============================================================================
-- 10 sample items matching the frontend mock data

INSERT INTO ugc_items (
  uuid, title, item_name, creator, creator_link, stock, release_date_time,
  method, instruction, game_link, item_link, image_url, limit_per_user,
  color, is_published
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Neon Glow Visor',
  'Neon Glow Visor',
  'RobloxianCreations',
  'https://www.roblox.com/users/1234567890/profile',
  500,
  '2025-12-24 10:00:00',
  'Web Drop'::ugc_method,
  'Visit https://www.roblox.com/catalog for drop information. Use code NEON2025 if prompted.',
  'https://www.roblox.com/games/123456',
  'https://www.roblox.com/catalog',
  'https://placehold.co/400x400?text=Neon+Visor',
  3,
  '#ff006e',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Cosmic Backpack',
  'Cosmic Backpack',
  'StyleMaster',
  'https://www.roblox.com/users/9876543210/profile',
  250,
  '2025-12-25 15:30:00',
  'In-Game'::ugc_method,
  'Join the game and visit the shop. Link: https://www.roblox.com/games/654321',
  'https://www.roblox.com/games/654321',
  'https://www.roblox.com/catalog/cosmic-backpack',
  'https://placehold.co/400x400?text=Cosmic+Backpack',
  1,
  '#00d9ff',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Diamond Crown',
  'Diamond Crown',
  'LuxeDesigns',
  NULL,
  100,
  '2025-12-26 12:00:00',
  'Web Drop'::ugc_method,
  'Check the official announcements. More info at https://www.roblox.com/group-payment',
  'https://www.roblox.com/games/789456',
  '',
  'https://placehold.co/400x400?text=Diamond+Crown',
  2,
  '#ffbe0b',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Shadow Cloak',
  'Shadow Cloak',
  'DarkArtist',
  'https://www.roblox.com/users/5555555555/profile',
  300,
  '2025-12-27 08:00:00',
  'In-Game'::ugc_method,
  'Available in-game. Join https://www.roblox.com/games/111222',
  'https://www.roblox.com/games/111222',
  'https://www.roblox.com/catalog/shadow-cloak',
  'https://placehold.co/400x400?text=Shadow+Cloak',
  1,
  '#00ff41',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Flame Wings',
  'Flame Wings',
  'FireCreator',
  NULL,
  0,
  '2025-12-28 14:00:00',
  'Web Drop'::ugc_method,
  'Waiting for restock. See https://www.roblox.com/catalog for updates',
  '',
  '',
  'https://placehold.co/400x400?text=Flame+Wings',
  5,
  '#b54eff',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440006',
  'Crystal Amulet',
  'Crystal Amulet',
  'MysticArt',
  'https://www.roblox.com/users/3333333333/profile',
  150,
  '2025-12-29 11:00:00',
  'In-Game'::ugc_method,
  'Visit the mystical shop within the experience at https://www.roblox.com/games/333444',
  'https://www.roblox.com/games/333444',
  'https://www.roblox.com/catalog/crystal-amulet',
  'https://placehold.co/400x400?text=Crystal+Amulet',
  2,
  '#ff8c42',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'Holographic Visor',
  'Holographic Visor',
  'TechGenius',
  NULL,
  400,
  '2025-12-30 09:00:00',
  'Web Drop'::ugc_method,
  'Details coming soon. Check https://www.roblox.com for announcements',
  'https://www.roblox.com/games/555666',
  '',
  'https://placehold.co/400x400?text=Holographic+Visor',
  3,
  '#ff1744',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  'Celestial Halo',
  'Celestial Halo',
  'StarDesigner',
  'https://www.roblox.com/users/7777777777/profile',
  200,
  '2025-12-31 16:00:00',
  'In-Game'::ugc_method,
  'New Year special event. Join https://www.roblox.com/games/777888 to participate',
  'https://www.roblox.com/games/777888',
  'https://www.roblox.com/catalog/celestial-halo',
  'https://placehold.co/400x400?text=Celestial+Halo',
  1,
  '#2196f3',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440009',
  'Phantom Mask',
  'Phantom Mask',
  'MysteryCreator',
  NULL,
  75,
  '2026-01-01 10:00:00',
  'Web Drop'::ugc_method,
  'Secret drop announcement at https://www.roblox.com. Password required.',
  '',
  'https://www.roblox.com/catalog/phantom-mask',
  'https://placehold.co/400x400?text=Phantom+Mask',
  1,
  '#667eea',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440010',
  'Golden Gauntlets',
  'Golden Gauntlets',
  'LuxeCreator',
  'https://www.roblox.com/users/9999999999/profile',
  500,
  '2026-01-02 13:00:00',
  'In-Game'::ugc_method,
  'Limited run event. Check https://www.roblox.com/games/999111 for details',
  'https://www.roblox.com/games/999111',
  'https://www.roblox.com/catalog/golden-gauntlets',
  'https://placehold.co/400x400?text=Golden+Gauntlets',
  2,
  '#764ba2',
  true
);

-- ============================================================================
-- SAMPLE DATA - COLOR GRADIENTS
-- ============================================================================
-- 4-color gradients for each item

INSERT INTO color_gradients (ugc_item_id, color_1, color_2, color_3, color_4) VALUES
(1, '#ff006e', '#00d9ff', '#ffbe0b', '#00ff41'),
(2, '#00d9ff', '#ffbe0b', '#b54eff', '#ff8c42'),
(3, '#ffbe0b', '#00ff41', '#2196f3', '#667eea'),
(4, '#ff006e', '#764ba2', '#f093fb', '#4facfe'),
(5, '#00ff41', '#b54eff', '#ff8c42', '#ff1744'),
(6, '#2196f3', '#667eea', '#764ba2', '#f093fb'),
(7, '#ff1744', '#4facfe', '#ff006e', '#00d9ff'),
(8, '#ffbe0b', '#00ff41', '#b54eff', '#ff8c42'),
(9, '#667eea', '#764ba2', '#f093fb', '#4facfe'),
(10, '#ff006e', '#00d9ff', '#ffbe0b', '#2196f3');

-- ============================================================================
-- SAMPLE DATA - SCHEDULED ITEMS
-- ============================================================================
-- Future scheduled items

INSERT INTO scheduled_items (
  uuid, title, item_name, creator, creator_link, stock, release_date_time,
  method, instruction, game_link, item_link, image_url, limit_per_user,
  color, is_published
) VALUES
(
  '660e8400-e29b-41d4-a716-446655550001',
  'Cyber Boots',
  'Cyber Boots',
  'TechGenius',
  NULL,
  350,
  '2026-01-05 10:00:00',
  'Web Drop'::ugc_method,
  'Coming soon to catalog. Check announcements for official release date.',
  'https://www.roblox.com/games/555666',
  'https://www.roblox.com/catalog/cyber-boots',
  'https://placehold.co/400x400?text=Cyber+Boots',
  2,
  '#4facfe',
  false
),
(
  '660e8400-e29b-41d4-a716-446655550002',
  'Mystic Staff',
  'Mystic Staff',
  'MysticArt',
  'https://www.roblox.com/users/3333333333/profile',
  200,
  '2026-01-10 15:00:00',
  'In-Game'::ugc_method,
  'Exclusive wizard-themed event. Gather with friends and participate in the quests.',
  'https://www.roblox.com/games/333444',
  '',
  'https://placehold.co/400x400?text=Mystic+Staff',
  1,
  '#f093fb',
  false
),
(
  '660e8400-e29b-41d4-a716-446655550003',
  'Royal Scepter',
  'Royal Scepter',
  'LuxeCreator',
  'https://www.roblox.com/users/9999999999/profile',
  100,
  '2026-01-15 12:00:00',
  'Web Drop'::ugc_method,
  'Ultra-limited drop. Only 100 units will be released. First come, first served.',
  'https://www.roblox.com/games/999111',
  'https://www.roblox.com/catalog/royal-scepter',
  'https://placehold.co/400x400?text=Royal+Scepter',
  1,
  '#764ba2',
  false
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the data was inserted correctly

-- Check total items
-- SELECT COUNT(*) as total_items FROM ugc_items;

-- Check scheduled items
-- SELECT COUNT(*) as total_scheduled FROM scheduled_items;

-- Check creators
-- SELECT COUNT(*) as total_creators FROM creators;

-- Check color gradients
-- SELECT COUNT(*) as total_gradients FROM color_gradients;

-- ============================================================================
-- END OF DATABASE SETUP
-- ============================================================================
