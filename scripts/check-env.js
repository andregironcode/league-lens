import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from parent directory
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

console.log('🔍 ENVIRONMENT CHECK...');
console.log('');

console.log('Environment variables:');
console.log(`HIGHLIGHTLY_API_KEY: ${process.env.HIGHLIGHTLY_API_KEY ? 'SET (' + process.env.HIGHLIGHTLY_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
console.log(`SERVER_PORT: ${process.env.SERVER_PORT || 'NOT SET (will use 3001)'}`);

console.log('');
console.log('Current working directory:', process.cwd());
console.log('Script directory:', dirname(fileURLToPath(import.meta.url)));

// Check if we can find any .env files
import fs from 'fs';

const possibleEnvPaths = [
  '.env',
  '../.env',
  'server/.env',
  '.env.local'
];

console.log('');
console.log('Checking for .env files:');
possibleEnvPaths.forEach(path => {
  const exists = fs.existsSync(path);
  console.log(`${path}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
  if (exists) {
    try {
      const content = fs.readFileSync(path, 'utf8');
      console.log(`  Content preview: ${content.substring(0, 100)}...`);
    } catch (e) {
      console.log(`  Error reading: ${e.message}`);
    }
  }
});

// Test the known working API key
const workingKey = 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';
console.log('');
console.log(`Known working key: ${workingKey.substring(0, 10)}...`);
console.log(`Matches env key: ${process.env.HIGHLIGHTLY_API_KEY === workingKey ? '✓ YES' : '✗ NO'}`); 