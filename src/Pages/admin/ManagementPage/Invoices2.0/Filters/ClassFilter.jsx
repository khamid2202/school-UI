import React, { useEffect, useMemo, useRef, useState } from "react";

function ClassFilter({ options = [], selected = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCount = selected.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value) => {
    if (!onChange) return;
    onChange((prev) => {
      const has = prev.includes(value);
      return has ? prev.filter((v) => v !== value) : [...prev, value];
    });
  };

  const selectAll = () => {
    if (!onChange) return;
    onChange(options);
  };

  const clearAll = () => {
    if (!onChange) return;
    onChange([]);
  };

  const sortedOptions = useMemo(
    () => options.slice().sort((a, b) => a.localeCompare(b)),
    [options],
  );

  if (sortedOptions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
          selectedCount > 0
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        {selectedCount > 0
          ? `${selectedCount} class${selectedCount > 1 ? "es" : ""}`
          : "Classes"}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Clear All
            </button>
          </div>
          <div className="py-1">
            {sortedOptions.map((cls) => {
              const active = selected.includes(cls);
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggle(cls)}
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
                  {cls}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassFilter;
