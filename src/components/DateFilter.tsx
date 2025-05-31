import React, { useState, useEffect, useRef } from 'react';

interface DateFilterProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

interface DateInfo {
  date: Date;
  dayNumber: number;
  dayName: string;
  dateString: string; // YYYY-MM-DD format
  formattedDate: string; // MM-DD-YYYY format
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

const DateFilter: React.FC<DateFilterProps> = ({ onDateSelect, selectedDate }) => {
  const [dates, setDates] = useState<DateInfo[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate rolling date range (7 days before and 7 days after today)
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
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${month}-${day}-${year}`; // MM-DD-YYYY

      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isFuture = date > today;

      return {
        date,
        dayNumber: date.getDate(),
        dayName: dayNames[date.getDay()],
        dateString,
        formattedDate,
        isToday,
        isPast,
        isFuture
      };
    };

    const generatedDates = generateDates();
    setDates(generatedDates);

    // Set today as default selected date if no date is provided
    const todayDate = generatedDates.find(d => d.isToday);
    if (todayDate && !selectedDate) {
      setCurrentSelectedDate(todayDate.dateString);
      onDateSelect(todayDate.dateString);
    } else if (selectedDate) {
      setCurrentSelectedDate(selectedDate);
    }
  }, [selectedDate, onDateSelect]);

  // Auto-scroll to today's date on initial load
  useEffect(() => {
    if (dates.length > 0 && scrollContainerRef.current) {
      const todayIndex = dates.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        const todayElement = scrollContainerRef.current.children[todayIndex] as HTMLElement;
        if (todayElement) {
          // Smooth scroll to center today's date
          const containerWidth = scrollContainerRef.current.offsetWidth;
          const elementLeft = todayElement.offsetLeft;
          const elementWidth = todayElement.offsetWidth;
          const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
          
          scrollContainerRef.current.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [dates]);

  const handleDateClick = (dateInfo: DateInfo) => {
    setCurrentSelectedDate(dateInfo.dateString);
    onDateSelect(dateInfo.dateString);
  };

  const getDateButtonClasses = (dateInfo: DateInfo) => {
    const baseClasses = "flex-shrink-0 px-4 py-3 rounded-full transition-all duration-200 cursor-pointer select-none relative";
    
    const isSelected = dateInfo.dateString === currentSelectedDate;
    
    if (dateInfo.isToday) {
      return `${baseClasses} ${
        isSelected 
          ? 'bg-yellow-500 text-black font-bold' 
          : 'bg-gray-600 text-white font-bold hover:bg-gray-500'
      }`;
    } else if (dateInfo.isPast) {
      return `${baseClasses} ${
        isSelected 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-800/40 text-gray-400 opacity-60 hover:bg-gray-700/50 hover:opacity-80'
      }`;
    } else {
      // Future dates
      return `${baseClasses} ${
        isSelected 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      }`;
    }
  };

  return (
    <div className="w-full mb-8">
      <div 
        ref={scrollContainerRef}
        className="date-filter-scroll flex gap-3 overflow-x-auto pb-2"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {dates.map((dateInfo, index) => (
          <button
            key={dateInfo.dateString}
            onClick={() => handleDateClick(dateInfo)}
            className={getDateButtonClasses(dateInfo)}
            style={{ minWidth: '70px' }}
          >
            {/* Yellow dot for today */}
            {dateInfo.isToday && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-800"></div>
            )}
            
            <div className="flex flex-col items-center">
              {/* Day number */}
              <div className="text-lg font-semibold">
                {dateInfo.dayNumber}
              </div>
              
              {/* Day name or TODAY */}
              <div className="text-xs">
                {dateInfo.isToday ? 'TODAY' : dateInfo.dayName}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateFilter; 