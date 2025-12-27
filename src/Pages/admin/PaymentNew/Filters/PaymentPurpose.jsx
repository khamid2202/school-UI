import React from "react";
import { useGlobalContext } from "../../../../Hooks/UseContext";

const options = [
  { key: "tuition", label: "Tuition" },
  { key: "dorm", label: "Dorm" },
  { key: "course", label: "Course" },
];

function PaymentPurpose() {
  const { selectedPurpose, setSelectedPurpose } = useGlobalContext();

  return (
    <div className="flex items-center gap-3">
      {options.map((opt) => {
        const active = selectedPurpose === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSelectedPurpose(opt.key)}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default PaymentPurpose;
