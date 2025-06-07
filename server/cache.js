import fs from 'fs/promises';
import path from 'path';

const cacheDir = path.join(process.cwd(), 'server', 'cache');
const cacheFile = path.join(cacheDir, 'api-cache.json');

// In-memory cache as fallback
let memoryCache = {};

// Smart TTL calculation based on endpoint type
const getCacheTTL = (endpoint) => {
  const endpointLower = endpoint.toLowerCase();
  
  // Live match data - very short cache
  if (endpointLower.includes('/matches') && endpointLower.includes('date=')) {
    const today = new Date().toISOString().split('T')[0];
    if (endpointLower.includes(today)) {
      return 300; // 5 minutes for today's matches (live data)
    }
    return 3600; // 1 hour for past/future matches
  }
  
  // Highlights - medium cache
  if (endpointLower.includes('/highlights')) return 3600; // 1 hour
  
  // Standings - dynamic cache
  if (endpointLower.includes('/standings')) return 1800; // 30 minutes
  
  // Static league info - long cache
  if (endpointLower.includes('/leagues/') && !endpointLower.includes('matches')) {
    return 86400; // 24 hours for league details
  }
  
  // Team info - medium-long cache
  if (endpointLower.includes('/teams/')) return 43200; // 12 hours
  
  // Statistics and events - short cache
  if (endpointLower.includes('/statistics') || endpointLower.includes('/events')) {
    return 600; // 10 minutes
  }
  
  // Lineups - medium cache
  if (endpointLower.includes('/lineups')) return 7200; // 2 hours
  
  // Default cache
  return 86400; // 24 hours
};

// Ensure cache directory exists
const initializeCache = async () => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    // Try to read the file, if it doesn't exist, create it
    const data = await fs.readFile(cacheFile, 'utf-8');
    memoryCache = JSON.parse(data);
    console.log(`[Cache] Initialized with ${Object.keys(memoryCache).length} cached items`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with an empty object
      memoryCache = {};
      await fs.writeFile(cacheFile, JSON.stringify({}), 'utf-8');
      console.log('[Cache] Created new cache file');
    } else {
      // Other error, use memory cache
      console.error('Error initializing cache, using memory cache:', error);
      memoryCache = {};
    }
  }
};

initializeCache();

const readCache = async () => {
  return memoryCache;
};

const writeCache = async (data) => {
  memoryCache = data;
  try {
    await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing cache to file, using memory cache only:', error);
  }
};

export const getFromCache = async (key) => {
  const cache = await readCache();
  const cachedItem = cache[key];

  if (cachedItem && Date.now() < cachedItem.expiry) {
    const remainingTTL = Math.round((cachedItem.expiry - Date.now()) / 1000);
    console.log(`[Cache] HIT for key: ${key} (${remainingTTL}s remaining)`);
    return cachedItem.data;
  }

  console.log(`[Cache] MISS for key: ${key}`);
  return null;
};

export const setInCache = async (key, data, customTTL = null) => {
  const cache = await readCache();
  const ttl = customTTL || getCacheTTL(key);
  const expiry = Date.now() + ttl * 1000;
  cache[key] = { data, expiry, ttl }; // Store TTL for debugging
  await writeCache(cache);
  console.log(`[Cache] SET for key: ${key} (TTL: ${ttl}s)`);
};

export const clearCache = async () => {
  await writeCache({});
  console.log('[Cache] Cleared all cache');
};

export const getCacheStats = async () => {
  const cache = await readCache();
  const stats = {
    totalItems: Object.keys(cache).length,
    expired: 0,
    valid: 0,
    byType: {}
  };
  
  const now = Date.now();
  Object.entries(cache).forEach(([key, item]) => {
    if (now < item.expiry) {
      stats.valid++;
    } else {
      stats.expired++;
    }
    
    // Categorize by endpoint type
    const type = key.split('/')[3] || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });
  
  return stats;
}; 