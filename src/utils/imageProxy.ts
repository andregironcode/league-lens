/**
 * Image proxy utilities to handle CORS issues
 */

// List of domains that block CORS requests
const BLOCKED_DOMAINS = [
  'images.fotmob.com',
  'highlightly.net',
  'soccer.highlightly.net'
];

// Fallback images
const FALLBACK_IMAGES = {
  team: 'https://www.sofascore.com/static/images/placeholders/team.svg',
  league: 'https://www.sofascore.com/static/images/placeholders/league.svg',
  player: 'https://www.sofascore.com/static/images/placeholders/player.svg'
};

/**
 * Check if an image URL is from a blocked domain
 */
export function isBlockedDomain(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return BLOCKED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get a proxied or fallback image URL
 */
export function getProxiedImageUrl(url: string, type: 'team' | 'league' | 'player' = 'team'): string {
  if (!url) return FALLBACK_IMAGES[type];
  
  // If it's already a fallback image, return as is
  if (Object.values(FALLBACK_IMAGES).includes(url)) {
    return url;
  }
  
  // Check if domain is blocked
  if (isBlockedDomain(url)) {
    console.log(`[ImageProxy] Blocked domain detected, using fallback for: ${url}`);
    return FALLBACK_IMAGES[type];
  }
  
  // For production, you might want to use a proper image proxy service
  // For now, return the original URL and let the onError handler deal with it
  return url;
}

/**
 * Handle image load errors
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  type: 'team' | 'league' | 'player' = 'team'
): void {
  const img = event.currentTarget;
  console.log(`[ImageProxy] Image failed to load: ${img.src}`);
  img.src = FALLBACK_IMAGES[type];
}