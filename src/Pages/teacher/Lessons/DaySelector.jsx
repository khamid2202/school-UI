import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function DaySelector({ selectedDate, onDateChange }) {
  // Generate dates for the current week (Mon-Fri)
  const weekDates = useMemo(() => {
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get Monday of the current week
    const monday = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);

    const dates = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      dates.push({
        dateString: date.toISOString().split("T")[0],
        dayName: dayNames[i],
        dayNumber: date.getDate(),
      });
    }

    return dates;
  }, [selectedDate]);

  const handlePreviousWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 7);
    onDateChange(current.toISOString().split("T")[0]);
  };

  const handleNextWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 7);
    onDateChange(current.toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between sm:justify-start sm:gap-2">
        <button
          onClick={handlePreviousWeek}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1 sm:px-0 sm:py-0 w-full">
          {weekDates.map((date) => (
            <button
              key={date.dateString}
              onClick={() => onDateChange(date.dateString)}
              className={`min-w-[90px] sm:min-w-[110px] px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all ${
                selectedDate === date.dateString
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="text-[11px] sm:text-xs font-semibold">
                {date.dayName}
              </div>
              <div className="text-sm">{date.dayNumber}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Next week"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export default DaySelector;
