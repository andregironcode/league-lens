"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { formatDateForAPI, getCurrentDateCET } from "@/utils/dateUtils";

interface DateSliderProps {
  onDateChange: (date: string) => void;
}

const DateSlider: React.FC<DateSliderProps> = ({ onDateChange }) => {
  const [daysOffset, setDaysOffset] = React.useState(0);

  const dates = React.useMemo(() => {
    const today = getCurrentDateCET();
    return Array.from({ length: 15 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i - 7);
      return date;
    });
  }, []);

  const handleSliderChange = (value: number[]) => {
    const newOffset = value[0];
    setDaysOffset(newOffset);
    const selectedDate = new Date();
    selectedDate.setDate(new Date().getDate() + newOffset);
    onDateChange(formatDateForAPI(selectedDate));
  };

  const getLabel = (offset: number) => {
    if (offset === 0) return "Today";
    if (offset === -1) return "Yesterday";
    if (offset === 1) return "Tomorrow";
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="w-full px-4 py-4 bg-gray-800/50 rounded-lg">
        <label htmlFor="date-slider" className="block text-sm font-medium text-gray-300 mb-2">
            Select a Date
        </label>
        <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 w-24 text-center">{getLabel(-7)}</span>
            <Slider
                id="date-slider"
                min={-7}
                max={7}
                step={1}
                value={[daysOffset]}
                onValueChange={handleSliderChange}
                className="w-full"
            />
            <span className="text-xs text-gray-400 w-24 text-center">{getLabel(7)}</span>
        </div>
        <p className="text-center text-lg font-semibold text-white mt-2">
            {getLabel(daysOffset)}
        </p>
    </div>
  );
};

export default DateSlider; 