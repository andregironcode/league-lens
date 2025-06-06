import fs from 'fs/promises';
import path from 'path';

const cacheDir = path.join(process.cwd(), 'server', 'cache');
const cacheFile = path.join(cacheDir, 'api-cache.json');

// In-memory cache as fallback
let memoryCache = {};

// Ensure cache directory exists
const initializeCache = async () => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    // Try to read the file, if it doesn't exist, create it
    const data = await fs.readFile(cacheFile, 'utf-8');
    memoryCache = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with an empty object
      memoryCache = {};
      await fs.writeFile(cacheFile, JSON.stringify({}), 'utf-8');
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
    console.log(`[Cache] HIT for key: ${key}`);
    return cachedItem.data;
  }

  console.log(`[Cache] MISS for key: ${key}`);
  return null;
};

export const setInCache = async (key, data, ttlInSeconds = 86400) => { // Default TTL is 1 day
  const cache = await readCache();
  const expiry = Date.now() + ttlInSeconds * 1000;
  cache[key] = { data, expiry };
  await writeCache(cache);
  console.log(`[Cache] SET for key: ${key}`);
};

export const clearCache = async () => {
  await writeCache({});
  console.log('[Cache] Cleared');
}; 