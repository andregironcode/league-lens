import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

async function testDatabaseUpdate() {
  console.log('[Test] Testing database update endpoint...');
  
  const apiKey = process.env.HIGHLIGHTLY_API_KEY;
  const cronSecret = process.env.CRON_SECRET || 'test-secret';
  
  if (!apiKey) {
    console.error('[Test] Missing HIGHLIGHTLY_API_KEY in environment');
    process.exit(1);
  }
  
  try {
    // First, let's test the cron update endpoint locally
    console.log('[Test] Calling update-database function...');
    
    // Import and call the function directly
    const { default: handler } = await import('../api/cron/update-database.js');
    
    // Mock request and response objects
    const mockReq = {
      headers: {
        'authorization': `Bearer ${cronSecret}`
      }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`[Test] Response ${code}:`, data);
        }
      })
    };
    
    await handler(mockReq, mockRes);
    
    console.log('[Test] Database update completed!');
    
    // Now test fetching from database
    console.log('\n[Test] Testing database fetch...');
    const { default: matchesHandler } = await import('../api/database-matches.js');
    
    const fetchReq = {
      method: 'GET',
      query: {
        limit: '10'
      }
    };
    
    const fetchRes = {
      setHeader: () => {},
      status: (code) => ({
        json: (data) => {
          console.log(`[Test] Database fetch response ${code}:`);
          console.log(`[Test] Found ${data.data?.length || 0} matches`);
          if (data.data && data.data.length > 0) {
            console.log('[Test] First match:', {
              id: data.data[0].id,
              date: data.data[0].date,
              homeTeam: data.data[0].homeTeam?.name,
              awayTeam: data.data[0].awayTeam?.name,
              score: data.data[0].score,
              status: data.data[0].status
            });
          }
        },
        end: () => {}
      })
    };
    
    await matchesHandler(fetchReq, fetchRes);
    
  } catch (error) {
    console.error('[Test] Error:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseUpdate().catch(console.error);