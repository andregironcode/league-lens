"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { formatDateForAPI, getCurrentDateCET, get14DayDateRange } from "@/utils/dateUtils";

interface DateSliderProps {
  onDateChange: (date: string) => void;
}

const DateSlider: React.FC<DateSliderProps> = ({ onDateChange }) => {
  const dates = React.useMemo(() => {
    // Use the same date range logic as the data fetching to ensure consistency
    const { dates: dateStrings } = get14DayDateRange();
    return dateStrings.map(dateStr => new Date(dateStr));
  }, []);

  // Start at position 7 (today's date in the 14-day range: 7 past + today + 6 future)
  const [selectedIndex, setSelectedIndex] = React.useState(7);

  const handleSliderChange = (value: number[]) => {
    const newIndex = value[0];
    setSelectedIndex(newIndex);
    const selectedDate = dates[newIndex];
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
  
  return (
    <div className="w-full px-4 py-4 bg-gray-800/50 rounded-lg">
        <label htmlFor="date-slider" className="block text-sm font-medium text-gray-300 mb-2">
            Select a Date
        </label>
        <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 w-24 text-center">{getLabel(0)}</span>
            <Slider
                id="date-slider"
                min={0}
                max={dates.length - 1}
                step={1}
                value={[selectedIndex]}
                onValueChange={handleSliderChange}
                className="w-full"
            />
            <span className="text-xs text-gray-400 w-24 text-center">{getLabel(dates.length - 1)}</span>
        </div>
        <p className="text-center text-lg font-semibold text-white mt-2">
            {getLabel(selectedIndex)}
        </p>
    </div>
  );
};

export default DateSlider; 