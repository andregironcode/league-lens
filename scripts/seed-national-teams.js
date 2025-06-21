/**
 * SEED NATIONAL TEAMS
 * 
 * Comprehensive script to manually add all major national teams 
 * (France, Spain, Germany, Italy, England, Brazil, Argentina, etc.)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define national teams by confederation
const NATIONAL_TEAMS = {
  // UEFA (European teams) - Associate with Euro Championship
  UEFA: {
    leagueId: 4188, // Euro Championship
    leagueName: 'Euro Championship',
    teams: [
      { id: 'nt_france', name: 'France', logo: 'https://flagcdn.com/w320/fr.png' },
      { id: 'nt_spain', name: 'Spain', logo: 'https://flagcdn.com/w320/es.png' },
      { id: 'nt_germany', name: 'Germany', logo: 'https://flagcdn.com/w320/de.png' },
      { id: 'nt_italy', name: 'Italy', logo: 'https://flagcdn.com/w320/it.png' },
      { id: 'nt_england', name: 'England', logo: 'https://flagcdn.com/w320/gb-eng.png' },
      { id: 'nt_portugal', name: 'Portugal', logo: 'https://flagcdn.com/w320/pt.png' },
      { id: 'nt_netherlands', name: 'Netherlands', logo: 'https://flagcdn.com/w320/nl.png' },
      { id: 'nt_belgium', name: 'Belgium', logo: 'https://flagcdn.com/w320/be.png' },
      { id: 'nt_croatia', name: 'Croatia', logo: 'https://flagcdn.com/w320/hr.png' },
      { id: 'nt_denmark', name: 'Denmark', logo: 'https://flagcdn.com/w320/dk.png' },
      { id: 'nt_switzerland', name: 'Switzerland', logo: 'https://flagcdn.com/w320/ch.png' },
      { id: 'nt_austria', name: 'Austria', logo: 'https://flagcdn.com/w320/at.png' },
      { id: 'nt_poland', name: 'Poland', logo: 'https://flagcdn.com/w320/pl.png' },
      { id: 'nt_czech_republic', name: 'Czech Republic', logo: 'https://flagcdn.com/w320/cz.png' },
      { id: 'nt_hungary', name: 'Hungary', logo: 'https://flagcdn.com/w320/hu.png' },
      { id: 'nt_scotland', name: 'Scotland', logo: 'https://flagcdn.com/w320/gb-sct.png' },
      { id: 'nt_wales', name: 'Wales', logo: 'https://flagcdn.com/w320/gb-wls.png' },
      { id: 'nt_ireland', name: 'Republic of Ireland', logo: 'https://flagcdn.com/w320/ie.png' },
      { id: 'nt_norway', name: 'Norway', logo: 'https://flagcdn.com/w320/no.png' },
      { id: 'nt_sweden', name: 'Sweden', logo: 'https://flagcdn.com/w320/se.png' },
      { id: 'nt_finland', name: 'Finland', logo: 'https://flagcdn.com/w320/fi.png' },
      { id: 'nt_greece', name: 'Greece', logo: 'https://flagcdn.com/w320/gr.png' },
      { id: 'nt_turkey', name: 'Turkey', logo: 'https://flagcdn.com/w320/tr.png' },
      { id: 'nt_serbia', name: 'Serbia', logo: 'https://flagcdn.com/w320/rs.png' },
      { id: 'nt_romania', name: 'Romania', logo: 'https://flagcdn.com/w320/ro.png' },
      { id: 'nt_ukraine', name: 'Ukraine', logo: 'https://flagcdn.com/w320/ua.png' },
      { id: 'nt_slovenia', name: 'Slovenia', logo: 'https://flagcdn.com/w320/si.png' },
      { id: 'nt_slovakia', name: 'Slovakia', logo: 'https://flagcdn.com/w320/sk.png' },
      { id: 'nt_bulgaria', name: 'Bulgaria', logo: 'https://flagcdn.com/w320/bg.png' },
      { id: 'nt_bosnia', name: 'Bosnia and Herzegovina', logo: 'https://flagcdn.com/w320/ba.png' }
    ]
  },

  // CONMEBOL (South American teams) - Associate with Copa America
  CONMEBOL: {
    leagueId: 8443, // Copa America
    leagueName: 'Copa America',
    teams: [
      { id: 'nt_argentina', name: 'Argentina', logo: 'https://flagcdn.com/w320/ar.png' },
      { id: 'nt_brazil', name: 'Brazil', logo: 'https://flagcdn.com/w320/br.png' },
      { id: 'nt_uruguay', name: 'Uruguay', logo: 'https://flagcdn.com/w320/uy.png' },
      { id: 'nt_colombia', name: 'Colombia', logo: 'https://flagcdn.com/w320/co.png' },
      { id: 'nt_chile', name: 'Chile', logo: 'https://flagcdn.com/w320/cl.png' },
      { id: 'nt_peru', name: 'Peru', logo: 'https://flagcdn.com/w320/pe.png' },
      { id: 'nt_ecuador', name: 'Ecuador', logo: 'https://flagcdn.com/w320/ec.png' },
      { id: 'nt_venezuela', name: 'Venezuela', logo: 'https://flagcdn.com/w320/ve.png' },
      { id: 'nt_bolivia', name: 'Bolivia', logo: 'https://flagcdn.com/w320/bo.png' },
      { id: 'nt_paraguay', name: 'Paraguay', logo: 'https://flagcdn.com/w320/py.png' }
    ]
  },

  // CONCACAF (North/Central American teams) - Associate with Copa America (as guests)
  CONCACAF: {
    leagueId: 8443, // Copa America (they often invite CONCACAF teams)
    leagueName: 'Copa America',
    teams: [
      { id: 'nt_usa', name: 'United States', logo: 'https://flagcdn.com/w320/us.png' },
      { id: 'nt_mexico', name: 'Mexico', logo: 'https://flagcdn.com/w320/mx.png' },
      { id: 'nt_canada', name: 'Canada', logo: 'https://flagcdn.com/w320/ca.png' },
      { id: 'nt_costa_rica', name: 'Costa Rica', logo: 'https://flagcdn.com/w320/cr.png' },
      { id: 'nt_jamaica', name: 'Jamaica', logo: 'https://flagcdn.com/w320/jm.png' },
      { id: 'nt_panama', name: 'Panama', logo: 'https://flagcdn.com/w320/pa.png' },
      { id: 'nt_honduras', name: 'Honduras', logo: 'https://flagcdn.com/w320/hn.png' },
      { id: 'nt_guatemala', name: 'Guatemala', logo: 'https://flagcdn.com/w320/gt.png' },
      { id: 'nt_el_salvador', name: 'El Salvador', logo: 'https://flagcdn.com/w320/sv.png' }
    ]
  },

  // AFC (Asian teams) - Create new FIFA World Cup league for them
  AFC: {
    leagueId: 1, // FIFA World Cup
    leagueName: 'FIFA World Cup',
    teams: [
      { id: 'nt_japan', name: 'Japan', logo: 'https://flagcdn.com/w320/jp.png' },
      { id: 'nt_south_korea', name: 'South Korea', logo: 'https://flagcdn.com/w320/kr.png' },
      { id: 'nt_iran', name: 'Iran', logo: 'https://flagcdn.com/w320/ir.png' },
      { id: 'nt_saudi_arabia', name: 'Saudi Arabia', logo: 'https://flagcdn.com/w320/sa.png' },
      { id: 'nt_australia', name: 'Australia', logo: 'https://flagcdn.com/w320/au.png' },
      { id: 'nt_qatar', name: 'Qatar', logo: 'https://flagcdn.com/w320/qa.png' },
      { id: 'nt_iraq', name: 'Iraq', logo: 'https://flagcdn.com/w320/iq.png' },
      { id: 'nt_uae', name: 'United Arab Emirates', logo: 'https://flagcdn.com/w320/ae.png' },
      { id: 'nt_china', name: 'China', logo: 'https://flagcdn.com/w320/cn.png' },
      { id: 'nt_thailand', name: 'Thailand', logo: 'https://flagcdn.com/w320/th.png' },
      { id: 'nt_india', name: 'India', logo: 'https://flagcdn.com/w320/in.png' },
      { id: 'nt_uzbekistan', name: 'Uzbekistan', logo: 'https://flagcdn.com/w320/uz.png' }
    ]
  },

  // CAF (African teams) - Associate with FIFA World Cup
  CAF: {
    leagueId: 1, // FIFA World Cup
    leagueName: 'FIFA World Cup',
    teams: [
      { id: 'nt_morocco', name: 'Morocco', logo: 'https://flagcdn.com/w320/ma.png' },
      { id: 'nt_senegal', name: 'Senegal', logo: 'https://flagcdn.com/w320/sn.png' },
      { id: 'nt_nigeria', name: 'Nigeria', logo: 'https://flagcdn.com/w320/ng.png' },
      { id: 'nt_ghana', name: 'Ghana', logo: 'https://flagcdn.com/w320/gh.png' },
      { id: 'nt_cameroon', name: 'Cameroon', logo: 'https://flagcdn.com/w320/cm.png' },
      { id: 'nt_algeria', name: 'Algeria', logo: 'https://flagcdn.com/w320/dz.png' },
      { id: 'nt_tunisia', name: 'Tunisia', logo: 'https://flagcdn.com/w320/tn.png' },
      { id: 'nt_egypt', name: 'Egypt', logo: 'https://flagcdn.com/w320/eg.png' },
      { id: 'nt_south_africa', name: 'South Africa', logo: 'https://flagcdn.com/w320/za.png' },
      { id: 'nt_ivory_coast', name: 'Ivory Coast', logo: 'https://flagcdn.com/w320/ci.png' },
      { id: 'nt_mali', name: 'Mali', logo: 'https://flagcdn.com/w320/ml.png' },
      { id: 'nt_burkina_faso', name: 'Burkina Faso', logo: 'https://flagcdn.com/w320/bf.png' }
    ]
  },

  // OFC (Oceania teams) - Associate with FIFA World Cup
  OFC: {
    leagueId: 1, // FIFA World Cup
    leagueName: 'FIFA World Cup',
    teams: [
      { id: 'nt_new_zealand', name: 'New Zealand', logo: 'https://flagcdn.com/w320/nz.png' }
    ]
  }
};

// Function to upsert team data
async function upsertTeam(team, leagueId) {
  try {
    const { error } = await supabase
      .from('teams')
      .upsert({
        id: team.id,
        name: team.name,
        logo: team.logo,
        league_id: leagueId
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.log(`❌ Error upserting team ${team.name}: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error upserting team ${team.name}: ${error.message}`);
    return false;
  }
}

// Function to ensure leagues exist
async function ensureLeagueExists(leagueId, leagueName) {
  const { data: existing, error: checkError } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // Not "no rows found"
    console.log(`❌ Error checking league ${leagueName}: ${checkError.message}`);
    return false;
  }

  if (!existing && leagueId === 1) {
    // Add FIFA World Cup league if it doesn't exist
    const { error: insertError } = await supabase
      .from('leagues')
      .insert({
        id: 1,
        name: 'FIFA World Cup',
        logo: 'https://highlightly.net/soccer/images/leagues/1.png',
        country_code: 'World',
        country_name: 'World',
        country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
        priority: false
      });

    if (insertError) {
      console.log(`❌ Error adding league ${leagueName}: ${insertError.message}`);
      return false;
    } else {
      console.log(`✅ Added league: ${leagueName}`);
    }
  }

  return true;
}

// Main seeding function
async function seedNationalTeams() {
  console.log('🌍 SEEDING NATIONAL TEAMS');
  console.log('=' .repeat(80));
  console.log('Adding major international teams (France, Spain, Germany, etc.)');

  let totalTeams = 0;
  const results = {};

  try {
    for (const [confederation, data] of Object.entries(NATIONAL_TEAMS)) {
      console.log(`\n🏆 Processing ${confederation} teams (${data.leagueName})`);
      console.log('-'.repeat(60));

      // Ensure league exists
      const leagueExists = await ensureLeagueExists(data.leagueId, data.leagueName);
      if (!leagueExists) {
        console.log(`⚠️  Skipping ${confederation} - league setup failed`);
        continue;
      }

      let confederationCount = 0;
      const teamNames = [];

      for (const team of data.teams) {
        const success = await upsertTeam(team, data.leagueId);
        if (success) {
          confederationCount++;
          totalTeams++;
          teamNames.push(team.name);
          console.log(`✅ Added: ${team.name}`);
        }
      }

      results[confederation] = {
        count: confederationCount,
        total: data.teams.length,
        teams: teamNames
      };

      console.log(`✅ ${confederation} complete: ${confederationCount}/${data.teams.length} teams`);
    }

    // Final summary
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 NATIONAL TEAMS SEEDING COMPLETE');
    console.log('=' .repeat(80));
    console.log(`🏴 Total national teams added: ${totalTeams}`);
    
    console.log('\n📊 Results by confederation:');
    Object.entries(results).forEach(([confederation, result]) => {
      console.log(`   🌍 ${confederation}: ${result.count}/${result.total} teams`);
      console.log(`      Top teams: ${result.teams.slice(0, 5).join(', ')}${result.teams.length > 5 ? '...' : ''}`);
    });

    // Show specific teams user requested
    const userRequestedTeams = ['France', 'Spain', 'Germany', 'Italy', 'England', 'Brazil', 'Argentina'];
    console.log('\n🎯 User-requested teams status:');
    for (const teamName of userRequestedTeams) {
      const found = Object.values(results).some(result => 
        result.teams.some(team => team.toLowerCase().includes(teamName.toLowerCase()))
      );
      console.log(`   ${found ? '✅' : '❌'} ${teamName}`);
    }

    // Final database check
    const { data: allNationalTeams, error } = await supabase
      .from('teams')
      .select('name, leagues:league_id(name)')
      .in('league_id', [1, 4188, 8443]);

    if (!error) {
      console.log(`\n🏴 Total national teams in database: ${allNationalTeams.length}`);
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

// Run the seeding
seedNationalTeams(); 