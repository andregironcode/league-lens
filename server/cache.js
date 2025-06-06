import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';

const cacheDir = path.join(process.cwd(), 'server', 'cache');
const cacheFile = path.join(cacheDir, 'api-cache.json');

// Ensure cache directory exists
const initializeCache = async () => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    // Try to read the file, if it doesn't exist, create it
    await fs.readFile(cacheFile, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with an empty object
      await fs.writeFile(cacheFile, JSON.stringify({}), 'utf-8');
    } else {
      // Other error
      console.error('Error initializing cache:', error);
    }
  }
};

initializeCache();

const readCache = async () => {
  try {
    await lockfile.lock(cacheFile);
    const data = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(data);
  } finally {
    await lockfile.unlock(cacheFile);
  }
};

const writeCache = async (data) => {
  try {
    await lockfile.lock(cacheFile);
    await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  } finally {
    await lockfile.unlock(cacheFile);
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