/**
 * Date utilities for handling timezone-aware date operations
 */

/**
 * Get the current date in CET timezone
 * CET is UTC+1 (or UTC+2 during daylight saving time)
 */
export function getCurrentDateCET(): Date {
  // Create a date object representing the current moment
  const now = new Date();
  
  // Force use 2024 if system shows 2025
  if (now.getFullYear() === 2025) {
    now.setFullYear(2024);
  }
  
  // CET timezone offset: UTC+1 in winter, UTC+2 in summer (CEST)
  // December is winter time in CET = UTC+1
  const month = now.getMonth();
  const isDST = month >= 3 && month <= 9; // Approximate DST period
  const cetOffset = isDST ? 2 : 1; // hours ahead of UTC
  
  // Get current UTC time
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  
  // Convert to CET
  const cetTime = new Date(utcTime + (cetOffset * 3600000));
  
  return cetTime;
}

/**
 * Format date as YYYY-MM-DD string (required by Highlightly API)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "June 22, 2025")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = getCurrentDateCET();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = getCurrentDateCET();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = getCurrentDateCET();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

/**
 * Get date range for matches considering football calendar
 * June 2025: Off-season for most leagues, so we look at recent completed season
 * Returns array of date strings in YYYY-MM-DD format
 */
export function get14DayDateRange(): { dates: string[], startDate: string, endDate: string } {
  console.log(`[DateUtils] Calculating 14-day range: 7 days past + 7 days future centered on today`);
  
  const today = getCurrentDateCET();
  const dates: string[] = [];
  
  // Generate 7 days past + today + 6 days future = 14 days total
  for (let i = -7; i <= 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(formatDateForAPI(date));
  }
  
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  console.log(`[DateUtils] 14-day range: ${startDate} to ${endDate} (${dates.length} dates)`);
  console.log(`[DateUtils] Today's date: ${formatDateForAPI(today)} (position 7 in array)`);
  
  return { dates, startDate, endDate };
}

/**
 * Get recent dates (last 7 days) for testing API calls
 */
export function getRecentDates(dayCount: number = 7): string[] {
  const currentDate = getCurrentDateCET();
  const dates: string[] = [];
  
  for (let i = 0; i < dayCount; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    dates.push(formatDateForAPI(date));
  }
  
  return dates;
}

/**
 * Check if a date is in the past, present, or future
 */
export function getDateStatus(dateString: string): 'past' | 'present' | 'future' {
  const currentDate = getCurrentDateCET();
  const currentDateString = formatDateForAPI(currentDate);
  
  if (dateString < currentDateString) return 'past';
  if (dateString > currentDateString) return 'future';
  return 'present';
}

/**
 * Get the current football season year
 * Football seasons typically run from August to May
 */
export function getCurrentFootballSeason(): string {
  const currentDate = getCurrentDateCET();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // If we're between June-July, we're between seasons
  if (month >= 6 && month <= 7) {
    // Summer period - use current year for tournaments
    return year.toString();
  } else if (month >= 8) {
    // August-December: current season (e.g., 2024-2025 season starting in August 2024)
    return year.toString();
  } else {
    // January-May: still in previous season (e.g., 2023-2024 season ending in May 2024)
    return (year - 1).toString();
  }
}

/**
 * Debug function to log current time info
 */
export function logCurrentTimeInfo(): void {
  const cetDate = getCurrentDateCET();
  const season = getCurrentFootballSeason();
  const { startDate, endDate } = get14DayDateRange();
  
  console.log(`[DateUtils] === Current Time Information ===`);
  console.log(`[DateUtils] CET Date/Time: ${cetDate.toISOString()}`);
  console.log(`[DateUtils] CET Date String: ${formatDateForAPI(cetDate)}`);
  console.log(`[DateUtils] Football Season: ${season}`);
  console.log(`[DateUtils] 14-day range: ${startDate} to ${endDate}`);
  console.log(`[DateUtils] === End Time Information ===`);
} 