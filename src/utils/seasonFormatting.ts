/**
 * Formats a season number to the standard football season format
 * @param season - The season number (e.g., 2024)
 * @returns The formatted season string (e.g., "2024-25")
 */
export const formatSeason = (season: number | string): string => {
  const seasonYear = typeof season === 'string' ? parseInt(season) : season;
  const nextYear = seasonYear + 1;
  const nextYearShort = nextYear.toString().slice(-2);
  return `${seasonYear}-${nextYearShort}`;
};

/**
 * Parses a formatted season string back to the season year
 * @param formattedSeason - The formatted season string (e.g., "2024-25")
 * @returns The season year number (e.g., 2024)
 */
export const parseSeasonFromFormat = (formattedSeason: string): number => {
  const year = formattedSeason.split('-')[0];
  return parseInt(year);
};

/**
 * Gets the current season year based on the current date
 * Football seasons typically start in August/September
 * @returns The current season year
 */
export const getCurrentSeasonYear = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (January = 0)
  
  // If we're in January through July, we're still in the previous season
  // (e.g., January 2025 is still the 2024-25 season)
  if (currentMonth < 7) {
    return currentYear - 1;
  }
  
  return currentYear;
};

/**
 * Gets the current formatted season string
 * @returns The current season in "YYYY-YY" format
 */
export const getCurrentFormattedSeason = (): string => {
  return formatSeason(getCurrentSeasonYear());
}; 