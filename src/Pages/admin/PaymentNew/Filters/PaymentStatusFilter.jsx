import React, { useEffect, useMemo, useRef, useState } from "react";

export const paymentStatusOptions = [
  { key: "paid", label: "Paid" },
  { key: "not_full", label: "Not Full" },
  { key: "not_paid", label: "Not Paid" },
];

function PaymentStatusFilter({ selectedStatuses = [], onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSelected = (key) => selectedStatuses.includes(key);
  const allSelected = selectedStatuses.length >= paymentStatusOptions.length;
  const selectedCount = selectedStatuses.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (key) => {
    if (!onToggle) return;
    onToggle(key);
  };

  const handleSelectAll = () => {
    if (!onToggle) return;
    paymentStatusOptions.forEach((s) => {
      if (!isSelected(s.key)) onToggle(s.key);
    });
  };

  const handleClearAll = () => {
    if (!onToggle) return;
    paymentStatusOptions.forEach((s) => {
      if (isSelected(s.key)) onToggle(s.key);
    });
  };

  const buttonLabel = useMemo(() => {
    if (selectedCount === 0) return "Status";
    if (selectedCount === paymentStatusOptions.length) return "All statuses";
    return `${selectedCount} selected`;
  }, [selectedCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
          selectedCount > 0
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        {buttonLabel}
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2 flex gap-2">
            {!allSelected && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex-1 rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Select All
              </button>
            )}
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Clear
              </button>
            )}
          </div>
          <div className="py-1">
            {paymentStatusOptions.map((s) => {
              const active = isSelected(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleToggle(s.key)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    active ? "bg-blue-50 text-blue-700" : "text-gray-700"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      active
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {active && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentStatusFilter;
