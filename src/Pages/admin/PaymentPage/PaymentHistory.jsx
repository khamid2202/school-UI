import React, { useMemo } from "react";
import { User } from "lucide-react";

const formatAmountDisplay = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toLocaleString("en-US");
};

const formatHistoryDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const useHistoryEntries = (student) =>
  useMemo(() => {
    if (!student) {
      return [];
    }

    const rawEntries = Array.isArray(student.payment_history)
      ? student.payment_history
      : [];

    return rawEntries
      .map((payment, index) => {
        return {
          id:
            payment.id ||
            payment.payment_id ||
            payment.uuid ||
            `${student.id ?? student.student_id ?? "student"}-${index}`,
          purpose: payment.purpose || payment.description || "General payment",
          amount:
            payment.amount ??
            payment.amount_paid ??
            payment.total_paid ??
            payment.total_required_amount ??
            payment.required_amount ??
            null,
          resolvedAmount: payment.resolved_amount ?? null,
          method: payment.method || payment.payment_method || "—",
          comment: payment.comment || "",
          createdBy: payment.created_by || payment.author || "—",
          isRefund: Boolean(payment.is_refund),
          date:
            payment.created_at ||
            payment.date ||
            payment.payment_date ||
            payment.paid_at ||
            payment.updated_at ||
            null,
        };
      })
      .sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });
  }, [student]);

const PaymentHistory = ({ open, student, onClose }) => {
  const entries = useHistoryEntries(student);

  if (!open || !student) {
    return null;
  }

  //   console.log("Entries:", entries);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment history
          </h2>
          <p className="text-sm text-gray-500">
            {student?.full_name || student?.name || "Unnamed student"}
          </p>
        </div>
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {entries.length ? (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  entry.isRefund
                    ? "border-red-100 bg-red-50/80"
                    : "border-emerald-100 bg-emerald-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span
                      className={`flex size-8 items-center justify-center rounded-full bg-white/80 ${
                        entry.isRefund ? "text-red-500" : "text-emerald-600"
                      }`}
                    >
                      {entry.isRefund ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <p>{entry.purpose}</p>
                      <p className="text-xs font-normal text-gray-500">
                        {entry.isRefund ? "Refund" : "Payment"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-base font-semibold ${
                      entry.isRefund ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {entry.isRefund ? "-" : "+"}
                    {formatAmountDisplay(Math.abs(Number(entry.amount) || 0))}
                    <span className="ml-1 text-xs font-medium uppercase text-gray-500">
                      uzs
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    {/* <span className="text-base">📅</span> */}
                    <div>
                      {/* <p className="text-xs uppercase text-gray-500">Date</p> */}
                      <p className="font-medium">
                        {entry.date
                          ? formatHistoryDate(entry.date) || entry.date
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="">
                      <User />
                    </span>
                    <div className="">
                      <p className="text-xs uppercase text-gray-500">
                        Receiver
                      </p>
                      <p className="font-medium">{entry.createdBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-base">💳</span>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Method</p>
                      <p className="font-medium">{entry.method}</p>
                    </div>
                  </div>
                </div>
                {entry.comment && (
                  <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-gray-600">
                    <span className="text-xs uppercase text-gray-400">
                      Note
                    </span>
                    <p className="font-medium text-gray-700">{entry.comment}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No payment history recorded for this student.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
