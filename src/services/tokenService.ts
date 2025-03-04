
/**
 * Service for managing the Scorebat API token
 */

// Get the API token from environment variables or localStorage
export const getApiToken = (): string => {
  // Check for environment variable first (highest priority)
  const envToken = import.meta.env.VITE_SCOREBAT_API_TOKEN;
  if (envToken) return envToken;
  
  // Fall back to localStorage if available
  const localToken = localStorage.getItem('scorebat-api-token');
  if (localToken) return localToken;
  
  // Use the token provided by the user as default
  return "MTk1NDQ4XzE3NDEwODA4NDdfOGNmZWUwYmVmOWVmNGRlOTY0OGE2MGM0NjA1ZGRmMWM1YzljNDc5Yg==";
};

// Save token to localStorage for persistence
export const saveApiToken = (token: string): void => {
  if (!token) return;
  localStorage.setItem('scorebat-api-token', token);
  
  // Dispatch an event to notify the app that the token has been updated
  window.dispatchEvent(new CustomEvent('scorebat-token-updated', { 
    detail: { token, refresh: true } 
  }));
};

// Clear token from localStorage
export const clearApiToken = (): void => {
  localStorage.removeItem('scorebat-api-token');
  
  // Dispatch an event to notify the app that the token has been cleared
  window.dispatchEvent(new CustomEvent('scorebat-token-updated', { 
    detail: { token: null, refresh: true } 
  }));
};

// Force a refresh of data using the current token
export const refreshWithCurrentToken = (): void => {
  const token = getApiToken();
  window.dispatchEvent(new CustomEvent('scorebat-force-refresh', { 
    detail: { token } 
  }));
};
