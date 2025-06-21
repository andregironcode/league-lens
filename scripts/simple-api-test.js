import dotenv from 'dotenv';

dotenv.config();

async function testApi() {
  console.log('🔍 Simple API Test with Correct Endpoint');
  console.log('='.repeat(40));
  
  const apiKey = process.env.VITE_HIGHLIGHTLY_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found in environment');
    console.log('💡 Expected: VITE_HIGHLIGHTLY_API_KEY');
    return;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
  
  try {
    console.log('📡 Testing API endpoint...');
    
    const url = 'https://soccer.highlightly.net/leagues?limit=1';
    console.log('🌐 URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response statusText:', response.statusText);
    
    if (response.status === 429) {
      console.log('❌ API is rate limited - too many requests');
      const resetTime = response.headers.get('X-RateLimit-Reset');
      if (resetTime) {
        console.log('🕐 Rate limit resets at:', new Date(resetTime * 1000));
      }
      return;
    }
    
    if (response.status === 401) {
      console.log('❌ API key is invalid or expired');
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📋 Sample data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      console.log('\n🎉 API is working! Ready to sync real data!');
    } else {
      const errorText = await response.text();
      console.log('❌ API error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('🔍 Full error:', error);
  }
}

testApi(); 

dotenv.config();

async function testApi() {
  console.log('🔍 Simple API Test with Correct Endpoint');
  console.log('='.repeat(40));
  
  const apiKey = process.env.VITE_HIGHLIGHTLY_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found in environment');
    console.log('💡 Expected: VITE_HIGHLIGHTLY_API_KEY');
    return;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
  
  try {
    console.log('📡 Testing API endpoint...');
    
    const url = 'https://soccer.highlightly.net/leagues?limit=1';
    console.log('🌐 URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response statusText:', response.statusText);
    
    if (response.status === 429) {
      console.log('❌ API is rate limited - too many requests');
      const resetTime = response.headers.get('X-RateLimit-Reset');
      if (resetTime) {
        console.log('🕐 Rate limit resets at:', new Date(resetTime * 1000));
      }
      return;
    }
    
    if (response.status === 401) {
      console.log('❌ API key is invalid or expired');
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📋 Sample data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      console.log('\n🎉 API is working! Ready to sync real data!');
    } else {
      const errorText = await response.text();
      console.log('❌ API error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('🔍 Full error:', error);
  }
}

testApi(); 

dotenv.config();

async function testApi() {
  console.log('🔍 Simple API Test with Correct Endpoint');
  console.log('='.repeat(40));
  
  const apiKey = process.env.VITE_HIGHLIGHTLY_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found in environment');
    console.log('💡 Expected: VITE_HIGHLIGHTLY_API_KEY');
    return;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
  
  try {
    console.log('📡 Testing API endpoint...');
    
    const url = 'https://soccer.highlightly.net/leagues?limit=1';
    console.log('🌐 URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response statusText:', response.statusText);
    
    if (response.status === 429) {
      console.log('❌ API is rate limited - too many requests');
      const resetTime = response.headers.get('X-RateLimit-Reset');
      if (resetTime) {
        console.log('🕐 Rate limit resets at:', new Date(resetTime * 1000));
      }
      return;
    }
    
    if (response.status === 401) {
      console.log('❌ API key is invalid or expired');
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📋 Sample data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      console.log('\n🎉 API is working! Ready to sync real data!');
    } else {
      const errorText = await response.text();
      console.log('❌ API error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('🔍 Full error:', error);
  }
}

testApi(); 