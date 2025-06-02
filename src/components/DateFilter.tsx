import React, { useState, useEffect, useRef, useCallback } from 'react';
import { serviceAdapter } from '@/services/serviceAdapter';

interface DateFilterProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  selectedLeagueIds?: string[];
}

interface DateInfo {
  date: Date;
  dayNumber: number;
  monthNumber: number;
  dateString: string; // YYYY-MM-DD format
  ddmmFormat: string; // DD/MM format
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  matchCount: number;
}

const DateFilter: React.FC<DateFilterProps> = ({ onDateSelect, selectedDate, selectedLeagueIds = [] }) => {
  const [dates, setDates] = useState<DateInfo[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<string>('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate rolling date range (7 days before and 7 days after today)
  useEffect(() => {
    const generateDates = async () => {
      const today = new Date();
      const dateRange: DateInfo[] = [];

      // Generate 7 days before today
      for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateInfo = await createDateInfo(date, today);
        dateRange.push(dateInfo);
      }

      // Add today
      const todayInfo = await createDateInfo(today, today);
      dateRange.push(todayInfo);

      // Generate 7 days after today
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateInfo = await createDateInfo(date, today);
        dateRange.push(dateInfo);
      }

      return dateRange;
    };

    const createDateInfo = async (date: Date, today: Date): Promise<DateInfo> => {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayNumber = date.getDate();
      const monthNumber = date.getMonth() + 1;
      const ddmmFormat = `${dayNumber.toString().padStart(2, '0')}/${monthNumber.toString().padStart(2, '0')}`;

      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isFuture = date > today;

      // Fetch match count for this date
      let matchCount = 0;
      try {
        const matches = await serviceAdapter.getMatchesForDate(dateString);
        
        // Filter matches by selected leagues if any are selected
        const filteredMatches = selectedLeagueIds.length > 0 
          ? matches.filter(league => selectedLeagueIds.includes(league.id))
          : matches;
          
        matchCount = filteredMatches.reduce((total, league) => total + league.matches.length, 0);
      } catch (error) {
        console.error(`Error fetching matches for ${dateString}:`, error);
      }

      return {
        date,
        dayNumber,
        monthNumber,
        dateString,
        ddmmFormat,
        isToday,
        isPast,
        isFuture,
        matchCount
      };
    };

    generateDates().then(generatedDates => {
    setDates(generatedDates);

    // Set today as default selected date if no date is provided
    const todayDate = generatedDates.find(d => d.isToday);
    if (todayDate && !selectedDate) {
      setCurrentSelectedDate(todayDate.dateString);
      onDateSelect(todayDate.dateString);
    } else if (selectedDate) {
      setCurrentSelectedDate(selectedDate);
    }
    });
  }, [selectedDate, onDateSelect, selectedLeagueIds]);

  // Handle scroll events for 3D effect
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      setScrollPosition(scrollLeft);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
  }, []);

  // Auto-scroll to today's date on initial load
  useEffect(() => {
    if (dates.length > 0 && scrollContainerRef.current) {
      const todayIndex = dates.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        setTimeout(() => {
          centerDateByIndex(todayIndex);
        }, 100); // Small delay to ensure DOM is ready
      }
    }
  }, [dates]);

  // Helper function to center a date by its index
  const centerDateByIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.offsetWidth;
    const containerPadding = 32; // px-8 = 32px on each side
    const effectiveWidth = containerWidth - (containerPadding * 2);
    const itemWidth = 120; // Width of each date item
    const gapWidth = 24; // gap-6 = 24px
    const totalItemWidth = itemWidth + gapWidth;
    
    // Calculate the exact scroll position to center the item
    // Account for the left padding when calculating item position
    const itemCenterPosition = containerPadding + (index * totalItemWidth) + (itemWidth / 2);
    const viewportCenter = containerWidth / 2;
    const scrollLeft = itemCenterPosition - viewportCenter;
    
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      behavior: 'smooth'
    });
  };

  // Helper function to center a date by its dateString
  const centerDateByString = (dateString: string) => {
    const index = dates.findIndex(d => d.dateString === dateString);
    if (index !== -1) {
      centerDateByIndex(index);
    }
  };

  const handleDateClick = (dateInfo: DateInfo) => {
    setCurrentSelectedDate(dateInfo.dateString);
    onDateSelect(dateInfo.dateString);
    
    // Center the selected date
    setTimeout(() => {
      centerDateByString(dateInfo.dateString);
    }, 50); // Small delay to ensure state update
  };

  // Watch for selectedDate prop changes to center externally selected dates
  useEffect(() => {
    if (selectedDate && dates.length > 0) {
      setTimeout(() => {
        centerDateByString(selectedDate);
      }, 100);
    }
  }, [selectedDate, dates]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Calculate 3D transform for each date item
  const getItemTransform = (index: number) => {
    if (!scrollContainerRef.current) return '';
    
    const container = scrollContainerRef.current;
    const containerWidth = container.offsetWidth;
    const containerPadding = 32; // px-8 = 32px on each side
    const itemWidth = 120;
    const gapWidth = 24; // gap-6 = 24px
    const totalItemWidth = itemWidth + gapWidth;
    
    // Calculate precise positions accounting for padding
    const viewportCenter = scrollPosition + (containerWidth / 2);
    const itemCenterPosition = containerPadding + (index * totalItemWidth) + (itemWidth / 2);
    const distance = Math.abs(viewportCenter - itemCenterPosition);
    const maxDistance = containerWidth * 0.6; // Increased for smoother fade
    
    // Normalize distance (0 = perfect center, 1 = edge)
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Create depth effect - items move backwards as they get further from center
    const translateZ = -normalizedDistance * 120; // Increased depth effect
    const scale = 1 - (normalizedDistance * 0.2); // Subtle scale reduction
    
    // Add special handling for the perfectly centered item
    const isCentered = distance < (totalItemWidth * 0.3);
    const centerBoost = isCentered ? 1.1 : 1; // Boost for centered item
    
    return `
      perspective(1200px) 
      translateZ(${translateZ}px) 
      scale(${scale * centerBoost})
    `;
  };

  // Calculate opacity for fading effect
  const getItemOpacity = (index: number) => {
    if (!scrollContainerRef.current) return 1;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.offsetWidth;
    const containerPadding = 32; // px-8 = 32px on each side
    const itemWidth = 120;
    const gapWidth = 24;
    const totalItemWidth = itemWidth + gapWidth;
    
    // Calculate precise positions accounting for padding
    const viewportCenter = scrollPosition + (containerWidth / 2);
    const itemCenterPosition = containerPadding + (index * totalItemWidth) + (itemWidth / 2);
    const distance = Math.abs(viewportCenter - itemCenterPosition);
    const maxDistance = containerWidth * 0.6;
    
    // Normalize distance and create fade effect
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const opacity = 1 - (normalizedDistance * 0.7); // Fade to 30% opacity at edges
    
    return Math.max(0.3, opacity); // Minimum 30% opacity
  };

  const getDateItemClasses = (dateInfo: DateInfo, index: number) => {
    const isSelected = dateInfo.dateString === currentSelectedDate;
    
    let baseClasses = `
      relative flex-shrink-0 transition-all duration-300 ease-out cursor-pointer select-none
      ${isScrolling ? 'duration-100' : 'duration-300'}
    `;

    if (isSelected) {
      baseClasses += ` transform scale-110`;
    }

    return baseClasses;
  };

  const getDateContentClasses = (dateInfo: DateInfo) => {
    const isSelected = dateInfo.dateString === currentSelectedDate;
    
    let contentClasses = `
      flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300
      backdrop-blur-sm border border-gray-700/30
    `;

    if (isSelected) {
      contentClasses += ` bg-gray-600/80 border-gray-500/50 shadow-lg shadow-gray-500/20`;
    } else if (dateInfo.isToday) {
      contentClasses += ` bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20`;
    } else {
      contentClasses += ` bg-gray-800/30 hover:bg-gray-700/40 border-gray-600/20`;
    }

    return contentClasses;
  };

  return (
    <div className="w-full mb-8">
      <div className="relative overflow-hidden">
        {/* 3D Container */}
      <div 
        ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-8 px-8 scrollbar-hide"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            transformStyle: 'preserve-3d'
        }}
      >
        {dates.map((dateInfo, index) => (
            <div
            key={dateInfo.dateString}
              className={getDateItemClasses(dateInfo, index)}
              style={{
                transform: getItemTransform(index),
                minWidth: '120px',
                transformStyle: 'preserve-3d',
                opacity: getItemOpacity(index)
              }}
            onClick={() => handleDateClick(dateInfo)}
            >
              <div className={getDateContentClasses(dateInfo)}>
                {/* Match count indicator */}
                {dateInfo.matchCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-[#FFC30B] text-black text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {dateInfo.matchCount}
                  </div>
                )}

                {/* Today indicator */}
            {dateInfo.isToday && (
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-gray-800 animate-pulse"></div>
            )}
            
                {/* DD/MM Format */}
                <div className="text-center">
                  <div className={`text-lg font-bold transition-all duration-300 ${
                    currentSelectedDate === dateInfo.dateString 
                      ? 'text-white text-xl' 
                      : dateInfo.isToday 
                        ? 'text-yellow-400' 
                        : 'text-gray-200'
                  }`}>
                    {dateInfo.ddmmFormat}
              </div>
              
                  {/* Day label */}
                  <div className={`text-xs mt-1 transition-all duration-300 ${
                    currentSelectedDate === dateInfo.dateString 
                      ? 'text-gray-200' 
                      : dateInfo.isToday 
                        ? 'text-yellow-300' 
                        : 'text-gray-400'
                  }`}>
                    {dateInfo.isToday ? 'TODAY' : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dateInfo.date.getDay()]}
                  </div>
                </div>
              </div>
            </div>
        ))}
        </div>

        {/* Gradient overlays for depth effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#111111] to-transparent pointer-events-none z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#111111] to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
};

export default DateFilter; 