import React, { useMemo } from "react";

function TotalPaidModule({
  isOpen,
  onClose,
  payments = [],
  studentName,
  walletBalance,
}) {
  const items = useMemo(() => payments || [], [payments]);

  const totals = useMemo(() => {
    const sum = items.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
    return {
      sum,
      count: items.length,
    };
  }, [items]);

  const formatDate = (value) => {
    const ts = value ? Date.parse(value) : NaN;
    if (Number.isNaN(ts)) return "-";
    return new Date(ts).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            <p className="text-base font-semibold text-gray-700 mt-1">
              {studentName ? `Student: ${studentName}` : "Payment info"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Wallet balance: {walletBalance ?? "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close payments"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Total payments
              </div>
              <div className="text-lg font-bold text-blue-800">
                {totals.sum}
              </div>
            </div>
            <div className="text-xs text-gray-700 mt-1">
              Count: {totals.count}
            </div>
          </div>

          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((p, idx) => (
                <div
                  key={p.id || `${p.amount}-${p.created_at}-${idx}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Amount: {p.amount ?? "-"}
                      </div>
                      {p.purpose ? (
                        <div className="text-sm text-gray-700">
                          Purpose: {p.purpose}
                        </div>
                      ) : null}
                      {p.method ? (
                        <div className="text-sm text-gray-700">
                          Method: {p.method}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <div>Date: {formatDate(p.created_at || p.date)}</div>
                      {p.status ? <div>Status: {p.status}</div> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                No payments found for this student.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TotalPaidModule;
