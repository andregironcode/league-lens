import React, { useState } from 'react';
import type { LeagueWithMatches, Match } from '@/types';
import MatchRow from './MatchRow';
import { LEAGUE_COUNTRY_MAPPING, COUNTRY_NAMES } from './utils';

interface LeagueCardProps {
  match: Match;
  leagueName: string;
  leagueLogo: string;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ match, leagueName, leagueLogo }) => {
  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <img
          src={leagueLogo}
          alt={leagueName}
          className="w-6 h-6 object-contain rounded-full bg-white p-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{leagueName}</div>
        </div>
      </div>
      <MatchRow match={match} />
    </div>
  );
};

export default LeagueCard; 