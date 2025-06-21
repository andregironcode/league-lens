/**
 * MANUAL SYNC SCRIPT
 * 
 * Run this script to manually populate your database with some test data
 * This is for testing purposes before setting up the automated sync
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use your Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('🔄 Inserting test data...');
  
  try {
    // First, let's check what leagues exist
    const { data: existingLeagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('id, name')
      .limit(10);
    
    if (leaguesError) throw leaguesError;
    
    console.log('📋 Available leagues:', existingLeagues?.map(l => `${l.id}: ${l.name}`) || 'None');
    
    // Use the league IDs from our SQL script
    const premierLeagueId = '33973';  // Premier League from our SQL
    const laLigaId = '119924';        // La Liga from our SQL
    const championsLeagueId = '2486'; // Champions League from our SQL
    
    // Insert test teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .upsert([
        {
          id: 'team-1',
          name: 'Manchester City',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-2', 
          name: 'Arsenal',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-3',
          name: 'Real Madrid',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png', 
          league_id: laLigaId
        },
        {
          id: 'team-4',
          name: 'Barcelona',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png',
          league_id: laLigaId
        },
        {
          id: 'team-5',
          name: 'Liverpool',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-6',
          name: 'Chelsea',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png',
          league_id: premierLeagueId
        }
      ], { onConflict: 'id' });
    
    if (teamsError) throw teamsError;
    console.log('✅ Test teams inserted');
    
    // Insert test matches
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .upsert([
        {
          id: 'match-1',
          home_team_id: 'team-1',
          away_team_id: 'team-2', 
          league_id: premierLeagueId,
          match_date: today,
          match_time: '15:00',
          status: 'FT',
          home_score: 2,
          away_score: 1,
          season: '2024',
          has_highlights: true
        },
        {
          id: 'match-2',
          home_team_id: 'team-3',
          away_team_id: 'team-4',
          league_id: laLigaId, 
          match_date: yesterday,
          match_time: '20:00',
          status: 'FT',
          home_score: 3,
          away_score: 1,
          season: '2024',
          has_highlights: true
        },
        {
          id: 'match-3',
          home_team_id: 'team-5',
          away_team_id: 'team-6',
          league_id: premierLeagueId,
          match_date: tomorrow,
          match_time: '17:30',
          status: '1H',
          home_score: 1,
          away_score: 0,
          season: '2024',
          has_highlights: false
        },
        {
          id: 'match-4',
          home_team_id: 'team-2',
          away_team_id: 'team-5',
          league_id: premierLeagueId,
          match_date: today,
          match_time: '12:30',
          status: 'FT',
          home_score: 2,
          away_score: 2,
          season: '2024',
          has_highlights: true
        }
      ], { onConflict: 'id' });
      
    if (matchesError) throw matchesError;
    console.log('✅ Test matches inserted');
    
    // Insert test highlights with complete data structure
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .upsert([
        {
          id: 'highlight-1',
          match_id: 'match-1',
          title: 'Manchester City vs Arsenal - All Goals & Extended Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 180,
          views: 150000,
          api_data: {
            homeTeam: { id: 'team-1', name: 'Manchester City', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png' },
            awayTeam: { id: 'team-2', name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
            score: { home: 2, away: 1 },
            competition: { id: premierLeagueId, name: 'Premier League' }
          }
        },
        {
          id: 'highlight-2', 
          match_id: 'match-2',
          title: 'Real Madrid vs Barcelona - El Clasico All Goals & Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 240,
          views: 500000,
          api_data: {
            homeTeam: { id: 'team-3', name: 'Real Madrid', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png' },
            awayTeam: { id: 'team-4', name: 'Barcelona', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png' },
            score: { home: 3, away: 1 },
            competition: { id: laLigaId, name: 'La Liga' }
          }
        },
        {
          id: 'highlight-3',
          match_id: 'match-4',
          title: 'Arsenal vs Liverpool - Epic 2-2 Draw Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 200,
          views: 75000,
          api_data: {
            homeTeam: { id: 'team-2', name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
            awayTeam: { id: 'team-5', name: 'Liverpool', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png' },
            score: { home: 2, away: 2 },
            competition: { id: premierLeagueId, name: 'Premier League' }
          }
        }
      ], { onConflict: 'id' });
      
    if (highlightsError) throw highlightsError;
    console.log('✅ Test highlights inserted');
    
    console.log('🎉 Test data inserted successfully!');
    console.log('📱 Your app should now show data instead of empty results');
    console.log('🚀 Even though the API is rate limited, your users get instant data!');
    console.log('');
    console.log('🔥 THE MAGIC:');
    console.log('   • API is completely rate limited (429 errors)');
    console.log('   • But your app still works perfectly!');
    console.log('   • Users get instant data from Supabase');
    console.log('   • No more broken app during rate limits!');
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  }
}

// Run the function
insertTestData().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 
 * MANUAL SYNC SCRIPT
 * 
 * Run this script to manually populate your database with some test data
 * This is for testing purposes before setting up the automated sync
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use your Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('🔄 Inserting test data...');
  
  try {
    // First, let's check what leagues exist
    const { data: existingLeagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('id, name')
      .limit(10);
    
    if (leaguesError) throw leaguesError;
    
    console.log('📋 Available leagues:', existingLeagues?.map(l => `${l.id}: ${l.name}`) || 'None');
    
    // Use the league IDs from our SQL script
    const premierLeagueId = '33973';  // Premier League from our SQL
    const laLigaId = '119924';        // La Liga from our SQL
    const championsLeagueId = '2486'; // Champions League from our SQL
    
    // Insert test teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .upsert([
        {
          id: 'team-1',
          name: 'Manchester City',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-2', 
          name: 'Arsenal',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-3',
          name: 'Real Madrid',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png', 
          league_id: laLigaId
        },
        {
          id: 'team-4',
          name: 'Barcelona',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png',
          league_id: laLigaId
        },
        {
          id: 'team-5',
          name: 'Liverpool',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-6',
          name: 'Chelsea',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png',
          league_id: premierLeagueId
        }
      ], { onConflict: 'id' });
    
    if (teamsError) throw teamsError;
    console.log('✅ Test teams inserted');
    
    // Insert test matches
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .upsert([
        {
          id: 'match-1',
          home_team_id: 'team-1',
          away_team_id: 'team-2', 
          league_id: premierLeagueId,
          match_date: today,
          match_time: '15:00',
          status: 'FT',
          home_score: 2,
          away_score: 1,
          season: '2024',
          has_highlights: true
        },
        {
          id: 'match-2',
          home_team_id: 'team-3',
          away_team_id: 'team-4',
          league_id: laLigaId, 
          match_date: yesterday,
          match_time: '20:00',
          status: 'FT',
          home_score: 3,
          away_score: 1,
          season: '2024',
          has_highlights: true
        },
        {
          id: 'match-3',
          home_team_id: 'team-5',
          away_team_id: 'team-6',
          league_id: premierLeagueId,
          match_date: tomorrow,
          match_time: '17:30',
          status: '1H',
          home_score: 1,
          away_score: 0,
          season: '2024',
          has_highlights: false
        },
        {
          id: 'match-4',
          home_team_id: 'team-2',
          away_team_id: 'team-5',
          league_id: premierLeagueId,
          match_date: today,
          match_time: '12:30',
          status: 'FT',
          home_score: 2,
          away_score: 2,
          season: '2024',
          has_highlights: true
        }
      ], { onConflict: 'id' });
      
    if (matchesError) throw matchesError;
    console.log('✅ Test matches inserted');
    
    // Insert test highlights with complete data structure
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .upsert([
        {
          id: 'highlight-1',
          match_id: 'match-1',
          title: 'Manchester City vs Arsenal - All Goals & Extended Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 180,
          views: 150000,
          api_data: {
            homeTeam: { id: 'team-1', name: 'Manchester City', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png' },
            awayTeam: { id: 'team-2', name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
            score: { home: 2, away: 1 },
            competition: { id: premierLeagueId, name: 'Premier League' }
          }
        },
        {
          id: 'highlight-2', 
          match_id: 'match-2',
          title: 'Real Madrid vs Barcelona - El Clasico All Goals & Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 240,
          views: 500000,
          api_data: {
            homeTeam: { id: 'team-3', name: 'Real Madrid', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png' },
            awayTeam: { id: 'team-4', name: 'Barcelona', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png' },
            score: { home: 3, away: 1 },
            competition: { id: laLigaId, name: 'La Liga' }
          }
        },
        {
          id: 'highlight-3',
          match_id: 'match-4',
          title: 'Arsenal vs Liverpool - Epic 2-2 Draw Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 200,
          views: 75000,
          api_data: {
            homeTeam: { id: 'team-2', name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
            awayTeam: { id: 'team-5', name: 'Liverpool', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png' },
            score: { home: 2, away: 2 },
            competition: { id: premierLeagueId, name: 'Premier League' }
          }
        }
      ], { onConflict: 'id' });
      
    if (highlightsError) throw highlightsError;
    console.log('✅ Test highlights inserted');
    
    console.log('🎉 Test data inserted successfully!');
    console.log('📱 Your app should now show data instead of empty results');
    console.log('🚀 Even though the API is rate limited, your users get instant data!');
    console.log('');
    console.log('🔥 THE MAGIC:');
    console.log('   • API is completely rate limited (429 errors)');
    console.log('   • But your app still works perfectly!');
    console.log('   • Users get instant data from Supabase');
    console.log('   • No more broken app during rate limits!');
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  }
}

// Run the function
insertTestData().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 
 * MANUAL SYNC SCRIPT
 * 
 * Run this script to manually populate your database with some test data
 * This is for testing purposes before setting up the automated sync
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use your Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('🔄 Inserting test data...');
  
  try {
    // First, let's check what leagues exist
    const { data: existingLeagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('id, name')
      .limit(10);
    
    if (leaguesError) throw leaguesError;
    
    console.log('📋 Available leagues:', existingLeagues?.map(l => `${l.id}: ${l.name}`) || 'None');
    
    // Use the league IDs from our SQL script
    const premierLeagueId = '33973';  // Premier League from our SQL
    const laLigaId = '119924';        // La Liga from our SQL
    const championsLeagueId = '2486'; // Champions League from our SQL
    
    // Insert test teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .upsert([
        {
          id: 'team-1',
          name: 'Manchester City',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-2', 
          name: 'Arsenal',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-3',
          name: 'Real Madrid',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png', 
          league_id: laLigaId
        },
        {
          id: 'team-4',
          name: 'Barcelona',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png',
          league_id: laLigaId
        },
        {
          id: 'team-5',
          name: 'Liverpool',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png',
          league_id: premierLeagueId
        },
        {
          id: 'team-6',
          name: 'Chelsea',
          logo: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png',
          league_id: premierLeagueId
        }
      ], { onConflict: 'id' });
    
    if (teamsError) throw teamsError;
    console.log('✅ Test teams inserted');
    
    // Insert test matches
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .upsert([
        {
          id: 'match-1',
          home_team_id: 'team-1',
          away_team_id: 'team-2', 
          league_id: premierLeagueId,
          match_date: today,
          match_time: '15:00',
          status: 'FT',
          home_score: 2,
          away_score: 1,
          season: '2024',
          has_highlights: true
        },
        {
          id: 'match-2',
          home_team_id: 'team-3',
          away_team_id: 'team-4',
          league_id: laLigaId, 
          match_date: yesterday,
          match_time: '20:00',
          status: 'FT',
          home_score: 3,
          away_score: 1,
          season: '2024',
          has_highlights: true
        },
        {
          id: 'match-3',
          home_team_id: 'team-5',
          away_team_id: 'team-6',
          league_id: premierLeagueId,
          match_date: tomorrow,
          match_time: '17:30',
          status: '1H',
          home_score: 1,
          away_score: 0,
          season: '2024',
          has_highlights: false
        },
        {
          id: 'match-4',
          home_team_id: 'team-2',
          away_team_id: 'team-5',
          league_id: premierLeagueId,
          match_date: today,
          match_time: '12:30',
          status: 'FT',
          home_score: 2,
          away_score: 2,
          season: '2024',
          has_highlights: true
        }
      ], { onConflict: 'id' });
      
    if (matchesError) throw matchesError;
    console.log('✅ Test matches inserted');
    
    // Insert test highlights with complete data structure
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .upsert([
        {
          id: 'highlight-1',
          match_id: 'match-1',
          title: 'Manchester City vs Arsenal - All Goals & Extended Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 180,
          views: 150000,
          api_data: {
            homeTeam: { id: 'team-1', name: 'Manchester City', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png' },
            awayTeam: { id: 'team-2', name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
            score: { home: 2, away: 1 },
            competition: { id: premierLeagueId, name: 'Premier League' }
          }
        },
        {
          id: 'highlight-2', 
          match_id: 'match-2',
          title: 'Real Madrid vs Barcelona - El Clasico All Goals & Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 240,
          views: 500000,
          api_data: {
            homeTeam: { id: 'team-3', name: 'Real Madrid', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png' },
            awayTeam: { id: 'team-4', name: 'Barcelona', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png' },
            score: { home: 3, away: 1 },
            competition: { id: laLigaId, name: 'La Liga' }
          }
        },
        {
          id: 'highlight-3',
          match_id: 'match-4',
          title: 'Arsenal vs Liverpool - Epic 2-2 Draw Highlights',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: 200,
          views: 75000,
          api_data: {
            homeTeam: { id: 'team-2', name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
            awayTeam: { id: 'team-5', name: 'Liverpool', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png' },
            score: { home: 2, away: 2 },
            competition: { id: premierLeagueId, name: 'Premier League' }
          }
        }
      ], { onConflict: 'id' });
      
    if (highlightsError) throw highlightsError;
    console.log('✅ Test highlights inserted');
    
    console.log('🎉 Test data inserted successfully!');
    console.log('📱 Your app should now show data instead of empty results');
    console.log('🚀 Even though the API is rate limited, your users get instant data!');
    console.log('');
    console.log('🔥 THE MAGIC:');
    console.log('   • API is completely rate limited (429 errors)');
    console.log('   • But your app still works perfectly!');
    console.log('   • Users get instant data from Supabase');
    console.log('   • No more broken app during rate limits!');
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  }
}

// Run the function
insertTestData().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 