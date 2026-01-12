import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function CreateInvoiceModule({
  open,
  onClose,
  onSubmit,
  loading,
  defaultYear,
  defaultMonth,
}) {
  const initialYear = useMemo(
    () => defaultYear || new Date().getFullYear(),
    [defaultYear]
  );
  const initialMonth = useMemo(
    () => defaultMonth || new Date().getMonth() + 1,
    [defaultMonth]
  );

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  useEffect(() => {
    if (!open) return;
    setYear(initialYear);
    setMonth(initialMonth);
  }, [open, initialYear, initialMonth]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericYear = Number(year);
    const numericMonth = Number(month);
    if (!Number.isFinite(numericYear) || numericYear < 2000) {
      toast.error("Enter a valid year");
      return;
    }
    if (
      !Number.isInteger(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {
      toast.error("Select a valid month");
      return;
    }
    onSubmit?.({ year: numericYear, month: numericMonth });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create invoices
            </h2>
            <p className="text-sm text-gray-600">
              Choose year and month to generate invoices.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700"
            aria-label="Close create invoices modal"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              min="2000"
              max="2100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              required
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateInvoiceModule;
