import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xsslvajrqlpxzqwgvzjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2x2YWpycWxweHpxd2d2empoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MTkzMzQsImV4cCI6MjA0OTA5NTMzNH0.yzNkJF8LCiLdKzqhzGfJUE1YJHKgbOhFnCDpCvtKJGU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupActiveCompetitionsSchema() {
  console.log('🔧 Setting up Active Competitions Schema...');
  
  try {
    // Add columns to leagues table for active competitions tracking
    console.log('📝 Adding columns to leagues table...');
    
    const alterQueries = [
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS highlightly_league_id INTEGER;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS last_activity_check TIMESTAMP WITH TIME ZONE;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS active_match_count INTEGER DEFAULT 0;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS upcoming_matches INTEGER DEFAULT 0;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS recent_matches INTEGER DEFAULT 0;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS priority_ranking INTEGER;',
      'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS tier INTEGER;'
    ];

    for (const query of alterQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️ Could not execute: ${query.substring(0, 50)}...`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Added column: ${query.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] || 'unknown'}`);
        }
      } catch (err) {
        console.log(`⚠️ SQL execution error: ${err.message}`);
      }
    }

    // Create indexes for performance
    console.log('📝 Creating indexes...');
    
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_leagues_highlightly_id ON leagues(highlightly_league_id);',
      'CREATE INDEX IF NOT EXISTS idx_leagues_is_active ON leagues(is_active) WHERE is_active = TRUE;',
      'CREATE INDEX IF NOT EXISTS idx_leagues_priority_ranking ON leagues(priority_ranking);',
      'CREATE INDEX IF NOT EXISTS idx_leagues_tier ON leagues(tier);',
      'CREATE INDEX IF NOT EXISTS idx_leagues_activity_check ON leagues(last_activity_check DESC);'
    ];

    for (const query of indexQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️ Could not create index: ${query.substring(0, 50)}...`);
        } else {
          console.log(`✅ Created index: ${query.match(/idx_leagues_(\w+)/)?.[1] || 'unknown'}`);
        }
      } catch (err) {
        console.log(`⚠️ Index creation error: ${err.message}`);
      }
    }

    // Update existing leagues with highlightly_league_id
    console.log('📝 Updating existing leagues with Highlightly IDs...');
    
    const leagueUpdates = [
      { id: '33973', highlightly_league_id: 33973, name: 'Premier League' },
      { id: '119924', highlightly_league_id: 119924, name: 'La Liga' },
      { id: '115669', highlightly_league_id: 115669, name: 'Serie A' },
      { id: '67162', highlightly_league_id: 67162, name: 'Bundesliga' },
      { id: '52695', highlightly_league_id: 52695, name: 'Ligue 1' }
    ];

    for (const league of leagueUpdates) {
      const { error } = await supabase
        .from('leagues')
        .update({ 
          highlightly_league_id: league.highlightly_league_id,
          priority_ranking: null,
          tier: null,
          is_active: false
        })
        .eq('id', league.id);

      if (error) {
        console.log(`⚠️ Could not update ${league.name}: ${error.message}`);
      } else {
        console.log(`✅ Updated ${league.name} with Highlightly ID: ${league.highlightly_league_id}`);
      }
    }

    console.log('✅ Active Competitions Schema setup complete!');
    return true;

  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    return false;
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupActiveCompetitionsSchema()
    .then(success => {
      if (success) {
        console.log('\n🎉 Schema setup completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Schema setup failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Setup error:', error);
      process.exit(1);
    });
}

export default setupActiveCompetitionsSchema; 