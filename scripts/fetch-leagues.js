import axios from 'axios';

const PROXY_URL = 'http://localhost:3001/api/highlightly';

async function fetchLeagues() {
  try {
    console.log('Fetching leagues from Highlightly API...');
    const response = await axios.get(`${PROXY_URL}/leagues`);
    
    if (response.data && Array.isArray(response.data.data)) {
      const leagues = response.data.data;
      console.log(`Found ${leagues.length} leagues:`);
      console.log('------------------------------');
      
      // Display all leagues with their IDs
      leagues.forEach((league, index) => {
        console.log(`${index + 1}. ${league.name} (ID: ${league.id})`);
        console.log(`   Country: ${league.country?.name || 'Unknown'}`);
        console.log(`   Seasons: ${league.seasons?.map(s => s.season).join(', ') || 'Unknown'}`);
        console.log('------------------------------');
      });
      
      console.log(`Total: ${leagues.length} leagues`);
    } else {
      console.error('Invalid response format:', response.data);
    }
  } catch (error) {
    console.error('Error fetching leagues:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

fetchLeagues();
