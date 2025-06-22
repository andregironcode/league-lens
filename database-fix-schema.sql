-- Fix database schema for League Lens
-- Run this in Supabase SQL editor: https://supabase.com/dashboard/project/septerrkdnojsmtmmska/sql

-- 1. Create sync_status table with proper structure
DROP TABLE IF EXISTS sync_status CASCADE;
CREATE TABLE sync_status (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) UNIQUE NOT NULL,
    status JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS lineups_fetched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_game_synced BOOLEAN DEFAULT FALSE;

-- 3. Create match_statistics table (FIX: match_id should be VARCHAR to match matches.id)
DROP TABLE IF EXISTS match_statistics CASCADE;
CREATE TABLE match_statistics (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR NOT NULL,
    statistics JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON matches(match_date, status);
CREATE INDEX IF NOT EXISTS idx_matches_lineups_fetched ON matches(lineups_fetched) WHERE lineups_fetched = FALSE;
CREATE INDEX IF NOT EXISTS idx_matches_post_game_synced ON matches(post_game_synced) WHERE post_game_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_sync_status_type ON sync_status(sync_type);
CREATE INDEX IF NOT EXISTS idx_match_statistics_match_id ON match_statistics(match_id);

-- 5. Insert initial sync status records
INSERT INTO sync_status (sync_type, status) VALUES 
('upcoming_matches', '{"lastSync": null, "totalMatches": 0, "newMatches": 0}'),
('live_monitoring', '{"lastCheck": null, "activeMatches": 0}'),
('post_game_sync', '{"lastSync": null, "processedMatches": 0}'),
('league_availability', '{"lastCheck": null, "availableLeagues": 0}')
ON CONFLICT (sync_type) DO UPDATE SET 
    status = EXCLUDED.status,
    updated_at = NOW();

-- 6. Update existing matches to have proper boolean values
UPDATE matches 
SET 
    lineups_fetched = CASE WHEN has_lineups = true THEN true ELSE false END,
    post_game_synced = CASE WHEN status = 'finished' AND has_events = true THEN true ELSE false END
WHERE lineups_fetched IS NULL OR post_game_synced IS NULL;

-- 7. Verify the setup
SELECT 'sync_status table' as table_name, count(*) as records FROM sync_status
UNION ALL
SELECT 'matches table' as table_name, count(*) as records FROM matches
UNION ALL
SELECT 'match_statistics table' as table_name, count(*) as records FROM match_statistics;

-- 8. Show recent matches to verify data
SELECT 
    m.id,
    m.match_date,
    m.match_time,
    m.status,
    ht.name as home_team,
    at.name as away_team,
    m.home_score,
    m.away_score,
    m.has_lineups,
    m.has_events
FROM matches m
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
WHERE m.match_date >= CURRENT_DATE - INTERVAL '7 days'
  AND m.match_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY m.match_date DESC, m.match_time DESC
LIMIT 20;

-- 9. Check data types to confirm
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'matches' 
  AND column_name IN ('id', 'match_date', 'home_team_id', 'away_team_id')
ORDER BY column_name; 