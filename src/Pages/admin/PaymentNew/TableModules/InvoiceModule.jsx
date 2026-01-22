import React, { useMemo } from "react";

const monthKeyToNumber = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const monthNumberToLabel = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

const formatMoney = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString("en-US", { minimumFractionDigits: 0 });
};

const formatDate = (value) => {
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return "";
  const date = new Date(ts);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

function InvoiceModule({ open, onClose, student, monthKey }) {
  const monthNumber = monthKeyToNumber[monthKey];

  const billingsById = useMemo(() => {
    const map = new Map();
    if (Array.isArray(student?.billings)) {
      student.billings.forEach((b) => {
        if (b?.id) map.set(b.id, b);
      });
    }
    return map;
  }, [student]);

  const invoicesForMonth = useMemo(() => {
    if (!Array.isArray(student?.invoices) || !monthNumber) return [];
    return student.invoices
      .filter((inv) => inv?.month === monthNumber)
      .map((inv) => {
        const billing = billingsById.get(inv.billing_id);
        return {
          ...inv,
          code: billing?.code,
          billingName: billing?.description || billing?.code,
        };
      });
  }, [student, monthNumber, billingsById]);

  const paymentsForMonth = useMemo(() => {
    if (!Array.isArray(student?.payments) || !monthNumber) return [];
    return student.payments.filter((p) => {
      const ts = Date.parse(p?.created_at);
      if (Number.isNaN(ts)) return false;
      const d = new Date(ts);
      return d.getMonth() + 1 === monthNumber;
    });
  }, [student, monthNumber]);

  const totals = useMemo(() => {
    return invoicesForMonth.reduce(
      (acc, inv) => {
        acc.required += Number(inv?.total_required_amount) || 0;
        acc.paid += Number(inv?.total_paid_amount) || 0;
        const remainingRaw = inv?.remaining_amount;
        const remaining =
          remainingRaw === 0 || remainingRaw != null
            ? Number(remainingRaw)
            : Math.max(acc.required - acc.paid, 0);
        acc.remaining += Number.isFinite(remaining) ? remaining : 0;
        return acc;
      },
      { required: 0, paid: 0, remaining: 0 },
    );
  }, [invoicesForMonth]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Invoice history
            </p>
            <h2 className="text-lg font-semibold text-gray-900">
              {student?.full_name || "Student"} —{" "}
              {monthNumberToLabel[monthNumber] || monthKey}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Required</p>
              <p className="text-xl font-semibold text-slate-900">
                {formatMoney(totals.required)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Paid</p>
              <p className="text-xl font-semibold text-emerald-700">
                {formatMoney(totals.paid)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Remaining</p>
              <p className="text-xl font-semibold text-amber-700">
                {formatMoney(totals.remaining)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Invoices
                </h3>
              </div>
              {invoicesForMonth.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No invoices for this month.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {invoicesForMonth.map((inv) => (
                    <li
                      key={inv.id}
                      className="px-4 py-3 text-sm text-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {inv.billingName || inv.code || "Invoice"}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {inv.status}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-700">
                            Required
                          </p>
                          <p>{formatMoney(inv.total_required_amount)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Paid</p>
                          <p>{formatMoney(inv.total_paid_amount)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">
                            Remaining
                          </p>
                          <p>{formatMoney(inv.remaining_amount)}</p>
                        </div>
                      </div>
                      <p className="mt-1 text-md text-gray-600">
                        Discount: {inv.discount_percent ?? 0}%
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Created {formatDate(inv.created_at) || "–"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-100">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Payments / withdrawals
                </h3>
              </div>
              {paymentsForMonth.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No payments recorded in this month.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {paymentsForMonth.map((p) => (
                    <li key={p.id} className="px-4 py-3 text-sm text-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {formatMoney(p.amount)}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {p.method || ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Purpose: {p.purpose || "—"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatDate(p.created_at) || "–"}
                      </p>
                      {p.comment ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {p.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceModule;
