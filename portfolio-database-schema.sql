-- 🎵🪢 PROFESSIONAL PORTFOLIO DATABASE SCHEMA
-- Supports SoulFra Universal Auth, Music Knot Theory, and Cal's Cookie System

-- Create database (run this first)
-- CREATE DATABASE portfolio_platform;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication and profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Allow NULL for social-only accounts
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'client', 'viewer')),
    bio TEXT,
    
    -- Social login integration
    linkedin_id VARCHAR(255),
    linkedin_url VARCHAR(255),
    google_id VARCHAR(255),
    github_id VARCHAR(255),
    github_url VARCHAR(255),
    avatar_url VARCHAR(255),
    
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    
    -- Authentication fields
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    verification_token VARCHAR(255),
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    preferred_login_method VARCHAR(50), -- 'email', 'linkedin', 'google', 'github'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    login_method VARCHAR(50), -- Track how they logged in
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cal's Cookie Monster System! 🍪
CREATE TABLE cal_cookies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    login_method VARCHAR(50) NOT NULL, -- 'linkedin', 'google', 'github', 'email'
    cookie_type VARCHAR(50) DEFAULT 'social_login',
    cookie_flavor VARCHAR(50) DEFAULT 'chocolate_chip', -- Different flavors for different actions!
    earned_at TIMESTAMP DEFAULT NOW(),
    consumed_at TIMESTAMP, -- When Cal "eats" the cookie
    
    -- Fun metadata
    cookie_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'jumbo'
    crumb_trail JSONB, -- Track the user journey that earned the cookie
    nom_sound_played BOOLEAN DEFAULT false
);

-- Social login providers tracking
CREATE TABLE social_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(50) NOT NULL UNIQUE, -- 'linkedin', 'google', 'github'
    provider_config JSONB NOT NULL, -- OAuth configs, endpoints, etc.
    enabled BOOLEAN DEFAULT true,
    cookie_reward_multiplier DECIMAL(3,2) DEFAULT 1.0, -- How many cookies Cal gets per login
    last_used TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50), -- 'technical', 'music', 'business', etc.
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    
    -- Project details
    technologies JSONB, -- Array of technologies used
    demo_url VARCHAR(255),
    github_url VARCHAR(255),
    live_url VARCHAR(255),
    
    -- Music knot integration
    knot_type VARCHAR(50), -- trefoil, figure-eight, etc.
    musical_mapping JSONB, -- notes, rhythm, etc.
    complexity_score DECIMAL(3,2), -- Affects music generation
    
    -- Social integration
    auto_synced_from VARCHAR(50), -- 'github', 'linkedin', etc.
    external_id VARCHAR(255), -- ID from external service
    
    -- Display settings
    featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'clients_only')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client management
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    
    -- Project relationship
    project_type VARCHAR(100),
    budget_range VARCHAR(50),
    timeline VARCHAR(100),
    status VARCHAR(20) DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'completed', 'cancelled')),
    
    -- Communication
    notes TEXT,
    last_contact TIMESTAMP,
    next_followup TIMESTAMP,
    
    -- Cal cookies earned from this client relationship
    cookies_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client reviews and testimonials
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Display settings
    featured BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT false,
    public_display BOOLEAN DEFAULT false,
    
    -- Cal's cookie reward for positive reviews
    cal_cookie_bonus INTEGER DEFAULT 0,
    
    -- Metadata
    submitted_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Skills and capabilities with enhanced music knot mapping
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'programming', 'framework', 'tool', 'soft_skill'
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    
    -- Music knot mapping
    knot_type VARCHAR(50),
    musical_notes JSONB, -- Array of MIDI notes
    rhythm_pattern VARCHAR(50),
    tempo INTEGER DEFAULT 120,
    scale_type VARCHAR(50) DEFAULT 'major',
    
    -- Social sync
    synced_from_github BOOLEAN DEFAULT false,
    synced_from_linkedin BOOLEAN DEFAULT false,
    auto_detected BOOLEAN DEFAULT false,
    
    -- Analytics
    times_played INTEGER DEFAULT 0, -- How often this skill's music was generated
    last_played TIMESTAMP,
    
    -- Display
    featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Experience timeline
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job details
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'freelance'
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for current position
    current_position BOOLEAN DEFAULT false,
    
    -- Content
    description TEXT,
    achievements JSONB, -- Array of achievement strings
    technologies_used JSONB, -- Array of technologies
    
    -- Social sync
    synced_from_linkedin BOOLEAN DEFAULT false,
    linkedin_position_id VARCHAR(255),
    
    -- Display
    featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced music knot configurations
CREATE TABLE music_knots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    knot_type VARCHAR(50) NOT NULL,
    
    -- Musical mapping
    base_notes JSONB NOT NULL, -- Array of MIDI notes
    rhythm_pattern VARCHAR(100),
    tempo INTEGER DEFAULT 120,
    scale_type VARCHAR(50) DEFAULT 'major',
    duration_ms INTEGER DEFAULT 3000,
    
    -- Knot mathematics
    crossing_number INTEGER,
    knot_polynomial TEXT,
    complexity_score DECIMAL(3,2),
    bridge_number INTEGER,
    unknotting_number INTEGER,
    
    -- Social media complexity modifier
    social_complexity_bonus DECIMAL(3,2) DEFAULT 0.0,
    
    -- Usage
    associated_skill VARCHAR(100),
    associated_project UUID REFERENCES projects(id) ON DELETE SET NULL,
    times_generated INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio analytics with Cal cookie integration
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'skill_click', 'music_generation', 'project_view', 'cal_cookie_earned'
    event_data JSONB,
    
    -- Context
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(255),
    
    -- Cal cookie tracking
    cal_cookies_earned INTEGER DEFAULT 0,
    cookie_earning_reason VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- API details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Request data
    request_size INTEGER,
    response_size INTEGER,
    error_message TEXT,
    
    -- Social login tracking
    social_provider VARCHAR(50),
    oauth_step VARCHAR(50), -- 'authorize', 'token_exchange', 'profile_fetch'
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- System configuration with Cal stats
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_linkedin_id ON users(linkedin_id);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_github_id ON users(github_id);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_revoked ON user_sessions(revoked);
CREATE INDEX idx_user_sessions_login_method ON user_sessions(login_method);

CREATE INDEX idx_cal_cookies_user_id ON cal_cookies(user_id);
CREATE INDEX idx_cal_cookies_login_method ON cal_cookies(login_method);
CREATE INDEX idx_cal_cookies_earned_at ON cal_cookies(earned_at);
CREATE INDEX idx_cal_cookies_consumed_at ON cal_cookies(consumed_at);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_knot_type ON projects(knot_type);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_contact_email ON clients(contact_email);

CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_reviews_project_id ON reviews(project_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_reviews_public_display ON reviews(public_display);

CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_featured ON skills(featured);
CREATE INDEX idx_skills_knot_type ON skills(knot_type);
CREATE INDEX idx_skills_times_played ON skills(times_played);

CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_experiences_current ON experiences(current_position);
CREATE INDEX idx_experiences_dates ON experiences(start_date, end_date);
CREATE INDEX idx_experiences_linkedin_sync ON experiences(synced_from_linkedin);

CREATE INDEX idx_music_knots_user_id ON music_knots(user_id);
CREATE INDEX idx_music_knots_type ON music_knots(knot_type);
CREATE INDEX idx_music_knots_skill ON music_knots(associated_skill);
CREATE INDEX idx_music_knots_times_generated ON music_knots(times_generated);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_cal_cookies ON analytics_events(cal_cookies_earned);

CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_api_usage_social_provider ON api_usage(social_provider);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('portfolio_settings', '{"theme": "professional", "music_enabled": true, "analytics_enabled": true}', 'Main portfolio configuration'),
('music_knot_defaults', '{"trefoil": {"notes": [60, 64, 67], "rhythm": "steady"}, "figure_eight": {"notes": [62, 65, 69], "rhythm": "smooth"}}', 'Default music knot mappings'),
('auth_settings', '{"jwt_expiry": "7d", "password_min_length": 8, "require_email_verification": false}', 'Authentication configuration'),
('linkedin_integration', '{"sync_enabled": true, "auto_update": true, "fields": ["name", "headline", "summary", "positions"]}', 'LinkedIn API integration settings'),
('cal_stats', '{"cookie_count": 0, "happiness_level": "hungry", "favorite_flavor": "chocolate_chip", "nom_sounds_enabled": true}', 'Cal Cookie Monster statistics'),
('social_providers', '{"linkedin": {"enabled": true, "cookie_multiplier": 1.5}, "google": {"enabled": true, "cookie_multiplier": 1.2}, "github": {"enabled": true, "cookie_multiplier": 1.3}}', 'Social provider configurations');

-- Insert social providers
INSERT INTO social_providers (provider_name, provider_config, cookie_reward_multiplier) VALUES
('linkedin', '{"auth_url": "https://www.linkedin.com/oauth/v2/authorization", "token_url": "https://www.linkedin.com/oauth/v2/accessToken", "profile_url": "https://api.linkedin.com/v2/people/~", "scopes": ["r_liteprofile", "r_emailaddress"]}', 1.5),
('google', '{"auth_url": "https://accounts.google.com/o/oauth2/v2/auth", "token_url": "https://oauth2.googleapis.com/token", "profile_url": "https://www.googleapis.com/oauth2/v2/userinfo", "scopes": ["profile", "email"]}', 1.2),
('github', '{"auth_url": "https://github.com/login/oauth/authorize", "token_url": "https://github.com/login/oauth/access_token", "profile_url": "https://api.github.com/user", "scopes": ["user:email", "read:user"]}', 1.3);

-- Create initial admin user (password: 'admin123' - CHANGE IN PRODUCTION)
INSERT INTO users (email, password_hash, name, role, active, email_verified, preferred_login_method) VALUES
('admin@portfolio.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0/AxcPYc8C', 'Portfolio Admin', 'admin', true, true, 'email');

-- Sample skills with enhanced music mappings
INSERT INTO skills (user_id, name, category, proficiency_level, knot_type, musical_notes, rhythm_pattern, tempo, scale_type, featured) 
SELECT 
    id,
    unnest(ARRAY['JavaScript', 'Python', 'React', 'Node.js', 'AI/ML', 'Blockchain', 'Swift', 'Music Theory']),
    unnest(ARRAY['programming', 'programming', 'framework', 'framework', 'technology', 'technology', 'programming', 'creative']),
    unnest(ARRAY[5, 4, 5, 4, 3, 3, 4, 5]),
    unnest(ARRAY['trefoil', 'figure_eight', 'square', 'granny', 'torus', 'chain', 'loop', 'spiral']),
    unnest(ARRAY['[60, 64, 67, 72]', '[62, 65, 69, 74]', '[64, 67, 71, 76]', '[57, 60, 64, 69]', '[55, 58, 62, 67, 70]', '[53, 57, 60, 65]', '[65, 69, 72, 77]', '[60, 62, 64, 65, 67, 69, 71, 72]']::jsonb),
    unnest(ARRAY['steady', 'smooth', 'dynamic', 'fast', 'complex', 'secure', 'elegant', 'harmonic']),
    unnest(ARRAY[120, 100, 140, 160, 90, 110, 130, 105]),
    unnest(ARRAY['major', 'dorian', 'mixolydian', 'minor', 'harmonic_minor', 'chromatic', 'pentatonic', 'lydian']),
    unnest(ARRAY[true, true, true, true, true, false, false, true])
FROM users WHERE email = 'admin@portfolio.com';

-- Sample music knots with mathematical properties
INSERT INTO music_knots (user_id, name, knot_type, base_notes, rhythm_pattern, tempo, scale_type, crossing_number, complexity_score, associated_skill) 
SELECT 
    id,
    unnest(ARRAY['JavaScript Trefoil', 'Python Figure-Eight', 'React Square Knot', 'AI Torus Loop']),
    unnest(ARRAY['trefoil', 'figure_eight', 'square', 'torus']),
    unnest(ARRAY['[60, 64, 67]', '[62, 65, 69]', '[64, 67, 71]', '[55, 58, 62, 67]']::jsonb),
    unnest(ARRAY['steady', 'smooth', 'dynamic', 'complex']),
    unnest(ARRAY[120, 100, 140, 90]),
    unnest(ARRAY['major', 'dorian', 'mixolydian', 'harmonic_minor']),
    unnest(ARRAY[3, 4, 6, 0]),
    unnest(ARRAY[1.5, 2.1, 1.8, 3.2]),
    unnest(ARRAY['JavaScript', 'Python', 'React', 'AI/ML'])
FROM users WHERE email = 'admin@portfolio.com';

-- Sample project
INSERT INTO projects (user_id, title, description, project_type, technologies, knot_type, musical_mapping, complexity_score, featured)
SELECT 
    id,
    'Document Generator MVP',
    'AI-powered platform that transforms documents into working MVPs using template matching and progressive enhancement.',
    'technical',
    '["JavaScript", "Node.js", "AI/ML", "WebSockets", "Docker"]'::jsonb,
    'complex_braid',
    '{"notes": [60, 64, 67, 72, 76], "rhythm": "progressive", "tempo": 140, "scale": "mixolydian"}'::jsonb,
    2.8,
    true
FROM users WHERE email = 'admin@portfolio.com';

-- Sample experience
INSERT INTO experiences (user_id, title, company, location, employment_type, start_date, current_position, description, achievements, technologies_used, featured)
SELECT 
    id,
    'Senior Full-Stack Developer',
    'Independent Consultant',
    'Remote',
    'freelance',
    '2024-01-01',
    true,
    'Developing innovative AI-powered platforms with mathematical foundations. Created world''s first musical knot theory portfolio system.',
    '["Built Document Generator MVP", "Integrated Music Knot Framework", "Developed SoulFra Universal Auth System", "Implemented Cal Cookie Monster Rewards"]'::jsonb,
    '["JavaScript", "Python", "React", "Node.js", "AI/ML", "WebAudio API", "PostgreSQL", "OAuth 2.0"]'::jsonb,
    true
FROM users WHERE email = 'admin@portfolio.com';

-- Give Cal some initial cookies to start with! 🍪
INSERT INTO cal_cookies (user_id, login_method, cookie_type, cookie_flavor, earned_at, cookie_size) 
SELECT 
    id,
    'system_init',
    'welcome_bonus',
    'chocolate_chip',
    NOW(),
    'jumbo'
FROM users WHERE email = 'admin@portfolio.com';

-- Create views for common queries
CREATE VIEW public_portfolio AS
SELECT 
    u.name,
    u.bio,
    u.linkedin_url,
    u.github_url,
    u.avatar_url,
    u.preferred_login_method,
    p.title as project_title,
    p.description as project_description,
    p.technologies,
    p.demo_url,
    p.knot_type,
    p.musical_mapping,
    p.complexity_score,
    s.name as skill_name,
    s.category as skill_category,
    s.proficiency_level,
    s.musical_notes as skill_notes,
    s.times_played,
    mk.crossing_number,
    mk.knot_polynomial
FROM users u
LEFT JOIN projects p ON u.id = p.user_id AND p.visibility = 'public' AND p.status = 'active'
LEFT JOIN skills s ON u.id = s.user_id AND s.featured = true
LEFT JOIN music_knots mk ON s.knot_type = mk.knot_type AND s.user_id = mk.user_id
WHERE u.active = true AND u.role IN ('admin', 'client');

CREATE VIEW cal_cookie_summary AS
SELECT 
    login_method,
    cookie_type,
    cookie_flavor,
    COUNT(*) as cookie_count,
    COUNT(*) FILTER (WHERE consumed_at IS NULL) as uneaten_cookies,
    AVG(CASE 
        WHEN cookie_size = 'small' THEN 1
        WHEN cookie_size = 'medium' THEN 2
        WHEN cookie_size = 'large' THEN 3
        WHEN cookie_size = 'jumbo' THEN 4
        ELSE 2
    END) as avg_cookie_size,
    MAX(earned_at) as last_cookie_earned
FROM cal_cookies
GROUP BY login_method, cookie_type, cookie_flavor
ORDER BY cookie_count DESC;

CREATE VIEW social_login_analytics AS
SELECT 
    sp.provider_name,
    sp.cookie_reward_multiplier,
    sp.usage_count,
    sp.last_used,
    COUNT(us.id) as active_sessions,
    COUNT(cc.id) as cookies_earned,
    AVG(au.response_time_ms) as avg_response_time
FROM social_providers sp
LEFT JOIN user_sessions us ON us.login_method = sp.provider_name AND us.revoked = false
LEFT JOIN cal_cookies cc ON cc.login_method = sp.provider_name
LEFT JOIN api_usage au ON au.social_provider = sp.provider_name
WHERE sp.enabled = true
GROUP BY sp.provider_name, sp.cookie_reward_multiplier, sp.usage_count, sp.last_used
ORDER BY sp.usage_count DESC;

-- Comments
COMMENT ON TABLE users IS 'User accounts with multi-provider authentication and social login support';
COMMENT ON TABLE cal_cookies IS 'Cal Cookie Monster reward system - cookies earned for various user actions';
COMMENT ON TABLE social_providers IS 'OAuth provider configurations with cookie reward multipliers';
COMMENT ON TABLE projects IS 'Portfolio projects with enhanced music knot integration';
COMMENT ON TABLE clients IS 'Client management and relationship tracking';
COMMENT ON TABLE reviews IS 'Client reviews and testimonials with Cal cookie bonuses';
COMMENT ON TABLE skills IS 'Skills with advanced music knot mappings and play analytics';
COMMENT ON TABLE music_knots IS 'Mathematical knot structures with enhanced musical properties and social complexity modifiers';
COMMENT ON TABLE analytics_events IS 'Portfolio interaction tracking with Cal cookie earning analytics';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO portfolio_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO portfolio_user;