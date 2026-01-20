import React, { useMemo } from "react";

function DiscountModule({ isOpen, onClose, discounts = [], studentName }) {
  const { active, expired } = useMemo(() => {
    const nowTs = Date.now();

    const parseDate = (value) => {
      const ts = value ? Date.parse(value) : NaN;
      return Number.isNaN(ts) ? null : ts;
    };

    const isActive = (item) => {
      const startTs = parseDate(item?.start_date);
      const endTs = parseDate(item?.end_date);

      if (startTs && nowTs < startTs) return false;
      if (endTs && nowTs > endTs) return false;
      return true;
    };

    const activeList = (discounts || []).filter(isActive);
    const expiredList = (discounts || []).filter((d) => !isActive(d));

    return { active: activeList, expired: expiredList };
  }, [discounts]);

  const formatDate = (value) => {
    const ts = value ? Date.parse(value) : NaN;
    if (Number.isNaN(ts)) return "-";
    return new Date(ts).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 p-6 z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Discount details
            </h2>
            <p className="text-base font-semibold text-gray-700 mt-1">
              {studentName ? `Student: ${studentName}` : "Discount info"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close discount details"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {active.length > 0 ? (
            <div className="space-y-3">
              {active.map((d) => (
                <div
                  key={d.id || `${d.name}-${d.start_date}-${d.end_date}`}
                  className="rounded-lg border border-green-100 bg-green-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {d.name || "Discount"}
                    </div>
                    <span className="text-lg text-green-700 font-semibold">
                      {Number.isFinite(d?.percent) ? `${d.percent}%` : ""}
                    </span>
                  </div>
                  {d.reason ? (
                    <p className="text-sm text-gray-700 mt-1">
                      Reason: {d.reason}
                    </p>
                  ) : null}
                  <div className="text-sm text-gray-700 mt-2 flex gap-4">
                    <span>Start: {formatDate(d.start_date)}</span>
                    <span>End: {formatDate(d.end_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              No active discounts for this student.
            </div>
          )}

          {expired.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">
                Expired or inactive
              </div>
              {expired.map((d) => (
                <div
                  key={`expired-${
                    d.id || `${d.name}-${d.start_date}-${d.end_date}`
                  }`}
                  className="rounded-lg border border-red-100 bg-red-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">
                      {d.name || "Discount"}
                    </div>
                    <span className="text-lg text-gray-600 font-semibold">
                      {Number.isFinite(d?.percent) ? `${d.percent}%` : ""}
                    </span>
                  </div>
                  {d.reason ? (
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {d.reason}
                    </p>
                  ) : null}
                  <div className="text-sm text-gray-700 mt-2 flex gap-4">
                    <span>Start: {formatDate(d.start_date)}</span>
                    <span>End: {formatDate(d.end_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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

export default DiscountModule;
