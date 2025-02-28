
import { useState, useEffect } from 'react';
import { format, addDays, isSameDay } from 'date-fns';

interface DayNavigationProps {
  onSelectDay: (date: Date) => void;
}

const DayNavigation = ({ onSelectDay }: DayNavigationProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [days, setDays] = useState<Date[]>([]);

  useEffect(() => {
    // Generate an array of dates (3 days before and 3 days after today)
    const daysArray: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      daysArray.push(addDays(new Date(), i));
    }
    setDays(daysArray);
  }, []);

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    onSelectDay(date);
  };

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between py-6 px-4 overflow-x-auto scrollbar-hide">
        {days.map((day, index) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <button
              key={index}
              onClick={() => handleSelectDay(day)}
              className={`flex flex-col items-center justify-center min-w-[80px] px-4 py-3 rounded-full transition-all ${
                isSelected 
                  ? 'bg-white text-black' 
                  : 'bg-highlight-800/50 text-white hover:bg-highlight-700/50'
              }`}
            >
              <span className="text-lg font-bold">{format(day, 'd')}</span>
              <span className="text-xs uppercase">{isToday ? 'TODAY' : format(day, 'EEE')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DayNavigation;
