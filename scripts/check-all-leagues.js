/**
 * CHECK ALL LEAGUES
 * 
 * Show all leagues in the database with their IDs
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllLeagues() {
  console.log('🔍 CHECKING ALL LEAGUES IN DATABASE');
  console.log('='.repeat(50));

  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('*')
    .order('name');

  if (error) {
    console.log('❌ Error fetching leagues:', error.message);
    return;
  }

  console.log(`📋 Found ${leagues.length} leagues:`);
  console.log('');

  leagues.forEach((league, index) => {
    console.log(`${index + 1}. ${league.name}`);
    console.log(`   ID: ${league.id}`);
    console.log(`   Country: ${league.country_name} (${league.country_code})`);
    console.log(`   Priority: ${league.priority}`);
    console.log(`   Logo: ${league.logo ? '✅' : '❌'}`);
    console.log('');
  });

  console.log('='.repeat(50));
  console.log('📊 SUMMARY');
  console.log(`Total leagues: ${leagues.length}`);
  console.log(`Priority leagues: ${leagues.filter(l => l.priority).length}`);
  console.log(`Leagues with logos: ${leagues.filter(l => l.logo).length}`);
}

// Run the script
checkAllLeagues(); 