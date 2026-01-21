import React, { useMemo, useState, useRef, useEffect } from "react";
import { useGlobalContext } from "../../../../Hooks/UseContext";

function TeacherFilter({ selectedTeachers = [], onToggle }) {
  const { teachers } = useGlobalContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const teacherOptions = useMemo(() => {
    if (!Array.isArray(teachers) || teachers.length === 0) return [];
    return teachers
      .map((t) => {
        const label = t.full_name || t.name || `Teacher ${t.id}`;
        const key = label ? label.trim().toLowerCase() : null;
        if (!key) return null;
        return { key, label };
      })
      .filter(Boolean);
  }, [teachers]);

  const validSelected = useMemo(
    () =>
      selectedTeachers.filter((key) =>
        teacherOptions.some((t) => t.key === key),
      ),
    [selectedTeachers, teacherOptions],
  );

  const isSelected = (key) => validSelected.includes(key);
  const selectedCount = validSelected.length;

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
    teacherOptions.forEach((t) => {
      if (!isSelected(t.key)) onToggle(t.key);
    });
  };

  const handleClearAll = () => {
    if (!onToggle) return;
    teacherOptions.forEach((t) => {
      if (isSelected(t.key)) onToggle(t.key);
    });
  };

  if (teacherOptions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
            selectedCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}
        >
          {selectedCount > 0 ? `${selectedCount} selected` : "Teachers"}
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
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-md border px-2 py-1.5 text-xs font-medium transition-colors border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-64 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2 flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex-1 rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex-1 rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Clear All
            </button>
          </div>
          <div className="py-1">
            {teacherOptions.map((t) => {
              const active = isSelected(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleToggle(t.key)}
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
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherFilter;
