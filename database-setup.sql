-- =====================================================
-- COMPREHENSIVE FOOTBALL DATA DATABASE SETUP FOR SUPABASE
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP VIEW IF EXISTS team_form_view CASCADE;
DROP VIEW IF EXISTS current_standings_view CASCADE;
DROP VIEW IF EXISTS matches_with_highlights_view CASCADE;
DROP VIEW IF EXISTS recent_matches_view CASCADE;

DROP TABLE IF EXISTS match_lineups CASCADE;
DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS team_form CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS highlights CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS sync_status CASCADE;

-- =====================================================
-- 1. LEAGUES TABLE
-- =====================================================
CREATE TABLE leagues (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    country_code VARCHAR(10),
    country_name VARCHAR(100),
    country_logo TEXT,
    priority BOOLEAN DEFAULT FALSE,
    current_season VARCHAR(20) DEFAULT '2024',
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TEAMS TABLE  
-- =====================================================
CREATE TABLE teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    short_name VARCHAR(10),
    league_id VARCHAR(50) REFERENCES leagues(id),
    country VARCHAR(100),
    founded INTEGER,
    venue_name VARCHAR(255),
    venue_capacity INTEGER,
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. MATCHES TABLE
-- =====================================================
CREATE TABLE matches (
    id VARCHAR(50) PRIMARY KEY,
    home_team_id VARCHAR(50) REFERENCES teams(id),
    away_team_id VARCHAR(50) REFERENCES teams(id),
    league_id VARCHAR(50) REFERENCES leagues(id),
    match_date DATE NOT NULL,
    match_time TIME,
    status VARCHAR(20) DEFAULT 'scheduled',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue VARCHAR(255),
    round VARCHAR(50),
    season VARCHAR(20) DEFAULT '2024',
    has_highlights BOOLEAN DEFAULT FALSE,
    has_lineups BOOLEAN DEFAULT FALSE,
    has_events BOOLEAN DEFAULT FALSE,
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. HIGHLIGHTS TABLE
-- =====================================================
CREATE TABLE highlights (
    id VARCHAR(50) PRIMARY KEY,
    match_id VARCHAR(50) REFERENCES matches(id),
    title VARCHAR(500) NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    duration INTEGER,
    embed_url TEXT,
    views INTEGER DEFAULT 0,
    quality VARCHAR(20),
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. STANDINGS TABLE
-- =====================================================
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id VARCHAR(50) REFERENCES leagues(id),
    season VARCHAR(20) NOT NULL,
    team_id VARCHAR(50) REFERENCES teams(id),
    position INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    home_played INTEGER DEFAULT 0,
    home_won INTEGER DEFAULT 0,
    home_drawn INTEGER DEFAULT 0,
    home_lost INTEGER DEFAULT 0,
    home_goals_for INTEGER DEFAULT 0,
    home_goals_against INTEGER DEFAULT 0,
    away_played INTEGER DEFAULT 0,
    away_won INTEGER DEFAULT 0,
    away_drawn INTEGER DEFAULT 0,
    away_lost INTEGER DEFAULT 0,
    away_goals_for INTEGER DEFAULT 0,
    away_goals_against INTEGER DEFAULT 0,
    form_string VARCHAR(10),
    group_name VARCHAR(50),
    status VARCHAR(50),
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, season, team_id)
);

-- =====================================================
-- 6. TEAM FORM TABLE
-- =====================================================
CREATE TABLE team_form (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id VARCHAR(50) REFERENCES teams(id),
    season VARCHAR(20) NOT NULL,
    league_id VARCHAR(50) REFERENCES leagues(id),
    last_10_played INTEGER DEFAULT 0,
    last_10_won INTEGER DEFAULT 0,
    last_10_drawn INTEGER DEFAULT 0,
    last_10_lost INTEGER DEFAULT 0,
    last_10_goals_for INTEGER DEFAULT 0,
    last_10_goals_against INTEGER DEFAULT 0,
    last_10_clean_sheets INTEGER DEFAULT 0,
    last_10_failed_to_score INTEGER DEFAULT 0,
    last_10_over_25_goals INTEGER DEFAULT 0,
    last_10_under_25_goals INTEGER DEFAULT 0,
    last_10_conceded INTEGER DEFAULT 0,
    last_10_conceded_two_plus INTEGER DEFAULT 0,
    form_string VARCHAR(10),
    recent_matches JSONB,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, season, league_id)
);

-- =====================================================
-- 7. MATCH EVENTS TABLE
-- =====================================================
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id VARCHAR(50) REFERENCES matches(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    player_id VARCHAR(50),
    player_name VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    minute INTEGER,
    added_time INTEGER DEFAULT 0,
    description TEXT,
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. MATCH LINEUPS TABLE
-- =====================================================
CREATE TABLE match_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id VARCHAR(50) REFERENCES matches(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    formation VARCHAR(20),
    players JSONB,
    substitutes JSONB,
    coach VARCHAR(255),
    api_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, team_id)
);

-- =====================================================
-- 9. SYNC STATUS TABLE
-- =====================================================
CREATE TABLE sync_status (
    table_name VARCHAR(50) PRIMARY KEY,
    last_sync TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    records_synced INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    sync_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

-- League indexes
CREATE INDEX idx_leagues_priority ON leagues(priority) WHERE priority = TRUE;
CREATE INDEX idx_leagues_country ON leagues(country_code);
CREATE INDEX idx_leagues_name ON leagues USING GIN(to_tsvector('english', name));

-- Team indexes
CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_name ON teams USING GIN(to_tsvector('english', name));
CREATE INDEX idx_teams_country ON teams(country);

-- Match indexes
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_matches_league_date ON matches(league_id, match_date DESC);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_highlights ON matches(has_highlights) WHERE has_highlights = TRUE;
CREATE INDEX idx_matches_season ON matches(season);
CREATE INDEX idx_matches_recent ON matches(match_date DESC, status);
CREATE INDEX idx_matches_team_season_home ON matches(home_team_id, season);
CREATE INDEX idx_matches_team_season_away ON matches(away_team_id, season);

-- Highlight indexes
CREATE INDEX idx_highlights_match ON highlights(match_id);
CREATE INDEX idx_highlights_created ON highlights(created_at DESC);
CREATE INDEX idx_highlights_views ON highlights(views DESC);

-- Standing indexes
CREATE INDEX idx_standings_league_season ON standings(league_id, season);
CREATE INDEX idx_standings_team ON standings(team_id);
CREATE INDEX idx_standings_position ON standings(league_id, season, position);
CREATE INDEX idx_standings_league_season_position ON standings(league_id, season, position);

-- Team form indexes
CREATE INDEX idx_team_form_team ON team_form(team_id);
CREATE INDEX idx_team_form_league_season ON team_form(league_id, season);
CREATE INDEX idx_team_form_computed ON team_form(computed_at DESC);
CREATE INDEX idx_team_form_recent ON team_form(team_id, computed_at DESC);

-- Match event indexes
CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_type ON match_events(event_type);
CREATE INDEX idx_match_events_minute ON match_events(minute);

-- Match lineup indexes
CREATE INDEX idx_match_lineups_match ON match_lineups(match_id);
CREATE INDEX idx_match_lineups_team ON match_lineups(team_id);

-- =====================================================
-- 11. USEFUL VIEWS
-- =====================================================

-- Recent matches with full team and league info
CREATE VIEW recent_matches_view AS
SELECT 
    m.id,
    m.match_date,
    m.match_time,
    m.status,
    m.home_score,
    m.away_score,
    m.has_highlights,
    m.has_lineups,
    m.has_events,
    l.name as league_name,
    l.logo as league_logo,
    l.country_name as league_country,
    ht.name as home_team_name,
    ht.logo as home_team_logo,
    at.name as away_team_name,
    at.logo as away_team_logo,
    m.created_at,
    m.updated_at
FROM matches m
JOIN leagues l ON m.league_id = l.id
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
ORDER BY m.match_date DESC, m.match_time DESC;

-- Matches with highlights
CREATE VIEW matches_with_highlights_view AS
SELECT 
    m.*,
    l.name as league_name,
    l.logo as league_logo,
    ht.name as home_team_name,
    ht.logo as home_team_logo,
    at.name as away_team_name,
    at.logo as away_team_logo,
    COUNT(h.id) as highlight_count
FROM matches m
JOIN leagues l ON m.league_id = l.id
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
LEFT JOIN highlights h ON m.id = h.match_id
WHERE m.has_highlights = TRUE
GROUP BY m.id, l.name, l.logo, ht.name, ht.logo, at.name, at.logo
ORDER BY m.match_date DESC;

-- Current league standings
CREATE VIEW current_standings_view AS
SELECT 
    s.*,
    t.name as team_name,
    t.logo as team_logo,
    l.name as league_name,
    l.logo as league_logo,
    l.current_season
FROM standings s
JOIN teams t ON s.team_id = t.id
JOIN leagues l ON s.league_id = l.id
WHERE s.season = l.current_season
ORDER BY s.league_id, s.position;

-- Team form with team info
CREATE VIEW team_form_view AS
SELECT 
    tf.*,
    t.name as team_name,
    t.logo as team_logo,
    l.name as league_name,
    l.logo as league_logo
FROM team_form tf
JOIN teams t ON tf.team_id = t.id
JOIN leagues l ON tf.league_id = l.id
ORDER BY tf.computed_at DESC;

-- =====================================================
-- 12. FUNCTIONS
-- =====================================================

-- Update match flags when related data changes
CREATE OR REPLACE FUNCTION update_match_highlight_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches 
    SET has_highlights = (
        SELECT COUNT(*) > 0 
        FROM highlights 
        WHERE match_id = COALESCE(NEW.match_id, OLD.match_id)
    )
    WHERE id = COALESCE(NEW.match_id, OLD.match_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_match_lineup_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches 
    SET has_lineups = (
        SELECT COUNT(*) > 0 
        FROM match_lineups 
        WHERE match_id = COALESCE(NEW.match_id, OLD.match_id)
    )
    WHERE id = COALESCE(NEW.match_id, OLD.match_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_match_events_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches 
    SET has_events = (
        SELECT COUNT(*) > 0 
        FROM match_events 
        WHERE match_id = COALESCE(NEW.match_id, OLD.match_id)
    )
    WHERE id = COALESCE(NEW.match_id, OLD.match_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate goal difference
CREATE OR REPLACE FUNCTION calculate_goal_difference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.goal_difference = NEW.goals_for - NEW.goals_against;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_update_highlight_status
    AFTER INSERT OR UPDATE OR DELETE ON highlights
    FOR EACH ROW EXECUTE FUNCTION update_match_highlight_status();

CREATE TRIGGER trigger_update_lineup_status  
    AFTER INSERT OR UPDATE OR DELETE ON match_lineups
    FOR EACH ROW EXECUTE FUNCTION update_match_lineup_status();

CREATE TRIGGER trigger_update_events_status
    AFTER INSERT OR UPDATE OR DELETE ON match_events
    FOR EACH ROW EXECUTE FUNCTION update_match_events_status();

CREATE TRIGGER trigger_calculate_goal_difference
    BEFORE INSERT OR UPDATE ON standings
    FOR EACH ROW EXECUTE FUNCTION calculate_goal_difference();

-- Update timestamps
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_form_updated_at BEFORE UPDATE ON team_form FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. INITIAL DATA
-- =====================================================

-- Priority leagues
INSERT INTO leagues (id, name, country_code, country_name, priority, current_season) VALUES
('33973', 'Premier League', 'GB', 'England', TRUE, '2024'),
('34281', 'La Liga', 'ES', 'Spain', TRUE, '2024'),
('33986', 'Serie A', 'IT', 'Italy', TRUE, '2024'),
('33979', 'Bundesliga', 'DE', 'Germany', TRUE, '2024'),
('34130', 'Ligue 1', 'FR', 'France', TRUE, '2024');

-- Sync status records
INSERT INTO sync_status (table_name, status) VALUES 
('leagues', 'pending'),
('teams', 'pending'),
('matches', 'pending'),
('highlights', 'pending'),
('standings', 'pending'),
('team_form', 'pending'),
('match_events', 'pending'),
('match_lineups', 'pending');

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Grant necessary permissions (if needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

COMMENT ON TABLE leagues IS 'Football leagues and competitions';
COMMENT ON TABLE teams IS 'Football teams/clubs';
COMMENT ON TABLE matches IS 'Football matches with scores and status';
COMMENT ON TABLE highlights IS 'Match video highlights';
COMMENT ON TABLE standings IS 'League tables/standings for each season';
COMMENT ON TABLE team_form IS 'Team performance statistics for last 10 matches';
COMMENT ON TABLE match_events IS 'Match events like goals, cards, substitutions';
COMMENT ON TABLE match_lineups IS 'Team lineups and formations for matches';
COMMENT ON TABLE sync_status IS 'Background sync job status tracking'; 