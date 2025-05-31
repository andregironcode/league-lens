import React from 'react';

interface LiveBadgeProps {
  className?: string;
}

const LiveBadge: React.FC<LiveBadgeProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 bg-yellow-500 text-black px-2 py-1 rounded-full ${className}`}>
      <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
      <span className="text-xs font-bold tracking-wide">LIVE</span>
    </div>
  );
};

export default LiveBadge; 