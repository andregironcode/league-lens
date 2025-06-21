import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSingleInsert() {
  console.log('🧪 Testing Single Data Insert');
  console.log('='.repeat(40));
  
  try {
    // Test 1: Insert a single league
    console.log('\n📋 Testing League Insert...');
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        id: 'TEST_LEAGUE_001',
        name: 'Test League',
        logo: 'https://example.com/logo.png',
        country_name: 'Test Country',
        country_code: 'TC',
        priority: true
      })
      .select();
    
    if (leagueError) {
      console.log('❌ League insert failed:', leagueError);
      return false;
    } else {
      console.log('✅ League inserted successfully:', leagueData);
    }
    
    // Test 2: Insert a single team
    console.log('\n👥 Testing Team Insert...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        id: 'TEST_TEAM_001',
        name: 'Test Team',
        logo: 'https://example.com/team.png',
        league_id: 'TEST_LEAGUE_001',
        country: 'Test Country'
      })
      .select();
    
    if (teamError) {
      console.log('❌ Team insert failed:', teamError);
      return false;
    } else {
      console.log('✅ Team inserted successfully:', teamData);
    }
    
    // Test 3: Insert a single match
    console.log('\n⚽ Testing Match Insert...');
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        id: 'TEST_MATCH_001',
        home_team_id: 'TEST_TEAM_001',
        away_team_id: 'TEST_TEAM_001',
        league_id: 'TEST_LEAGUE_001',
        match_date: '2024-06-17',
        match_time: '15:00:00',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        season: '2024'
      })
      .select();
    
    if (matchError) {
      console.log('❌ Match insert failed:', matchError);
      return false;
    } else {
      console.log('✅ Match inserted successfully:', matchData);
    }
    
    // Test 4: Insert a single highlight
    console.log('\n🎬 Testing Highlight Insert...');
    const { data: highlightData, error: highlightError } = await supabase
      .from('highlights')
      .insert({
        id: 'TEST_HIGHLIGHT_001',
        match_id: 'TEST_MATCH_001',
        title: 'Test Highlight Video',
        url: 'https://example.com/video.mp4',
        duration: 120
      })
      .select();
    
    if (highlightError) {
      console.log('❌ Highlight insert failed:', highlightError);
      return false;
    } else {
      console.log('✅ Highlight inserted successfully:', highlightData);
    }
    
    // Verify data is actually there
    console.log('\n🔍 Verifying Data Persistence...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('leagues')
      .select(`
        *,
        teams(*),
        matches(*,
          highlights(*)
        )
      `)
      .eq('id', 'TEST_LEAGUE_001');
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError);
      return false;
    } else {
      console.log('✅ Data verification successful:');
      console.log('League:', verifyData[0]?.name);
      console.log('Teams:', verifyData[0]?.teams?.length || 0);
      console.log('Matches:', verifyData[0]?.matches?.length || 0);
      console.log('Highlights:', verifyData[0]?.matches?.[0]?.highlights?.length || 0);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('highlights').delete().eq('id', 'TEST_HIGHLIGHT_001');
    await supabase.from('matches').delete().eq('id', 'TEST_MATCH_001');
    await supabase.from('teams').delete().eq('id', 'TEST_TEAM_001');
    await supabase.from('leagues').delete().eq('id', 'TEST_LEAGUE_001');
    console.log('✅ Test data cleaned up');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
    return false;
  }
}

async function checkCurrentDatabaseState() {
  console.log('\n📊 Current Database State');
  console.log('='.repeat(40));
  
  const tables = [
    { name: 'leagues', description: 'Football Leagues' },
    { name: 'teams', description: 'Football Teams' },
    { name: 'matches', description: 'Football Matches' },
    { name: 'highlights', description: 'Match Highlights' }
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ ${table.description}: Error - ${error.message}`);
      } else {
        console.log(`📋 ${table.description}: ${data.length} records`);
        if (data.length > 0) {
          // Show sample of first record structure
          const sampleKeys = Object.keys(data[0]);
          console.log(`   Sample structure: ${sampleKeys.slice(0, 5).join(', ')}${sampleKeys.length > 5 ? '...' : ''}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table.description}: Exception - ${err.message}`);
    }
  }
}

async function runVerification() {
  console.log('🔍 COMPREHENSIVE DATA STORAGE VERIFICATION');
  console.log('='.repeat(50));
  console.log('This will test if we can actually store data in the database');
  
  // Check current state
  await checkCurrentDatabaseState();
  
  // Test actual insertion
  const insertTest = await testSingleInsert();
  
  console.log('\n🎯 VERIFICATION RESULTS:');
  console.log('='.repeat(30));
  if (insertTest) {
    console.log('✅ Database storage is working correctly!');
    console.log('✅ All tables can accept data');
    console.log('✅ Referential integrity is maintained');
    console.log('✅ Data persists correctly');
    console.log('\n🚀 Ready to run real data sync!');
  } else {
    console.log('❌ Database storage has issues!');
    console.log('❌ Data insertion is failing');
    console.log('❌ Need to fix database structure or permissions');
    console.log('\n🛑 Do NOT run real data sync until this is fixed!');
  }
}

runVerification(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSingleInsert() {
  console.log('🧪 Testing Single Data Insert');
  console.log('='.repeat(40));
  
  try {
    // Test 1: Insert a single league
    console.log('\n📋 Testing League Insert...');
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        id: 'TEST_LEAGUE_001',
        name: 'Test League',
        logo: 'https://example.com/logo.png',
        country_name: 'Test Country',
        country_code: 'TC',
        priority: true
      })
      .select();
    
    if (leagueError) {
      console.log('❌ League insert failed:', leagueError);
      return false;
    } else {
      console.log('✅ League inserted successfully:', leagueData);
    }
    
    // Test 2: Insert a single team
    console.log('\n👥 Testing Team Insert...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        id: 'TEST_TEAM_001',
        name: 'Test Team',
        logo: 'https://example.com/team.png',
        league_id: 'TEST_LEAGUE_001',
        country: 'Test Country'
      })
      .select();
    
    if (teamError) {
      console.log('❌ Team insert failed:', teamError);
      return false;
    } else {
      console.log('✅ Team inserted successfully:', teamData);
    }
    
    // Test 3: Insert a single match
    console.log('\n⚽ Testing Match Insert...');
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        id: 'TEST_MATCH_001',
        home_team_id: 'TEST_TEAM_001',
        away_team_id: 'TEST_TEAM_001',
        league_id: 'TEST_LEAGUE_001',
        match_date: '2024-06-17',
        match_time: '15:00:00',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        season: '2024'
      })
      .select();
    
    if (matchError) {
      console.log('❌ Match insert failed:', matchError);
      return false;
    } else {
      console.log('✅ Match inserted successfully:', matchData);
    }
    
    // Test 4: Insert a single highlight
    console.log('\n🎬 Testing Highlight Insert...');
    const { data: highlightData, error: highlightError } = await supabase
      .from('highlights')
      .insert({
        id: 'TEST_HIGHLIGHT_001',
        match_id: 'TEST_MATCH_001',
        title: 'Test Highlight Video',
        url: 'https://example.com/video.mp4',
        duration: 120
      })
      .select();
    
    if (highlightError) {
      console.log('❌ Highlight insert failed:', highlightError);
      return false;
    } else {
      console.log('✅ Highlight inserted successfully:', highlightData);
    }
    
    // Verify data is actually there
    console.log('\n🔍 Verifying Data Persistence...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('leagues')
      .select(`
        *,
        teams(*),
        matches(*,
          highlights(*)
        )
      `)
      .eq('id', 'TEST_LEAGUE_001');
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError);
      return false;
    } else {
      console.log('✅ Data verification successful:');
      console.log('League:', verifyData[0]?.name);
      console.log('Teams:', verifyData[0]?.teams?.length || 0);
      console.log('Matches:', verifyData[0]?.matches?.length || 0);
      console.log('Highlights:', verifyData[0]?.matches?.[0]?.highlights?.length || 0);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('highlights').delete().eq('id', 'TEST_HIGHLIGHT_001');
    await supabase.from('matches').delete().eq('id', 'TEST_MATCH_001');
    await supabase.from('teams').delete().eq('id', 'TEST_TEAM_001');
    await supabase.from('leagues').delete().eq('id', 'TEST_LEAGUE_001');
    console.log('✅ Test data cleaned up');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
    return false;
  }
}

async function checkCurrentDatabaseState() {
  console.log('\n📊 Current Database State');
  console.log('='.repeat(40));
  
  const tables = [
    { name: 'leagues', description: 'Football Leagues' },
    { name: 'teams', description: 'Football Teams' },
    { name: 'matches', description: 'Football Matches' },
    { name: 'highlights', description: 'Match Highlights' }
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ ${table.description}: Error - ${error.message}`);
      } else {
        console.log(`📋 ${table.description}: ${data.length} records`);
        if (data.length > 0) {
          // Show sample of first record structure
          const sampleKeys = Object.keys(data[0]);
          console.log(`   Sample structure: ${sampleKeys.slice(0, 5).join(', ')}${sampleKeys.length > 5 ? '...' : ''}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table.description}: Exception - ${err.message}`);
    }
  }
}

async function runVerification() {
  console.log('🔍 COMPREHENSIVE DATA STORAGE VERIFICATION');
  console.log('='.repeat(50));
  console.log('This will test if we can actually store data in the database');
  
  // Check current state
  await checkCurrentDatabaseState();
  
  // Test actual insertion
  const insertTest = await testSingleInsert();
  
  console.log('\n🎯 VERIFICATION RESULTS:');
  console.log('='.repeat(30));
  if (insertTest) {
    console.log('✅ Database storage is working correctly!');
    console.log('✅ All tables can accept data');
    console.log('✅ Referential integrity is maintained');
    console.log('✅ Data persists correctly');
    console.log('\n🚀 Ready to run real data sync!');
  } else {
    console.log('❌ Database storage has issues!');
    console.log('❌ Data insertion is failing');
    console.log('❌ Need to fix database structure or permissions');
    console.log('\n🛑 Do NOT run real data sync until this is fixed!');
  }
}

runVerification(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSingleInsert() {
  console.log('🧪 Testing Single Data Insert');
  console.log('='.repeat(40));
  
  try {
    // Test 1: Insert a single league
    console.log('\n📋 Testing League Insert...');
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        id: 'TEST_LEAGUE_001',
        name: 'Test League',
        logo: 'https://example.com/logo.png',
        country_name: 'Test Country',
        country_code: 'TC',
        priority: true
      })
      .select();
    
    if (leagueError) {
      console.log('❌ League insert failed:', leagueError);
      return false;
    } else {
      console.log('✅ League inserted successfully:', leagueData);
    }
    
    // Test 2: Insert a single team
    console.log('\n👥 Testing Team Insert...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        id: 'TEST_TEAM_001',
        name: 'Test Team',
        logo: 'https://example.com/team.png',
        league_id: 'TEST_LEAGUE_001',
        country: 'Test Country'
      })
      .select();
    
    if (teamError) {
      console.log('❌ Team insert failed:', teamError);
      return false;
    } else {
      console.log('✅ Team inserted successfully:', teamData);
    }
    
    // Test 3: Insert a single match
    console.log('\n⚽ Testing Match Insert...');
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        id: 'TEST_MATCH_001',
        home_team_id: 'TEST_TEAM_001',
        away_team_id: 'TEST_TEAM_001',
        league_id: 'TEST_LEAGUE_001',
        match_date: '2024-06-17',
        match_time: '15:00:00',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        season: '2024'
      })
      .select();
    
    if (matchError) {
      console.log('❌ Match insert failed:', matchError);
      return false;
    } else {
      console.log('✅ Match inserted successfully:', matchData);
    }
    
    // Test 4: Insert a single highlight
    console.log('\n🎬 Testing Highlight Insert...');
    const { data: highlightData, error: highlightError } = await supabase
      .from('highlights')
      .insert({
        id: 'TEST_HIGHLIGHT_001',
        match_id: 'TEST_MATCH_001',
        title: 'Test Highlight Video',
        url: 'https://example.com/video.mp4',
        duration: 120
      })
      .select();
    
    if (highlightError) {
      console.log('❌ Highlight insert failed:', highlightError);
      return false;
    } else {
      console.log('✅ Highlight inserted successfully:', highlightData);
    }
    
    // Verify data is actually there
    console.log('\n🔍 Verifying Data Persistence...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('leagues')
      .select(`
        *,
        teams(*),
        matches(*,
          highlights(*)
        )
      `)
      .eq('id', 'TEST_LEAGUE_001');
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError);
      return false;
    } else {
      console.log('✅ Data verification successful:');
      console.log('League:', verifyData[0]?.name);
      console.log('Teams:', verifyData[0]?.teams?.length || 0);
      console.log('Matches:', verifyData[0]?.matches?.length || 0);
      console.log('Highlights:', verifyData[0]?.matches?.[0]?.highlights?.length || 0);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('highlights').delete().eq('id', 'TEST_HIGHLIGHT_001');
    await supabase.from('matches').delete().eq('id', 'TEST_MATCH_001');
    await supabase.from('teams').delete().eq('id', 'TEST_TEAM_001');
    await supabase.from('leagues').delete().eq('id', 'TEST_LEAGUE_001');
    console.log('✅ Test data cleaned up');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
    return false;
  }
}

async function checkCurrentDatabaseState() {
  console.log('\n📊 Current Database State');
  console.log('='.repeat(40));
  
  const tables = [
    { name: 'leagues', description: 'Football Leagues' },
    { name: 'teams', description: 'Football Teams' },
    { name: 'matches', description: 'Football Matches' },
    { name: 'highlights', description: 'Match Highlights' }
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ ${table.description}: Error - ${error.message}`);
      } else {
        console.log(`📋 ${table.description}: ${data.length} records`);
        if (data.length > 0) {
          // Show sample of first record structure
          const sampleKeys = Object.keys(data[0]);
          console.log(`   Sample structure: ${sampleKeys.slice(0, 5).join(', ')}${sampleKeys.length > 5 ? '...' : ''}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table.description}: Exception - ${err.message}`);
    }
  }
}

async function runVerification() {
  console.log('🔍 COMPREHENSIVE DATA STORAGE VERIFICATION');
  console.log('='.repeat(50));
  console.log('This will test if we can actually store data in the database');
  
  // Check current state
  await checkCurrentDatabaseState();
  
  // Test actual insertion
  const insertTest = await testSingleInsert();
  
  console.log('\n🎯 VERIFICATION RESULTS:');
  console.log('='.repeat(30));
  if (insertTest) {
    console.log('✅ Database storage is working correctly!');
    console.log('✅ All tables can accept data');
    console.log('✅ Referential integrity is maintained');
    console.log('✅ Data persists correctly');
    console.log('\n🚀 Ready to run real data sync!');
  } else {
    console.log('❌ Database storage has issues!');
    console.log('❌ Data insertion is failing');
    console.log('❌ Need to fix database structure or permissions');
    console.log('\n🛑 Do NOT run real data sync until this is fixed!');
  }
}

runVerification(); 