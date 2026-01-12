import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";
import toast from "react-hot-toast";

function PaymentModule({ open, onClose, student, purposeDefault, onSuccess }) {
  const [purpose, setPurpose] = useState(purposeDefault || "");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [comment, setComment] = useState("");
  const [isRefund, setIsRefund] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const studentName = useMemo(
    () => student?.fullName || student?.full_name || "Unknown student",
    [student]
  );

  const discountInfo = useMemo(() => {
    const list = Array.isArray(student?.discounts) ? student.discounts : [];
    const percents = list
      .map((d) => (Number.isFinite(d?.percent) ? Number(d.percent) : null))
      .filter((v) => v !== null);
    const totalPercent = percents.reduce((acc, val) => acc + val, 0);
    if (totalPercent > 0) return `${totalPercent}% discount`;
    return "No discount";
  }, [student]);

  useEffect(() => {
    if (!open) return;
    setPurpose(purposeDefault || "");
    setAmount(0);
    setMethod("cash");
    setComment("");
    setIsRefund(false);
  }, [open, purposeDefault]);

  if (!open || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      toast.error("Amount must be a number");
      return;
    }

    if (numericAmount > 50000 || numericAmount < -50000) {
      toast.error("Amount must be between -50000 and 50000");
      return;
    }

    if (!purpose?.trim()) {
      toast.error("Purpose is required");
      return;
    }

    if (!method?.trim()) {
      toast.error("Method is required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(endpoints.CREATE_PAYMENT, {
        student_group_id: student.student_group_id,
        purpose: purpose.trim(),
        amount: numericAmount,
        method: method.trim(),
        comment: comment?.trim() || undefined,
        is_refund: Boolean(isRefund),
      });

      toast.success("Payment created");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create payment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create payment
            </h2>
            <p className="text-sm text-gray-600">{studentName}</p>
            <p className="text-xs text-gray-500">
              Student group ID: {student.student_group_id}
            </p>
            <p className="text-xs font-medium text-gray-700 mt-1">
              {discountInfo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700"
            aria-label="Close payment modal"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="tuition / dorm / exam"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                step="1"
                min="-50000"
                max="50000"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Allowed range: -50000 to 50000
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isRefund"
              type="checkbox"
              checked={isRefund}
              onChange={(e) => setIsRefund(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isRefund" className="text-sm text-gray-700">
              Is refund?
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="Optional note"
            />
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
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentModule;
