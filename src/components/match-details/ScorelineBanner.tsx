import React from 'react';
import { EnhancedMatchHighlight } from '@/types';

// Timing information passed from parent (MatchDetails)
export type TimingState =
  | { state: 'preview'; startsIn: number }
  | { state: 'imminent'; startsIn: number }
  | { state: 'live'; elapsedLabel?: string }
  | { state: 'fullTime' }
  | { state: 'unknown' };

interface ScorelineBannerProps {
  match: EnhancedMatchHighlight;
  timing: TimingState;
}

// Helper to format a countdown in HH:MM:SS (or MM:SS for <1h)
const formatCountdown = (ms: number) => {
  if (ms <= 0) return '00:00';
  
  // Safety check: if the time difference is absurdly large (>24 hours),
  // just show a reasonable default to prevent bizarre countdown displays
  // This acts as a fail-safe for timestamp parsing issues
  if (ms > 24 * 60 * 60 * 1000) {
    console.warn('[ScorelineBanner] Very large time difference detected:', {
      ms,
      hours: Math.floor(ms / (3600 * 1000))
    });
    // For matches more than 24 hours away, just show "1+ days"
    return '1+ days';
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

const ScorelineBanner: React.FC<ScorelineBannerProps> = ({ match, timing }) => {
  const isPreMatch = timing.state === 'preview' || timing.state === 'imminent';
  const isLive = timing.state === 'live';
  const isFullTime = timing.state === 'fullTime';

  // Determine label and colour
  let statusLabel = '';
  if (isFullTime) statusLabel = 'FULL TIME';
  else if (isLive) statusLabel = 'LIVE';
  else if (isPreMatch) statusLabel = 'KICKOFF IN';
  else statusLabel = '';

  const labelColor = isLive || isFullTime ? '#FF4C4C' : '#F7CC45';

  // Determine score / countdown text
  let centreText = '';
  if (isPreMatch) {
    centreText = timing.startsIn ? formatCountdown(timing.startsIn) : '--:--';
  } else {
    centreText =
      match.score?.current ||
      (match.score?.home !== undefined && match.score?.away !== undefined
        ? `${match.score.home} - ${match.score.away}`
        : '0 - 0');
  }

  // Split numbers for styling (only if score format like x - y)
  const parts = centreText.split(' - ');

  return (
    <div className="flex items-center justify-center mb-6 w-full">
      {/* Home */}
      <div className="text-center flex-1">
        <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
        <div className="text-white font-medium text-lg truncate px-1">{match.homeTeam.name}</div>
      </div>

      {/* Centre */}
      <div className="text-center px-8">
        {statusLabel && (
          <div className="font-bold mb-2" style={{ color: labelColor, fontSize: '16px' }}>
            {statusLabel}
          </div>
        )}
        <div className="text-center font-bold mb-2" style={{ color: '#FFFFFF' }}>
          {parts.length === 2 ? (
            <>
              <span style={{ fontSize: '45px' }}>{parts[0]}</span>
              <span style={{ fontSize: '48px' }}> - </span>
              <span style={{ fontSize: '45px' }}>{parts[1]}</span>
            </>
          ) : (
            <span style={{ fontSize: '42px' }}>{centreText}</span>
          )}
        </div>
        {/* Penalties */}
        {match.score?.penalties && (
          <div className="text-gray-400 text-sm mb-3">({match.score.penalties})</div>
        )}
      </div>

      {/* Away */}
      <div className="text-center flex-1">
        <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
        <div className="text-white font-medium text-lg truncate px-1">{match.awayTeam.name}</div>
      </div>
    </div>
  );
};

export default ScorelineBanner;
