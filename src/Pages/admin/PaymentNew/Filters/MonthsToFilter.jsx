import React from "react";

export const monthsOptions = [
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
];

function MonthsToFilter({ selectedMonths = [], onToggle }) {
  const isSelected = (key) => selectedMonths.includes(key);
  const allSelected = selectedMonths.length >= monthsOptions.length;

  const handleClick = (key) => {
    if (!onToggle) return;
    onToggle(key);
  };

  const handleSelectAll = () => {
    if (!onToggle) return;
    monthsOptions.forEach((m) => {
      if (!isSelected(m.key)) onToggle(m.key);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {monthsOptions.map((m) => {
        const active = isSelected(m.key);
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => handleClick(m.key)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {m.label}
          </button>
        );
      })}
      {allSelected ? null : (
        <button
          type="button"
          onClick={handleSelectAll}
          className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          Select all
        </button>
      )}
    </div>
  );
}

export default MonthsToFilter;
