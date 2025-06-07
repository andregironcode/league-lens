import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Video, Clock, Eye } from 'lucide-react';
import { MatchHighlight } from '@/types';

interface HighlightsCarouselProps {
  highlights: MatchHighlight[];
  loading?: boolean;
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ highlights, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (!highlights || highlights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Eye size={32} className="mx-auto mb-2" />
        <p className="text-white font-medium">No Highlights Available</p>
        <p className="text-sm">There are currently no highlight clips for this match.</p>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % highlights.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + highlights.length) % highlights.length);
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // YouTube URLs
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop()?.split('?')[0]
          : new URL(url).searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      
      // Return null for other sources - we'll handle them as external links
      return null;
    } catch {
      return null;
    }
  };

  const isYouTubeVideo = (url: string): boolean => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const formatSource = (source: string): string => {
    if (!source) return 'Unknown';
    if (source === 'youtube') return 'YouTube';
    if (source === 'other') return 'External';
    return source.charAt(0).toUpperCase() + source.slice(1);
  };

  const currentHighlight = highlights[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main Video Display */}
      <div className="relative">
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#191919' }}>
          <div className="aspect-video bg-black relative">
            {currentHighlight.embedUrl || isYouTubeVideo(currentHighlight.url) ? (
              <iframe
                className="w-full h-full"
                src={currentHighlight.embedUrl || getVideoEmbedUrl(currentHighlight.url)}
                title={currentHighlight.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                <img 
                  src={currentHighlight.imgUrl || '/placeholder-thumbnail.jpg'} 
                  alt={currentHighlight.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-thumbnail.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <a 
                    href={currentHighlight.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition-colors flex items-center space-x-2"
                  >
                    <ExternalLink size={18} />
                    <span>Watch on {formatSource(currentHighlight.source)}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* Video Navigation Arrows */}
          {highlights.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Previous highlight"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Next highlight"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          {/* Video Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h5 className="text-white font-semibold mb-1 line-clamp-2">{currentHighlight.title}</h5>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex items-center space-x-4">
                {currentHighlight.description && (
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-medium">
                    {currentHighlight.description}
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <Video size={14} />
                  <span>{formatSource(currentHighlight.source)}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                {currentHighlight.type && (
                  <span className={`px-2 py-1 rounded ${
                    currentHighlight.type === 'VERIFIED' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {currentHighlight.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {highlights.length > 1 && (
        <div className="relative">
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {highlights.map((highlight, index) => (
              <button
                key={highlight.id || index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentIndex 
                    ? 'ring-2 ring-yellow-500 scale-105' 
                    : 'hover:scale-102 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-32 h-18 bg-gray-800">
                  <img
                    src={highlight.imgUrl || '/placeholder-thumbnail.jpg'}
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-thumbnail.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play size={16} className="text-white" />
                  </div>
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-yellow-500/20"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Progress Indicator */}
          <div className="flex justify-center mt-4 space-x-1">
            {highlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to highlight ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-sm text-gray-400">
        Showing {currentIndex + 1} of {highlights.length} highlights
      </div>
    </div>
  );
};

export default HighlightsCarousel; 