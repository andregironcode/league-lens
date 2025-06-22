import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function updateIdsAndLogos() {
  console.log('🔧 UPDATING IDs AND LEAGUE LOGOS WITH CORRECT HIGHLIGHTLY DATA...');
  
  try {
    // Get all leagues with their current data
    const { data: allLeagues, error: fetchError } = await supabase
      .from('leagues')
      .select('*')
      .order('name');
    
    if (fetchError) {
      console.log('❌ Error fetching leagues:', fetchError);
      return;
    }
    
    console.log(`\n📋 Found ${allLeagues?.length || 0} leagues to update`);
    
    let updated = 0;
    let errors = 0;
    
    for (const league of allLeagues) {
      try {
        // Get the Highlightly ID from api_data
        let highlightlyId = null;
        try {
          const apiData = JSON.parse(league.api_data);
          highlightlyId = apiData.highlightly_id;
        } catch (e) {
          console.log(`⚠️ ${league.name}: No valid API data`);
          continue;
        }
        
        if (!highlightlyId) {
          console.log(`⚠️ ${league.name}: No Highlightly ID found`);
          continue;
        }
        
        // Create the correct logo URL using the Highlightly ID
        const correctLogoUrl = `https://highlightly.net/soccer/images/leagues/${highlightlyId}.png`;
        
        // Prepare the update - we'll update the ID and logo
        const updates = {
          logo: correctLogoUrl
        };
        
        // Only update the ID if it's different from the Highlightly ID
        if (league.id !== highlightlyId) {
          // First, we need to delete the old record and insert a new one with the correct ID
          // because PostgreSQL doesn't allow updating primary keys directly
          
          // Create new record with correct ID
          const newRecord = {
            ...league,
            id: highlightlyId,
            logo: correctLogoUrl,
            updated_at: new Date().toISOString()
          };
          
          // Delete the created_at and updated_at from the copy to let DB handle them
          delete newRecord.created_at;
          delete newRecord.updated_at;
          
          // Insert new record with correct ID
          const { error: insertError } = await supabase
            .from('leagues')
            .upsert(newRecord, { onConflict: 'id' });
          
          if (insertError) {
            console.log(`❌ Error upserting ${league.name}:`, insertError.message);
            errors++;
            continue;
          }
          
          // Delete old record if ID changed
          if (league.id !== highlightlyId) {
            const { error: deleteError } = await supabase
              .from('leagues')
              .delete()
              .eq('id', league.id);
            
            if (deleteError) {
              console.log(`⚠️ Warning: Could not delete old record for ${league.name}:`, deleteError.message);
            }
          }
          
          console.log(`✅ UPDATED: ${league.name}`);
          console.log(`   - ID: ${league.id} → ${highlightlyId}`);
          console.log(`   - Logo: ${correctLogoUrl}`);
          updated++;
          
        } else {
          // Just update the logo if ID is already correct
          const { error: updateError } = await supabase
            .from('leagues')
            .update(updates)
            .eq('id', league.id);
          
          if (updateError) {
            console.log(`❌ Error updating logo for ${league.name}:`, updateError.message);
            errors++;
          } else {
            console.log(`✅ LOGO UPDATED: ${league.name} → ${correctLogoUrl}`);
            updated++;
          }
        }
        
        // Rate limiting to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`❌ Error processing ${league.name}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n🎉 UPDATE COMPLETE!');
    console.log(`📊 RESULTS:`);
    console.log(`- ✅ Updated: ${updated} leagues`);
    console.log(`- ❌ Errors: ${errors} leagues`);
    
    // Final verification
    const { data: finalCheck } = await supabase
      .from('leagues')
      .select('id, name, logo, api_data')
      .order('name')
      .limit(10);
    
    console.log('\n📋 SAMPLE RESULTS (first 10):');
    finalCheck?.forEach((league, i) => {
      try {
        const apiData = JSON.parse(league.api_data);
        const highlightlyId = apiData.highlightly_id;
        const idMatch = league.id === highlightlyId ? '✅' : '⚠️';
        const logoMatch = league.logo.includes(highlightlyId) ? '✅' : '⚠️';
        
        console.log(`${(i+1).toString().padStart(2)} - ${league.name}:`);
        console.log(`     ID: ${league.id} ${idMatch}`);
        console.log(`     Logo: ${league.logo} ${logoMatch}`);
      } catch (e) {
        console.log(`${(i+1).toString().padStart(2)} - ${league.name}: Invalid API data`);
      }
    });
    
    // Count final status
    const { count: totalLeagues } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 FINAL STATUS:`);
    console.log(`- Total leagues: ${totalLeagues}`);
    console.log(`- All IDs and logos should now match Highlightly format`);
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

updateIdsAndLogos().catch(console.error); 