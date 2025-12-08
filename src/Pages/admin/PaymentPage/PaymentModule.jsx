import React, { useEffect } from "react";

export default function PaymentModule({
  open,
  studentName,
  amount,
  method,
  date,
  error,
  submitting,
  purpose,
  purposeLabel,
  onClose,
  onChange,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={() => onClose?.()}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Record Payment</h2>
        <p className="mt-1 text-sm text-gray-500">{studentName}</p>

        {(purposeLabel || purpose) && (
          <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
              Purpose
            </p>
            {/* <p className="text-sm font-medium text-blue-700">
              {purposeLabel || purpose}
            </p> */}
            {purpose && purposeLabel !== purpose && (
              <p className="text-xs text-blue-500/80">{purpose}</p>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="payment-amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount
            </label>
            <input
              id="payment-amount"
              type="number"
              value={amount ?? ""}
              onChange={(event) => onChange?.("amount", event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              autoFocus
              placeholder={amount ?? ""}
            />
          </div>

          <div>
            <label
              htmlFor="payment-method"
              className="block text-sm font-medium text-gray-700"
            >
              Method
            </label>
            <select
              id="payment-method"
              value={method ?? "cash"}
              onChange={(event) => onChange?.("method", event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-date"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Date
            </label>
            <input
              id="payment-date"
              type="date"
              value={date ?? ""}
              onChange={(event) => onChange?.("date", event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="rounded border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
