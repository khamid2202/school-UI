import React, { useMemo, useState } from "react";

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === "string") {
        return { label: option, value: option };
      }
      if (option && typeof option === "object") {
        const { label, value } = option;
        if (value === undefined || value === null) {
          return null;
        }
        return {
          label: label ?? String(value),
          value,
        };
      }
      return null;
    })
    .filter(Boolean);
};

function ReusableFilter({
  title = "Filter",
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Search...",
  multiple = true,
  allowClear = true,
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return normalizedOptions;
    const query = searchTerm.toLowerCase();
    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchTerm]);

  const isValueSelected = (value) => {
    if (multiple) {
      return Array.isArray(selectedValues)
        ? selectedValues.includes(value)
        : false;
    }
    return selectedValues === value;
  };

  const emitChange = (nextValue) => {
    if (typeof onChange === "function") {
      onChange(nextValue);
    }
  };

  const handleToggle = (value) => {
    if (multiple) {
      const current = Array.isArray(selectedValues) ? selectedValues : [];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((v) => v !== value)
        : [...current, value];
      emitChange(next);
    } else {
      emitChange(isValueSelected(value) ? null : value);
    }
  };

  const handleClear = () => {
    emitChange(multiple ? [] : null);
    setSearchTerm("");
  };

  const hasSelected = multiple
    ? Array.isArray(selectedValues) && selectedValues.length > 0
    : Boolean(selectedValues);

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {hasSelected && (
            <p className="text-xs text-gray-500">
              {multiple
                ? `${selectedValues.length} selected`
                : normalizedOptions.find((opt) => opt.value === selectedValues)
                    ?.label || ""}
            </p>
          )}
        </div>
        {allowClear && hasSelected && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>
      {/* <div className="mt-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div> */}
      <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
        {filteredOptions.length ? (
          filteredOptions.map((option) => {
            const active = isValueSelected(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                {option.label}
              </button>
            );
          })
        ) : (
          <p className="text-xs text-gray-400">No options found.</p>
        )}
      </div>
    </div>
  );
}

export default ReusableFilter;
