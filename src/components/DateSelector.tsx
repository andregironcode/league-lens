"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { formatDateForAPI, getCurrentDateCET, get14DayDateRange } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  onDateChange: (date: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ onDateChange }) => {
  // Container ref for scroll functionality
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const dates = React.useMemo(() => {
    // Use the same date range logic as the data fetching to ensure consistency
    const { dates: dateStrings } = get14DayDateRange();
    return dateStrings.map(dateStr => new Date(dateStr));
  }, []);

  // Start at position 7 (today's date in the 14-day range: 7 past + today + 6 future)
  const [selectedIndex, setSelectedIndex] = React.useState(7);
  
  React.useEffect(() => {
    // Center the selected date pill when component mounts
    if (containerRef.current) {
      const pillWidth = 120; // Width of each date pill + margins
      const scrollPosition = selectedIndex * pillWidth - (containerRef.current.offsetWidth / 2) + (pillWidth / 2);
      containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleDateSelect = (index: number) => {
    setSelectedIndex(index);
    const selectedDate = dates[index];
    onDateChange(formatDateForAPI(selectedDate));
  };

  const getLabel = (index: number) => {
    if (index < 0 || index >= dates.length) return "";
    const date = dates[index];
    const today = getCurrentDateCET();
    const isToday = formatDateForAPI(date) === formatDateForAPI(today);
    const isYesterday = formatDateForAPI(date) === formatDateForAPI(new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const isTomorrow = formatDateForAPI(date) === formatDateForAPI(new Date(today.getTime() + 24 * 60 * 60 * 1000));
    
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    if (isTomorrow) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const getFormattedDate = (index: number) => {
    if (index < 0 || index >= dates.length) return "";
    const date = dates[index];
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: 'short' });
    return `${day} ${month}`;
  };

  return (
    <div className="w-full px-4 py-6 bg-gray-800/20 rounded-3xl">
      <label className="block text-lg font-medium text-gray-300 mb-4 ml-2">
        Select a Date
      </label>
      
      {/* Main pill container */}
      <div className="relative w-full bg-gray-800/50 rounded-full p-2 mb-4">
        {/* Scrollable container for dates */}
        <div 
          ref={containerRef}
          className={cn(
            "flex overflow-x-auto py-2 px-4 snap-x snap-mandatory",
            "scrollbar-hide" /* Using existing utility class from index.css */
          )}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex space-x-2 px-4">
            {dates.map((date, index) => {
              const isSelected = index === selectedIndex;
              // Calculate scale and opacity based on distance from selected index
              const distance = Math.abs(index - selectedIndex);
              const scale = Math.max(0.8, 1 - (distance * 0.05));
              const opacity = Math.max(0.5, 1 - (distance * 0.15));
              
              return (
                <motion.div
                  key={index}
                  className={`flex-shrink-0 snap-center cursor-pointer py-2 px-4 rounded-full transition-all duration-300 flex flex-col items-center justify-center min-w-[100px] ${
                    isSelected 
                      ? 'bg-[#FFC30B] text-black font-medium' 
                      : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => handleDateSelect(index)}
                  animate={{
                    scale,
                    opacity,
                    z: isSelected ? 10 : -distance
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {getLabel(index)}
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                      {getFormattedDate(index)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Selected date display */}
      <div className="text-center mt-4">
        <p className="text-xl font-semibold text-white">
          {getLabel(selectedIndex)}
        </p>
      </div>
    </div>
  );
};

export default DateSelector;
