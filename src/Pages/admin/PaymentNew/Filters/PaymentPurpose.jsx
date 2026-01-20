import React, { useEffect, useRef, useState } from "react";
import { useGlobalContext } from "../../../../Hooks/UseContext";

const options = [
  { key: "tuition", label: "Tuition" },
  { key: "dorm", label: "Dorm" },
  { key: "course", label: "Course" },
];

function PaymentPurpose() {
  const { selectedPurpose, setSelectedPurpose } = useGlobalContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((o) => o.key === selectedPurpose);
  const label = current ? current.label : "Purpose";

  const handleSelect = (key) => {
    setSelectedPurpose(key);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
          current
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        {label}
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
        <div className="absolute z-20 mt-1 w-48 rounded-md bg-white shadow-lg border border-gray-200">
          {options.map((opt) => {
            const active = selectedPurpose === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelect(opt.key)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
              >
                <span>{opt.label}</span>
                {active && (
                  <svg
                    className="w-4 h-4"
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PaymentPurpose;
