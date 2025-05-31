import React, { useState, useEffect, useRef } from 'react';

interface DateInfo {
  date: Date;
  dayNumber: number;
  label: string;
  dateString: string; // YYYY-MM-DD format
  isToday: boolean;
}

interface DatePickerNavigationProps {
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
}

const DatePickerNavigation: React.FC<DatePickerNavigationProps> = ({
  selectedDate,
  onDateSelect
}) => {
  const [dates, setDates] = useState<DateInfo[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateDates = () => {
      const today = new Date();
      const dateRange: DateInfo[] = [];

      // Generate 7 days before today
      for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dateRange.push(createDateInfo(date, today));
      }

      // Add today
      dateRange.push(createDateInfo(today, today));

      // Generate 7 days after today
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dateRange.push(createDateInfo(date, today));
      }

      return dateRange;
    };

    const createDateInfo = (date: Date, today: Date): DateInfo => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const isToday = date.toDateString() === today.toDateString();
      
      let label: string;
      if (isToday) {
        label = 'Today';
      } else {
        label = dayNames[date.getDay()];
      }

      return {
        date,
        dayNumber: date.getDate(),
        label,
        dateString,
        isToday
      };
    };

    setDates(generateDates());
  }, []);

  // Auto-scroll to selected date
  useEffect(() => {
    if (dates.length > 0 && scrollContainerRef.current && selectedDate) {
      const selectedIndex = dates.findIndex(d => d.dateString === selectedDate);
      if (selectedIndex !== -1) {
        const selectedElement = scrollContainerRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          // Smooth scroll to center selected date
          const containerWidth = scrollContainerRef.current.offsetWidth;
          const elementLeft = selectedElement.offsetLeft;
          const elementWidth = selectedElement.offsetWidth;
          const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
          
          scrollContainerRef.current.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [dates, selectedDate]);

  // Hide scrollbar with CSS
  useEffect(() => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current;
      const style = element.style as any;
      style.msOverflowStyle = 'none';
      style.scrollbarWidth = 'none';
      
      // Create CSS rule for webkit scrollbar
      const css = `
        .date-picker-scroll::-webkit-scrollbar {
          display: none;
        }
      `;
      const styleElement = document.createElement('style');
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
      
      return () => {
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
      };
    }
  }, []);

  const handleDateClick = (dateInfo: DateInfo) => {
    onDateSelect(dateInfo.dateString);
  };

  return (
    <div className="w-full">
      <div 
        ref={scrollContainerRef}
        className="date-picker-scroll flex justify-start lg:justify-center items-center gap-2 sm:gap-3 py-4 overflow-x-auto px-4"
      >
        {dates.map((dateInfo) => {
          const isSelected = dateInfo.dateString === selectedDate;
          
          return (
            <button
              key={dateInfo.dateString}
              onClick={() => handleDateClick(dateInfo)}
              className={`
                relative flex flex-col items-center px-3 sm:px-4 py-2 sm:py-3 rounded-full transition-all duration-200 
                min-w-[56px] sm:min-w-[64px] flex-shrink-0 touch-manipulation
                ${isSelected 
                  ? 'bg-[#2a2a2a] text-white font-semibold scale-105' 
                  : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f] active:scale-95'
                }
              `}
            >
              {/* Yellow dot indicator for active item */}
              {isSelected && (
                <div className="absolute -top-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
              )}
              
              {/* Day number */}
              <span className="text-base sm:text-lg font-bold">
                {dateInfo.dayNumber}
              </span>
              
              {/* Day label */}
              <span className="text-xs">
                {dateInfo.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DatePickerNavigation; 