import React, { useMemo, useState } from "react";
import { endpoints } from "../../../../Library/Endpoints";
import { api } from "../../../../Library/RequestMaker";
import toast from "react-hot-toast";

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
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-US");
};

const formatDate = (value) => {
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return "";
  const date = new Date(ts);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function InvoiceModule({
  open,
  onClose,
  student,
  monthKey,
  onInvoicesUpdated,
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedRequired, setEditedRequired] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const monthNumber = monthKeyToNumber[monthKey];

  // --- Logic Memos (Keeping your variable names) ---
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

  // --- Handlers ---
  const handleEditInvoices = () => {
    const initial = {};
    invoicesForMonth.forEach((inv) => {
      initial[inv.id] = inv.total_required_amount;
    });
    setEditedRequired(initial);
    setEditMode(true);
  };

  const handleRequiredChange = (id, value) => {
    if (/^\d*$/.test(value)) {
      setEditedRequired((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSaveInvoices = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updatePromises = Object.entries(editedRequired).map(
        async ([id, value]) => {
          const orig = invoicesForMonth.find((inv) => inv.id === Number(id));
          if (!orig || String(orig.total_required_amount) === String(value))
            return null;
          const url = `${endpoints.UPDATE_INVOICE}/${id}`;
          return api.patch(url, { subtotal_required_amount: Number(value) });
        },
      );
      await Promise.all(updatePromises);
      toast.success("Invoices updated successfully");
      setEditMode(false);
      setEditedRequired({});
      if (typeof onInvoicesUpdated === "function") {
        try {
          setIsRefreshing(true);
          await onInvoicesUpdated();
        } finally {
          setIsRefreshing(false);
        }
      }
    } catch (err) {
      toast.error("Failed to update invoices");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => setEditMode(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="flex w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">
              Records
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              {student?.full_name || "Student"}
              <span className="mx-2 text-slate-300">—</span>
              <span className="text-slate-600 font-medium">
                {monthNumberToLabel[monthNumber] || monthKey}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 bg-slate-50/30">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <SummaryCard
              label="Required"
              value={totals.required}
              accent="slate"
            />
            <SummaryCard label="Paid" value={totals.paid} accent="emerald" />
            <SummaryCard
              label="Remaining"
              value={totals.remaining}
              accent="amber"
              highlight
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* INVOICES SECTION */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Invoices
                </h3>
                <div className="flex gap-2">
                  <div
                    className={editMode ? "flex gap-2" : "hidden"}
                    aria-hidden={!editMode}
                  >
                    <button
                      onClick={handleSaveInvoices}
                      disabled={isSaving || isRefreshing}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isSaving || isRefreshing
                          ? "bg-emerald-300 text-white cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="4"
                            />
                            <path
                              d="M22 12a10 10 0 00-10-10"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                          </svg>
                          Saving...
                        </span>
                      ) : isRefreshing ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3 animate-spin text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="4"
                            />
                            <path
                              d="M22 12a10 10 0 00-10-10"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                          </svg>
                          Refreshing...
                        </span>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-[11px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>

                  <div
                    className={editMode ? "hidden" : ""}
                    aria-hidden={editMode}
                  >
                    <button
                      onClick={handleEditInvoices}
                      className="text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
                    >
                      Edit Invoices
                    </button>
                  </div>
                </div>
              </div>

              {invoicesForMonth.length === 0 ? (
                <EmptyState text="No invoices for this month." />
              ) : (
                <div className="divide-y divide-slate-50">
                  {invoicesForMonth.map((inv) => (
                    <div key={inv.id} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-none mb-1">
                            {inv.billingName || "Tuition fee"}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase">
                            ID: {inv.id}
                          </p>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                            Required
                          </label>
                          {editMode ? (
                            <input
                              type="text"
                              className="w-full rounded-md border border-slate-200 bg-green-100 px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              value={editedRequired[inv.id] ?? ""}
                              onChange={(e) =>
                                handleRequiredChange(inv.id, e.target.value)
                              }
                            />
                          ) : (
                            <input
                              type="text"
                              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              value={formatMoney(inv.total_required_amount)}
                              disabled
                            />
                          )}
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                            Paid
                          </label>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatMoney(inv.total_paid_amount)}
                          </p>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                            Remaining
                          </label>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatMoney(inv.remaining_amount)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                        <p className="text-[11px] text-slate-400 italic">
                          Discount: {inv.discount_percent ?? 0}%
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Issued {formatDate(inv.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAYMENTS SECTION */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="border-b border-slate-50 bg-slate-50/50 px-5 py-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Payments / Withdrawals
                </h3>
              </div>
              {paymentsForMonth.length === 0 ? (
                <EmptyState text="No payments recorded in this month." />
              ) : (
                <div className="divide-y divide-slate-50">
                  {paymentsForMonth.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          {formatMoney(p.amount)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tighter">
                          {p.method}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2 font-medium">
                        Purpose: {p.purpose || "—"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          {formatDate(p.created_at)}
                        </span>
                        {p.comment && (
                          <span
                            title={p.comment}
                            className="cursor-help text-indigo-400"
                          >
                            ●
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner structure
const SummaryCard = ({ label, value, accent, highlight }) => {
  const styles = {
    slate: "border-slate-200 text-slate-900",
    emerald: "border-emerald-100 text-emerald-700 bg-emerald-50/30",
    amber: "border-amber-100 text-amber-700 bg-amber-50/30",
  };
  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm bg-white ${styles[accent]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
        {label}
      </p>
      <p className={`text-2xl ${highlight ? "font-black" : "font-bold"}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const isPaid = status?.toLowerCase() === "paid";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        isPaid
          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
          : "bg-slate-100 border-slate-200 text-slate-500"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

const EmptyState = ({ text }) => (
  <div className="px-5 py-12 text-center">
    <p className="text-sm text-slate-400 font-medium">{text}</p>
  </div>
);

export default InvoiceModule;
