
/**
 * Format match status for display
 * @param status Match status from API
 * @returns Formatted status for display
 */
export const formatMatchStatus = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'LIVE':
    case 'IN_PLAY':
      return 'LIVE';
    case 'HT':
      return 'HT';
    case 'FT':
    case 'FINISHED':
      return 'FT';
    case 'SUSPENDED':
      return 'SUSPENDED';
    case 'POSTPONED':
      return 'POSTPONED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'SCHEDULED':
    case 'TIMED':
      return 'Not started';
    case 'AET':
      return 'AET'; // After Extra Time
    case 'PEN':
      return 'PEN'; // Penalties
    case '1H':
      return '1st Half';
    case '2H':
      return '2nd Half';
    case 'ET':
      return 'Extra Time';
    default:
      return status;
  }
};
