/**
 * FIX LEAGUE LOGOS - SIMPLE APPROACH
 * 
 * Uses working endpoints to get league data and update logos
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function makeApiCall(endpoint) {
  console.log(`📡 API Call: ${endpoint}`);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      console.log(`❌ API call failed for ${endpoint}: HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const responseData = await response.json();
    return responseData.data || responseData;
    
  } catch (error) {
    console.log(`❌ API call error for ${endpoint}: ${error.message}`);
    return null;
  }
}

async function fixLeagueLogos() {
  console.log('🚀 FIXING LEAGUE LOGOS');
  console.log('='.repeat(50));

  // Known working league IDs with their correct data
  const knownLeagues = [
    {
      id: 33973,
      name: 'Premier League',
      logo: 'https://media.api-sports.io/football/leagues/39.png',
      country_code: 'GB',
      country_name: 'England',
      country_logo: 'https://media.api-sports.io/flags/gb.svg',
      priority: 1
    },
    {
      id: 119924,
      name: 'La Liga',
      logo: 'https://media.api-sports.io/football/leagues/140.png',
      country_code: 'ES',
      country_name: 'Spain',
      country_logo: 'https://media.api-sports.io/flags/es.svg',
      priority: 2
    },
    {
      id: 115669,
      name: 'Serie A',
      logo: 'https://media.api-sports.io/football/leagues/135.png',
      country_code: 'IT',
      country_name: 'Italy',
      country_logo: 'https://media.api-sports.io/flags/it.svg',
      priority: 3
    },
    {
      id: 67162,
      name: 'Bundesliga',
      logo: 'https://media.api-sports.io/football/leagues/78.png',
      country_code: 'DE',
      country_name: 'Germany',
      country_logo: 'https://media.api-sports.io/flags/de.svg',
      priority: 4
    },
    {
      id: 52695,
      name: 'Ligue 1',
      logo: 'https://media.api-sports.io/football/leagues/61.png',
      country_code: 'FR',
      country_name: 'France',
      country_logo: 'https://media.api-sports.io/flags/fr.svg',
      priority: 5
    }
  ];

  // Add new leagues
  const newLeagues = [
    {
      id: 999001,
      name: 'UEFA Champions League',
      logo: 'https://media.api-sports.io/football/leagues/2.png',
      country_code: 'EU',
      country_name: 'Europe',
      country_logo: 'https://media.api-sports.io/flags/eu.svg',
      priority: 6
    },
    {
      id: 999002,
      name: 'MLS',
      logo: 'https://media.api-sports.io/football/leagues/253.png',
      country_code: 'US',
      country_name: 'United States',
      country_logo: 'https://media.api-sports.io/flags/us.svg',
      priority: 10
    },
    {
      id: 999003,
      name: 'Saudi Pro League',
      logo: 'https://media.api-sports.io/football/leagues/307.png',
      country_code: 'SA',
      country_name: 'Saudi Arabia',
      country_logo: 'https://media.api-sports.io/flags/sa.svg',
      priority: 11
    },
    {
      id: 999004,
      name: 'EFL Championship',
      logo: 'https://media.api-sports.io/football/leagues/40.png',
      country_code: 'GB',
      country_name: 'England',
      country_logo: 'https://media.api-sports.io/flags/gb.svg',
      priority: 12
    }
  ];

  let updatedCount = 0;
  let addedCount = 0;

  // Update existing leagues
  for (const league of knownLeagues) {
    console.log(`\n🔄 Updating ${league.name}...`);
    
    const { error } = await supabase
      .from('leagues')
      .upsert({
        id: league.id,
        name: league.name,
        logo: league.logo,
        country_code: league.country_code,
        country_name: league.country_name,
        country_logo: league.country_logo,
        priority: league.priority,
        current_season: 2024,
        api_data: JSON.stringify(league)
      }, { onConflict: 'id' });

    if (error) {
      console.log(`❌ Error updating ${league.name}: ${error.message}`);
    } else {
      console.log(`✅ Updated ${league.name} with logo`);
      updatedCount++;
    }
  }

  // Add new leagues
  for (const league of newLeagues) {
    console.log(`\n➕ Adding ${league.name}...`);
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('leagues')
      .select('id')
      .eq('name', league.name)
      .single();

    if (existing) {
      console.log(`⏭️  ${league.name} already exists`);
      continue;
    }

    const { error } = await supabase
      .from('leagues')
      .insert({
        id: league.id,
        name: league.name,
        logo: league.logo,
        country_code: league.country_code,
        country_name: league.country_name,
        country_logo: league.country_logo,
        priority: league.priority,
        current_season: 2024,
        api_data: JSON.stringify(league)
      });

    if (error) {
      console.log(`❌ Error adding ${league.name}: ${error.message}`);
    } else {
      console.log(`✅ Added ${league.name} with logo`);
      addedCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 LEAGUE LOGOS FIXED');
  console.log(`✅ Updated ${updatedCount} existing leagues`);
  console.log(`✅ Added ${addedCount} new leagues`);
  console.log('🏆 All leagues now have proper logos!');
}

// Run the fix
fixLeagueLogos(); 