-- Add sync status tracking table
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) UNIQUE NOT NULL,
    status JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to matches table for tracking sync status
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS lineups_fetched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_game_synced BOOLEAN DEFAULT FALSE;

-- Add match statistics table
CREATE TABLE IF NOT EXISTS match_statistics (
    id SERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL,
    statistics JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON matches(date, status);
CREATE INDEX IF NOT EXISTS idx_matches_lineups_fetched ON matches(lineups_fetched) WHERE lineups_fetched = FALSE;
CREATE INDEX IF NOT EXISTS idx_matches_post_game_synced ON matches(post_game_synced) WHERE post_game_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_sync_status_type ON sync_status(sync_type);

-- Insert initial sync status records
INSERT INTO sync_status (sync_type, status) VALUES 
('upcoming_matches', '{"lastSync": null, "totalMatches": 0, "newMatches": 0}'),
('live_monitoring', '{"lastCheck": null, "activeMatches": 0}'),
('post_game_sync', '{"lastSync": null, "processedMatches": 0}'),
('league_availability', '{"lastCheck": null, "availableLeagues": 0}')
ON CONFLICT (sync_type) DO NOTHING; 