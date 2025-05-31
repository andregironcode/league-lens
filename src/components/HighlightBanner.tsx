import React from 'react';
import { MatchHighlight } from '@/types';

interface HighlightBannerProps {
  highlight: MatchHighlight;
}

const HighlightBanner: React.FC<HighlightBannerProps> = ({ highlight }) => {
  // Mock goal scorers data (would come from API in real implementation)
  const goalScorers = [
    { name: 'Benzema', time: '23\'' },
    { name: 'Vinicius Jr.', time: '67\'' },
    { name: 'Modric', time: '89\'' }
  ];

  // Mock additional stats count
  const additionalStatsCount = 21;

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    }
    
    return `${diffInHours} hours ago`;
  };

  // Extract YouTube video ID for thumbnail
  const getYouTubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const videoId = getYouTubeVideoId(highlight.videoUrl);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : highlight.thumbnailUrl;

  return (
    <div className="bg-[#1a1a1a] rounded-xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4 lg:gap-0">
      {/* Left Side */}
      <div className="flex-1 w-full lg:pr-6">
        {/* Highlight Badge */}
        <div className="mb-3">
          <span className="text-xs font-semibold bg-yellow-400 text-black px-2 py-1 rounded-full">
            Highlights of The Week
          </span>
        </div>

        {/* Timestamp */}
        <div className="mb-4">
          <span className="text-xs text-gray-400">
            {formatTimestamp(highlight.date)} · {highlight.competition.name}
          </span>
        </div>

        {/* Match Score Block */}
        <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-4">
          {/* Home Team Logo */}
          <img
            src={highlight.homeTeam.logo}
            alt={highlight.homeTeam.name}
            className="w-8 h-8 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            onError={(e) => e.currentTarget.src = '/icons/default.svg'}
          />

          {/* Score */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white">
              {highlight.score.home} {highlight.score.away}
            </div>
            <div className="text-xs text-gray-300 mt-1 hidden sm:block">
              {highlight.homeTeam.name} vs {highlight.awayTeam.name}
            </div>
          </div>

          {/* Away Team Logo */}
          <img
            src={highlight.awayTeam.logo}
            alt={highlight.awayTeam.name}
            className="w-8 h-8 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            onError={(e) => e.currentTarget.src = '/icons/default.svg'}
          />
        </div>

        {/* Team names on mobile */}
        <div className="sm:hidden text-center mb-4">
          <div className="text-xs text-gray-300">
            {highlight.homeTeam.name} vs {highlight.awayTeam.name}
          </div>
        </div>

        {/* Goal Scorers */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center lg:justify-start">
          {goalScorers.map((scorer, index) => (
            <span
              key={index}
              className="text-xs px-2 sm:px-3 py-1 bg-[#1f1f1f] text-white rounded-full"
            >
              {scorer.name} {scorer.time}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-center lg:justify-start">
          <button className="bg-yellow-400 text-black text-xs px-3 py-1 rounded hover:opacity-80 transition-opacity">
            View all stats
          </button>
          
          {/* Additional Stats Count */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            +{additionalStatsCount}
          </div>
        </div>
      </div>

      {/* Right Side - Thumbnail */}
      <div className="relative w-full lg:w-auto">
        <div className="w-full h-32 sm:h-36 lg:w-64 lg:h-36 rounded-lg overflow-hidden relative">
          <img
            src={thumbnailUrl}
            alt="Match highlights"
            className="w-full h-full object-cover"
            onError={(e) => e.currentTarget.src = '/icons/default.svg'}
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-100 transition-all">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          {/* Score Overlay */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-yellow-500 text-black text-xs sm:text-sm font-bold px-2 py-1 rounded">
            {highlight.score.home} {highlight.score.away}
          </div>

          {/* Duration */}
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {highlight.duration}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightBanner; 