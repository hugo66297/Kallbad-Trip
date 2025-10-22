-- ============================================
-- KALLBAD TRIP - Optimized PostgreSQL Schema
-- ============================================
-- 
-- Based on project requirements:
-- - Real-time API data (HaV API)
-- - User-generated content (reviews, ratings)
-- - Admin moderation
-- - Visit tracking
--
-- Architecture: API data is fetched dynamically, 
-- only user data and references are stored in DB
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS visited_sites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bathing_sites CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Role and status
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.is_active IS 'Account status (for admin bans)';

-- ============================================
-- TABLE: bathing_sites
-- ============================================
CREATE TABLE bathing_sites (
    id SERIAL PRIMARY KEY,
    api_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Cached data for performance (optional)
    name VARCHAR(255),
    
    -- Sync tracking
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- NOTE: Quality, temperature, location, etc. 
    -- are fetched from HaV API in real-time!
    -- We only store the API reference here.
    
    CONSTRAINT chk_api_id_format CHECK (api_id ~ '^[A-Z]{2}.*$')
);

CREATE INDEX idx_bathing_sites_api_id ON bathing_sites(api_id);
CREATE INDEX idx_bathing_sites_last_synced ON bathing_sites(last_synced);

COMMENT ON TABLE bathing_sites IS 'Lightweight cache linking API IDs to user data';
COMMENT ON COLUMN bathing_sites.api_id IS 'HaV API bathing site identifier';
COMMENT ON COLUMN bathing_sites.last_synced IS 'Last time this site was referenced';

-- ============================================
-- TABLE: reviews
-- ============================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_api_id VARCHAR(255) NOT NULL, -- Reference to HaV API
    
    -- Review content
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    review_text TEXT,
    
    -- Moderation (admin features)
    is_approved BOOLEAN DEFAULT false,
    is_reported BOOLEAN DEFAULT false,
    moderated_by INTEGER REFERENCES users(id),
    moderation_date TIMESTAMP,
    moderation_notes TEXT,
    report_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_review_text_length CHECK (LENGTH(review_text) >= 10),
    CONSTRAINT chk_rating_value CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_site ON reviews(site_api_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);
CREATE INDEX idx_reviews_reported ON reviews(is_reported);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

COMMENT ON TABLE reviews IS 'User reviews and ratings for bathing sites';
COMMENT ON COLUMN reviews.site_api_id IS 'HaV API site identifier (not a foreign key)';
COMMENT ON COLUMN reviews.is_approved IS 'Admin approval status';
COMMENT ON COLUMN reviews.is_reported IS 'User report flag for moderation';

-- ============================================
-- TABLE: visited_sites
-- ============================================
CREATE TABLE visited_sites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_api_id VARCHAR(255) NOT NULL, -- Reference to HaV API
    
    -- Visit information
    visited_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Indexes
CREATE INDEX idx_visited_user ON visited_sites(user_id);
CREATE INDEX idx_visited_site ON visited_sites(site_api_id);
CREATE INDEX idx_visited_date ON visited_sites(visited_on DESC);

-- Unique index to prevent duplicate visits on same day
CREATE UNIQUE INDEX idx_unique_visit_per_day 
    ON visited_sites(user_id, site_api_id, (visited_on::DATE));

COMMENT ON TABLE visited_sites IS 'User visit history for bathing sites';
COMMENT ON COLUMN visited_sites.notes IS 'Personal notes about the visit';

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for reviews table
CREATE TRIGGER trigger_reviews_updated_at 
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_synced when site is referenced
CREATE OR REPLACE FUNCTION update_site_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert cache entry when a review or visit is created
    INSERT INTO bathing_sites (api_id, last_synced)
    VALUES (NEW.site_api_id, CURRENT_TIMESTAMP)
    ON CONFLICT (api_id) 
    DO UPDATE SET last_synced = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cache when review is added
CREATE TRIGGER trigger_review_update_cache
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_site_sync();

-- Trigger to update cache when visit is added
CREATE TRIGGER trigger_visit_update_cache
    AFTER INSERT ON visited_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_site_sync();

-- ============================================
-- VIEWS
-- ============================================

-- View: Site statistics
CREATE OR REPLACE VIEW site_statistics AS
SELECT 
    bsc.api_id as site_api_id,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT vs.id) as total_visits,
    MAX(r.created_at) as last_review_date,
    MAX(vs.visited_on) as last_visit_date
FROM bathing_sites bsc
LEFT JOIN reviews r ON bsc.api_id = r.site_api_id AND r.is_approved = true
LEFT JOIN visited_sites vs ON bsc.api_id = vs.site_api_id
GROUP BY bsc.api_id;

COMMENT ON VIEW site_statistics IS 'Aggregated statistics per bathing site';

-- View: User activity summary
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT vs.id) as total_visits,
    MAX(r.created_at) as last_review,
    MAX(vs.visited_on) as last_visit
FROM users u
LEFT JOIN reviews r ON u.id = r.user_id
LEFT JOIN visited_sites vs ON u.id = vs.user_id
GROUP BY u.id, u.username;

COMMENT ON VIEW user_activity IS 'User activity summary';

-- View: Pending moderation
CREATE OR REPLACE VIEW pending_moderation AS
SELECT 
    r.id,
    r.site_api_id,
    r.rating,
    r.review_text,
    r.is_reported,
    r.report_reason,
    r.created_at,
    u.username as author,
    u.email as author_email
FROM reviews r
JOIN users u ON r.user_id = u.id
WHERE r.is_approved = false OR r.is_reported = true
ORDER BY r.created_at DESC;

COMMENT ON VIEW pending_moderation IS 'Reviews pending admin moderation';

-- ============================================
-- INITIAL DATA
-- ============================================

-- Admin account (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES (
    'admin', 
    'admin@kallbad.se', 
    '$2b$10$rDYcPng9yVWkLQmwqR871exGx1SyBfFi9bG2yvoZZnVEkCbIOydKq',
    'Admin',
    'Kallbad',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Test user (password: user123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES (
    'testuser',
    'user@kallbad.se',
    '$2b$10$uO8Fj0p73mVQOw5lMBo60.icIPRiSpAPgqtxrsgcjXJcDRLz7SrtC',
    'Test',
    'User',
    'user'
)
ON CONFLICT (email) DO NOTHING;

-- Sample site references (will be populated when users interact)
-- Note: Real data comes from HaV API, these are just references
INSERT INTO bathing_sites (api_id, name)
VALUES 
    ('SE001', 'Sample Site 1'),
    ('SE002', 'Sample Site 2'),
    ('SE003', 'Sample Site 3')
ON CONFLICT (api_id) DO NOTHING;

-- Sample approved review
INSERT INTO reviews (user_id, site_api_id, rating, review_text, is_approved)
VALUES (
    2,
    'SE001',
    4.5,
    'Great bathing spot! Water was cold but refreshing.',
    true
);

-- Sample visit
INSERT INTO visited_sites (user_id, site_api_id, notes)
VALUES (
    2,
    'SE001',
    'Visited with family, had a great time!'
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Optimized database schema initialized successfully!' as message;
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

