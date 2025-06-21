/**
 * VERCEL CRON JOB EXAMPLE
 * 
 * Save this as: api/sync-football-data.ts
 * 
 * This will run every 30 minutes to sync data from Highlightly API to Supabase
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { FootballDataSyncService } from '../sync-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron job request (optional security)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Cron] Starting scheduled football data sync');
    
    const syncService = new FootballDataSyncService();
    await syncService.runFullSync();
    
    console.log('[Cron] Sync completed successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Football data sync completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Add this to your vercel.json:
/*
{
  "crons": [
    {
      "path": "/api/sync-football-data",
      "schedule": "0,30 * * * *"
    }
  ]
}
*/ 
 * VERCEL CRON JOB EXAMPLE
 * 
 * Save this as: api/sync-football-data.ts
 * 
 * This will run every 30 minutes to sync data from Highlightly API to Supabase
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { FootballDataSyncService } from '../sync-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron job request (optional security)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Cron] Starting scheduled football data sync');
    
    const syncService = new FootballDataSyncService();
    await syncService.runFullSync();
    
    console.log('[Cron] Sync completed successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Football data sync completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Add this to your vercel.json:
/*
{
  "crons": [
    {
      "path": "/api/sync-football-data",
      "schedule": "0,30 * * * *"
    }
  ]
}
*/ 
 * VERCEL CRON JOB EXAMPLE
 * 
 * Save this as: api/sync-football-data.ts
 * 
 * This will run every 30 minutes to sync data from Highlightly API to Supabase
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { FootballDataSyncService } from '../sync-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron job request (optional security)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Cron] Starting scheduled football data sync');
    
    const syncService = new FootballDataSyncService();
    await syncService.runFullSync();
    
    console.log('[Cron] Sync completed successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Football data sync completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Add this to your vercel.json:
/*
{
  "crons": [
    {
      "path": "/api/sync-football-data",
      "schedule": "0,30 * * * *"
    }
  ]
}
*/ 