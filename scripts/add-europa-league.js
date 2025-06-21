/**
 * ADD EUROPA LEAGUE
 * 
 * Add UEFA Europa League to the database
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addEuropaLeague() {
  console.log('🚀 ADDING UEFA EUROPA LEAGUE');
  console.log('='.repeat(50));

  const europaLeague = {
    id: 999005,
    name: 'UEFA Europa League',
    logo: 'https://media.api-sports.io/football/leagues/3.png',
    country_code: 'EU',
    country_name: 'Europe',
    country_logo: 'https://media.api-sports.io/flags/eu.svg',
    priority: false,
    current_season: 2024
  };

  // Check if already exists
  const { data: existing } = await supabase
    .from('leagues')
    .select('id')
    .eq('name', europaLeague.name)
    .single();

  if (existing) {
    console.log(`⏭️  ${europaLeague.name} already exists`);
    return;
  }

  const { error } = await supabase
    .from('leagues')
    .insert(europaLeague);

  if (error) {
    console.log(`❌ Error adding ${europaLeague.name}: ${error.message}`);
  } else {
    console.log(`✅ Added ${europaLeague.name} with logo`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 EUROPA LEAGUE ADDED');
}

// Run the script
addEuropaLeague(); 