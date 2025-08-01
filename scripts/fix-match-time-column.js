import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMatchTimeColumn() {
  try {
    console.log('[Fix] Updating match_time column to allow null values...');
    
    // First, update existing empty strings to null
    const { error: updateError } = await supabase
      .from('matches')
      .update({ match_time: null })
      .eq('match_time', '');
    
    if (updateError) {
      console.error('[Fix] Error updating empty strings to null:', updateError);
    } else {
      console.log('[Fix] Successfully updated empty strings to null');
    }
    
    // You may need to run this SQL directly in Supabase dashboard:
    // ALTER TABLE matches ALTER COLUMN match_time DROP NOT NULL;
    console.log('[Fix] Note: You may need to run this SQL in Supabase dashboard:');
    console.log('ALTER TABLE matches ALTER COLUMN match_time DROP NOT NULL;');
    
  } catch (error) {
    console.error('[Fix] Error:', error);
  }
}

fixMatchTimeColumn()
  .then(() => {
    console.log('[Fix] Complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('[Fix] Fatal error:', error);
    process.exit(1);
  });