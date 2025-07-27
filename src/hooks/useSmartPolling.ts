import { useEffect, useRef, useCallback } from 'react';

interface UseSmartPollingOptions {
  enabled?: boolean;
  interval: number;
  onFetch: () => Promise<void>;
  // Avoid polling when server is updating (every 30 seconds)
  avoidServerUpdates?: boolean;
}

/**
 * Smart polling hook that:
 * 1. Prevents polling during server update windows
 * 2. Adds jitter to prevent thundering herd
 * 3. Cleans up properly on unmount
 */
export function useSmartPolling({
  enabled = true,
  interval,
  onFetch,
  avoidServerUpdates = true
}: UseSmartPollingOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isPollingRef = useRef(false);

  const scheduleNextPoll = useCallback(() => {
    if (!enabled || isPollingRef.current) return;

    // Add 0-10% jitter to prevent thundering herd
    const jitter = Math.random() * interval * 0.1;
    let nextInterval = interval + jitter;

    if (avoidServerUpdates) {
      // Server updates every 30 seconds, avoid polling during update windows
      const now = Date.now();
      const secondsSinceMinute = (now / 1000) % 60;
      
      // If we're within 2 seconds of a 30-second mark, delay polling
      if ((secondsSinceMinute >= 29 && secondsSinceMinute <= 31) || 
          (secondsSinceMinute >= 59 || secondsSinceMinute <= 1)) {
        nextInterval += 3000; // Add 3 seconds to skip the update window
        console.log('[SmartPolling] Avoiding server update window');
      }
    }

    timeoutRef.current = setTimeout(async () => {
      if (!enabled) return;
      
      isPollingRef.current = true;
      try {
        await onFetch();
      } catch (error) {
        console.error('[SmartPolling] Error during fetch:', error);
      } finally {
        isPollingRef.current = false;
        scheduleNextPoll();
      }
    }, nextInterval);
  }, [enabled, interval, onFetch, avoidServerUpdates]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Start polling
    scheduleNextPoll();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isPollingRef.current = false;
    };
  }, [enabled, scheduleNextPoll]);
}