import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function fixAllWrongAPIIds() {
  console.log('🔧 FIXING ALL WRONG API IDs WITH CORRECT HIGHLIGHTLY DATA...');
  
  try {
    // Get all leagues from database
    const { data: allLeagues, error: fetchError } = await supabase
      .from('leagues')
      .select('id, name, api_data')
      .order('name');
    
    if (fetchError) {
      console.log('❌ Error fetching leagues:', fetchError);
      return;
    }
    
    console.log(`\n📋 Found ${allLeagues?.length || 0} leagues in database`);
    
    // CORRECT API ID MAPPINGS FROM USER'S HIGHLIGHTLY DATA
    const correctMappings = {
      // From user's data - EXACT matches
      'Primera C': '113116',
      'Primera D': '113967', 
      'Torneo Federal A': '114818',
      'Serie A': '115669', // Italy
      'Serie B': '116520', // Italy
      'Coppa Italia': '117371', // Italy
      'La Liga': '119924', // Spain
      'Segunda División': '120775', // Spain
      'Copa del Rey': '122477', // Spain
      'Belgian Pro League': '123328', // Belgium
      'Ligue 1': '52695', // France
      'Ligue 2': '53546', // France
      'Coupe de France': '56950', // France
      'Bundesliga': '67162', // Germany
      '2. Bundesliga': '68013', // Germany
      'DFB Pokal': '69715', // Germany
      'Eredivisie': '75672', // Netherlands
      'Eerste Divisie': '76523', // Netherlands
      'KNVB Beker': '77374', // Netherlands
      'Primeira Liga': '80778', // Portugal
      'Segunda Liga': '81629', // Portugal
      'Taça de Portugal': '82480', // Portugal
      'J1 League': '84182', // Japan
      'J2 League': '85033', // Japan
      'J3 League': '85884', // Japan
      'Eliteserien': '88437', // Norway
      'Ekstraklasa': '90990', // Poland
      'Allsvenskan': '96947', // Sweden
      'Superliga': '102053', // Denmark
      'Liga Profesional Argentina': '109712', // Argentina
      'Copa Argentina': '111414', // Argentina
      'Chinese Super League': '144603', // China
      'First League': '147156', // Bulgaria
      'Scottish Premiership': '153113', // Scotland
      'FA Cup': '154815', // Scotland
      'League Cup': '158219', // Scotland
      'Ligue 1': '159070', // Algeria
      'A-League': '160772', // Australia
      'Greek Super League': '168431', // Greece
      'Botola Pro': '170984', // Morocco
      'Ligue 1': '172686', // Tunisia
      'Turkish Süper Lig': '173537', // Turkey
      'Swiss Super League': '176941', // Switzerland
      'Croatian HNL': '179494', // Croatia
      'Austrian Bundesliga': '186302', // Austria
      'Egyptian Premier League': '199067', // Egypt
      'Russian Premier League': '200769', // Russia
      'Colombian Primera A': '204173', // Colombia
      'Liga Pro': '206726', // Ecuador
      'Veikkausliiga': '208428', // Finland
      'Division Profesional': '213534', // Paraguay
      'MLS': '216087', // USA
      'US Open Cup': '219491', // USA
      'Canadian Championship': '221193', // Canada
      'Liga MX': '223746', // Mexico
      'Chilean Primera División': '226299', // Chile
      'Primera División': '228852', // Uruguay
      'Hungarian NB I': '231405', // Hungary
      
      // International competitions
      'FIFA World Cup': '1635',
      'UEFA Champions League': '2486',
      'UEFA Europa League': '3337',
      'Euro Championship': '4188',
      'European Championship': '4188',
      'UEFA Nations League': '5039',
      'AFC Asian Cup': '6741',
      'Copa America': '8443',
      'CONMEBOL Sudamericana': '10145',
      'CAF Champions League': '10996',
      'CONMEBOL Libertadores': '11847',
      'Copa Libertadores': '11847',
      'FIFA Club World Cup': '13549',
      'CONCACAF Champions League': '14400',
      'AFC Champions League': '15251',
      'CONCACAF Gold Cup': '19506',
      'Africa Cup of Nations': '5890',
      'AFCON': '5890',
      
      // English system
      'Premier League': '33973',
      'Championship': '34824',
      'League One': '35675',
      'League Two': '36526',
      'FA Cup': '39079',
      'League Cup': '41632',
      
      // Women's leagues
      'FA WSL': '38228',
      'Frauen Bundesliga': '70566',
      'Feminine Division 1': '55248',
      'Serie A Women': '119073',
      'Primera División Femenina': '121626',
      'NWSL Women': '216938',
      'Brasileiro Women': '63758',
      
      // Youth competitions
      'UEFA Youth League': '12698',
      'UEFA U21 Championship': '33122',
      
      // Cup competitions
      'Copa Do Brasil': '62907',
      'Copa Chile': '228001',
      'Copa Colombia': '205875'
    };
    
    console.log('\n🔧 UPDATING ALL LEAGUES WITH CORRECT API IDs...');
    let updated = 0;
    let alreadyCorrect = 0;
    let noMapping = 0;
    let fixed = 0;
    
    for (const league of allLeagues) {
      const correctApiId = correctMappings[league.name];
      
      if (correctApiId) {
        // Parse existing api_data
        let currentApiData = {};
        try {
          currentApiData = league.api_data ? JSON.parse(league.api_data) : {};
        } catch (e) {
          currentApiData = {};
        }
        
        // Check if needs update
        if (currentApiData.highlightly_id !== correctApiId) {
          const updatedApiData = {
            ...currentApiData,
            highlightly_id: correctApiId,
            last_updated: new Date().toISOString(),
            source: 'user_highlightly_data'
          };
          
          const { error } = await supabase
            .from('leagues')
            .update({ api_data: JSON.stringify(updatedApiData) })
            .eq('id', league.id);
          
          if (!error) {
            console.log(`✅ FIXED: ${league.name} -> ${correctApiId} (was: ${currentApiData.highlightly_id || 'NULL'})`);
            if (currentApiData.highlightly_id && currentApiData.highlightly_id !== correctApiId) {
              fixed++;
            } else {
              updated++;
            }
          } else {
            console.log(`❌ Error updating ${league.name}:`, error.message);
          }
        } else {
          console.log(`✓ Correct: ${league.name} = ${correctApiId}`);
          alreadyCorrect++;
        }
      } else {
        console.log(`⚠️ No mapping: ${league.name}`);
        noMapping++;
      }
    }
    
    console.log('\n🎉 DATABASE FIX COMPLETE!');
    console.log(`📊 RESULTS:`);
    console.log(`- ✅ Fixed wrong IDs: ${fixed}`);
    console.log(`- 🆕 Added new IDs: ${updated}`);
    console.log(`- ✓ Already correct: ${alreadyCorrect}`);
    console.log(`- ⚠️ No mapping found: ${noMapping}`);
    
    // Final verification
    const { data: finalCheck } = await supabase
      .from('leagues')
      .select('name, api_data')
      .not('api_data', 'is', null)
      .order('name');
    
    console.log(`\n📋 FINAL STATUS - ${finalCheck?.length || 0} leagues with API data:`);
    let validCount = 0;
    finalCheck?.forEach((league, i) => {
      try {
        const apiData = JSON.parse(league.api_data);
        if (apiData.highlightly_id) {
          if (i < 15) { // Show first 15
            console.log(`${(i+1).toString().padStart(2)} - ${league.name}: ${apiData.highlightly_id}`);
          }
          validCount++;
        }
      } catch (e) {
        console.log(`${(i+1).toString().padStart(2)} - ${league.name}: INVALID`);
      }
    });
    
    console.log(`\n📈 TOTAL VALID API IDs: ${validCount}`);
    console.log(validCount >= 30 ? '🎉 EXCELLENT - Ready for production!' : '⚠️ Need more leagues');
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

fixAllWrongAPIIds().catch(console.error); 