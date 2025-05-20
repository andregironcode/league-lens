
// Core client for making authenticated requests to the Highlightly API via our proxy
import { toast } from 'sonner';

// Base URL for our Supabase Edge Function proxy
const PROXY_URL = 'https://cctqwyhoryahdauqcetf.supabase.co/functions/v1/highlightly-proxy';

// Helper function to make authenticated requests via our proxy
export async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}, retries = 2) {
  const url = new URL(`${PROXY_URL}${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const fullUrl = url.toString();
  
  // Log the request details for debugging
  console.log(`🔍 API Request via proxy to: ${endpoint} with params:`, params);
  
  let attempts = 0;
  let lastError;
  
  while (attempts <= retries) {
    attempts++;
    try {
      // Make the request through our proxy
      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Log response details
      console.log(`📥 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`❌ API error (${response.status}): ${response.statusText}`, errorText);
        
        if (response.status === 403) {
          console.error('💡 403 FORBIDDEN - Authentication error with Highlightly API. Make sure:');
          console.error('  1. The API key is valid and active');
          console.error('  2. The header format in the Edge Function is correct');
        }
        
        // If we get a 429 (rate limit) or 5xx (server error), retry after a delay
        if ((response.status === 429 || response.status >= 500) && attempts <= retries) {
          const retryDelay = response.status === 429 
            ? parseInt(response.headers.get('retry-after') || '2', 10) * 1000
            : 1000 * attempts; // Exponential backoff
            
          console.log(`⏱️ Retrying in ${retryDelay}ms... (Attempt ${attempts} of ${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue; // Retry the request
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // Check for JSON content type
      const contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType || 'not specified'}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Response (${endpoint}): Success`);
        return data;
      } else {
        // If not JSON, log the response body
        const textResponse = await response.text();
        console.error('❌ Received non-JSON response:', textResponse.substring(0, 500) + (textResponse.length > 500 ? '...' : ''));
        throw new Error('API returned non-JSON response');
      }
    } catch (error) {
      console.error(`❌ Error fetching from API (attempt ${attempts}):`, error);
      lastError = error;
      
      // Only retry for network errors
      if (error instanceof TypeError && error.message.includes('fetch') && attempts <= retries) {
        const retryDelay = 1000 * attempts; // Exponential backoff
        console.log(`🌐 Network error. Retrying in ${retryDelay}ms... (Attempt ${attempts} of ${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        break; // Don't retry for other errors
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error(`Failed after ${retries + 1} attempts`);
}

// Test the connection to the API
export async function testApiConnection(): Promise<{success: boolean, message: string, details?: any}> {
  try {
    console.log('🔍 Testing Edge Function proxy connection to Highlightly...');
    
    // Make a simple request to test the connection
    const response = await fetch(`${PROXY_URL}/matches?date=${new Date().toISOString().split('T')[0]}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Test request status: ${response.status} ${response.statusText}`);
    
    // Log response headers in a cleaner format
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('Response headers:', responseHeaders);
    
    const text = await response.text();
    console.log('Response preview:', text.length > 500 ? text.substring(0, 500) + '...' : text);
    
    let jsonData = null;
    try {
      jsonData = JSON.parse(text);
      console.log('✅ Response is valid JSON');
      
      // Enhanced success detection
      if (Array.isArray(jsonData) || (jsonData && !jsonData.error)) {
        return {
          success: true,
          message: `Connection successful! Received valid data from Highlightly API.`,
          details: {
            contentType: response.headers.get('content-type'),
            status: response.status,
            dataPreview: Array.isArray(jsonData) 
              ? `Received ${jsonData.length} items` 
              : 'Received JSON object',
            data: jsonData
          }
        };
      } else if (jsonData.error) {
        return {
          success: false,
          message: `API Error: ${jsonData.error}`,
          details: {
            errorType: jsonData.error.includes("Missing mandatory HTTP Headers") 
              ? "Authentication Error - Check API key configuration in the Edge Function" 
              : "API Error Response",
            status: response.status,
            responseData: jsonData
          }
        };
      }
    } catch (e) {
      console.error('❌ Response is not valid JSON:', e);
      console.log('Raw response:', text);
    }
    
    if (response.ok) {
      return {
        success: true,
        message: `Proxy connection successful (${response.status} ${response.statusText})`,
        details: {
          contentType: response.headers.get('content-type'),
          dataPreview: jsonData ? 'Valid JSON received' : 'Invalid JSON format',
          responsePreview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        }
      };
    } else {
      return {
        success: false,
        message: `Proxy error: ${response.status} ${response.statusText}`,
        details: {
          responseText: text.substring(0, 500),
          headers: responseHeaders,
          errorType: response.status === 403 
            ? 'API Authentication Error - Check API key configuration in the Edge Function' 
            : `HTTP Error ${response.status}`
        }
      };
    }
  } catch (error) {
    console.error('Test request failed:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}
