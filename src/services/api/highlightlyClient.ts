/**
 * Core client for interacting with the Highlightly API
 * This module handles the direct HTTP communication with the API
 */

// Basic function to fetch data from the Highlightly API via our edge function proxy
export async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  try {
    // Build the URL with query parameters
    const url = new URL(`/functions/v1/highlightly-proxy${endpoint}`, window.location.origin);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
    
    console.log(`🔍 Fetching from Highlightly API: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`❌ API request failed with status: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed with status: ${response.status} ${response.statusText}`);
    }
    
    const jsonResponse = await response.json();
    
    // Handle the nested data structure - Highlightly API returns { data: [...] }
    if (jsonResponse && typeof jsonResponse === 'object') {
      // If the response has a data property that is an array, return that
      if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
        console.log(`✅ API returned ${jsonResponse.data.length} items in data array`);
        return jsonResponse.data;
      }
      // If single object with data property, return the data property
      else if (jsonResponse.data && typeof jsonResponse.data === 'object') {
        console.log('✅ API returned a single object in data property');
        return jsonResponse.data;
      }
      // Otherwise return the whole response
      else {
        console.log('✅ API returned a response without a data property');
        return jsonResponse;
      }
    }
    
    // Default case if response format is unexpected
    console.warn('⚠️ API returned unexpected response format:', jsonResponse);
    return jsonResponse;
  } catch (error) {
    console.error('❌ Error fetching from API:', error);
    throw error;
  }
}

// Test the API connection to diagnose any issues
export async function testApiConnection(): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  try {
    console.log('🔍 Testing Edge Function proxy connection to Highlightly...');
    
    // Start with today's date to ensure we have a required parameter
    const today = new Date().toISOString().split('T')[0];
    const testUrl = `/matches?date=${today}`;
    
    // Try to fetch from the API
    const response = await fetch(`/functions/v1/highlightly-proxy${testUrl}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Test request status: ${response.status} `);
    
    // Get headers for debugging
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Response headers:', headers);
    
    // Try to parse the response as JSON
    let data = null;
    let responsePreview = null;
    
    try {
      const text = await response.text();
      responsePreview = text.length > 500 ? text.substring(0, 500) + '...' : text;
      console.log('Response preview:', responsePreview);
      
      // Try to parse the JSON
      data = JSON.parse(text);
      console.log('✅ Response is valid JSON');
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      return {
        success: false,
        message: 'API returned non-JSON response',
        details: {
          status: response.status,
          headers,
          responsePreview,
          error: String(parseError)
        }
      };
    }
    
    // Check if the API returned an error message
    if (data.error) {
      return {
        success: false,
        message: `API returned error: ${data.error}`,
        details: {
          status: response.status,
          headers,
          data,
          responseStucture: describeObjectStructure(data)
        }
      };
    }
    
    // Check for the expected structure
    if (data && data.data && Array.isArray(data.data)) {
      return {
        success: true,
        message: `Successfully connected to Highlightly API - returned ${data.data.length} items`,
        details: {
          status: response.status,
          headers,
          sampleData: data.data.length > 0 ? data.data[0] : null,
          responseStucture: describeObjectStructure(data)
        }
      };
    } else {
      return {
        success: true,
        message: 'Connected to API but unexpected data structure',
        details: {
          status: response.status,
          headers,
          responseStucture: describeObjectStructure(data)
        }
      };
    }
  } catch (error) {
    console.error('❌ Error testing API connection:', error);
    return {
      success: false,
      message: `Failed to connect to API: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}

// Helper function to describe the structure of an object for debugging
function describeObjectStructure(obj: any): any {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'Empty array []';
    return `Array with ${obj.length} items. First item: ${describeObjectStructure(obj[0])}`;
  }
  
  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      let value = obj[key];
      
      if (value === null) acc[key] = 'null';
      else if (value === undefined) acc[key] = 'undefined';
      else if (Array.isArray(value)) acc[key] = `Array[${value.length}]`;
      else if (typeof value === 'object') acc[key] = 'Object';
      else acc[key] = typeof value;
      
      return acc;
    }, {} as Record<string, string>);
  }
  
  return typeof obj;
}
