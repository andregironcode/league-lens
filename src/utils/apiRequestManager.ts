/**
 * Global API Request Manager
 * Prevents duplicate requests and manages request lifecycle
 */

type PendingRequest = {
  promise: Promise<Response>;
  timestamp: number;
};

class APIRequestManager {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly CACHE_TIME = 1000; // 1 second cache for identical requests

  /**
   * Fetch with deduplication
   * If the same URL is requested multiple times within CACHE_TIME, return the same promise
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = this.getCacheKey(url, options);
    const now = Date.now();

    // Check for pending request
    const pending = this.pendingRequests.get(cacheKey);
    if (pending && (now - pending.timestamp) < this.CACHE_TIME) {
      console.log(`[APIRequestManager] Deduplicating request: ${url}`);
      return pending.promise.then(r => r.clone());
    }

    // Clean up old requests
    this.cleanupOldRequests();

    // Create new request
    const requestPromise = fetch(url, options)
      .then(response => {
        // Clone response before removing from pending
        const clonedResponse = response.clone();
        
        // Remove from pending after a short delay to catch duplicates
        setTimeout(() => {
          this.pendingRequests.delete(cacheKey);
        }, this.CACHE_TIME);
        
        return clonedResponse;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store in pending requests
    this.pendingRequests.set(cacheKey, {
      promise: requestPromise,
      timestamp: now
    });

    return requestPromise;
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const apiRequestManager = new APIRequestManager();

// Export a fetch function that uses the manager
export const managedFetch = (url: string, options?: RequestInit): Promise<Response> => {
  return apiRequestManager.fetch(url, options);
};