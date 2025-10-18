import React, { useState, useMemo, useRef, useEffect } from "react";

const normalizeMonths = (months) => {
  if (!Array.isArray(months)) return [];
  return months.map((month) => {
    if (typeof month === "string") {
      return { key: month, label: month, month: null, year: null };
    }

    const monthValue =
      typeof month.month === "number"
        ? month.month
        : typeof month.month === "string"
        ? Number(month.month)
        : null;

    const yearValue =
      typeof month.year === "number"
        ? month.year
        : typeof month.year === "string"
        ? Number(month.year)
        : null;

    return {
      key: month.key ?? month.label ?? String(month),
      label: month.label ?? month.key ?? String(month),
      month: Number.isNaN(monthValue) ? null : monthValue,
      year: Number.isNaN(yearValue) ? null : yearValue,
    };
  });
};

const getPaymentPresentation = (payment) => {
  if (!payment) {
    return { label: "No Data", isPaid: false, remaining: null, required: null };
  }

  const normalizedStatus = payment.status
    ? String(payment.status).toLowerCase()
    : "";

  const remaining = payment.remaining_amount ?? payment.remaining;
  const totalRequired = payment.total_required_amount ?? payment.required;
  const totalPaid = payment.total_paid_amount ?? payment.paid;

  const numericRemaining = Number(remaining);
  const numericRequired = Number(totalRequired);
  const numericPaid = Number(totalPaid);

  const paidByStatus = ["paid", "complete", "completed"].includes(
    normalizedStatus
  );
  const paidByAmounts =
    (!Number.isNaN(numericRemaining) && numericRemaining <= 0) ||
    (!Number.isNaN(numericRequired) &&
      !Number.isNaN(numericPaid) &&
      numericPaid >= numericRequired);

  const isPaid = paidByStatus || paidByAmounts;
  const label = payment.status || (isPaid ? "Paid" : "Unpaid");

  return {
    label,
    isPaid,
    remaining: Number.isNaN(numericRemaining) ? null : numericRemaining,
    required: Number.isNaN(numericRequired) ? null : numericRequired,
  };
};

export default function PaymentsTable({
  studentData,
  setStudentData,
  months,
  calculateMonthlyFee,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
}) {
  const [amounts, setAmounts] = useState({});

  const monthItems = useMemo(() => normalizeMonths(months), [months]);
  const students = Array.isArray(studentData) ? studentData : [];
  const sentinelRef = useRef(null);

  const formatWallet = (value, currency) => {
    if (value === null || value === undefined) return "—";
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "—";

    if (currency) {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(numeric);
      } catch (error) {
        // Fallback to plain number if currency code is invalid
      }
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numeric);
  };

  const handleInputChange = (id, value) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = (id) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;

    const entered = Number(amounts[id]);
    const expected = Number(calculateMonthlyFee(student));

    if (Number.isNaN(entered)) {
      setAmounts((prev) => ({ ...prev, [id]: "" }));
      return;
    }

    const tolerance = Math.abs((entered || 0) - (expected || 0));

    if (tolerance <= 0.01 && monthItems.length) {
      const now = new Date();
      const currentMonthName = now.toLocaleString("en-US", { month: "long" });
      const currentYear = now.getFullYear();

      const monthToMark =
        monthItems.find((item) => {
          if (item.month && item.year) {
            return (
              item.month === now.getMonth() + 1 && item.year === currentYear
            );
          }

          return item.label
            .toLowerCase()
            .includes(currentMonthName.toLowerCase());
        }) || monthItems[0];

      if (monthToMark) {
        setStudentData((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((s) => {
            if (s.id !== id) return s;
            const existingPayments = s.payments || {};
            const previousPayment = existingPayments[monthToMark.key] || {};
            const requiredAmount =
              previousPayment.total_required_amount ?? expected;

            return {
              ...s,
              payments: {
                ...existingPayments,
                [monthToMark.key]: {
                  ...previousPayment,
                  key: monthToMark.key,
                  label: monthToMark.label,
                  status: "Paid",
                  total_required_amount: requiredAmount,
                  total_paid_amount: entered,
                  remaining_amount: 0,
                },
              },
            };
          });
        });
      }
    }

    setAmounts((prev) => ({ ...prev, [id]: "" }));
  };

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [hasMore, onLoadMore, loadingMore, loading, students.length]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-10 text-gray-500">
        Loading payments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-10 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table (hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Full Name</th>
              <th className="border px-2 py-1">Class</th>
              <th className="border px-2 py-1">Wallet</th>
              {monthItems.map((month) => (
                <th key={month.key} className="border px-2 py-1">
                  {month.label}
                </th>
              ))}
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={monthItems.length + 6}
                  className="text-center p-4 text-gray-500"
                >
                  No students found.
                </td>
              </tr>
            )}

            {students.map((student) => (
              <tr
                key={student.id ?? student.student_id}
                className="text-center"
              >
                <td className="border px-2 py-1">{student.id}</td>
                <td className="border px-2 py-1 text-left pl-4">
                  {student.full_name || student.name || "—"}
                </td>
                <td className="border px-2 py-1">
                  {student.class_pair ||
                    student.group?.class_pair ||
                    student.group?.class_pair_compact ||
                    ""}
                </td>
                <td className="border px-2 py-1 text-right">
                  {formatWallet(student.wallet.uzs, student.wallet_currency)}
                </td>

                {monthItems.map((month) => {
                  const payment = student.payments?.[month.key];
                  const presentation = getPaymentPresentation(payment);

                  return (
                    <td
                      key={month.key}
                      className={`border px-2 py-1 ${
                        presentation.isPaid ? "bg-green-200" : "bg-red-200"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-medium">
                          {presentation.label}
                        </span>
                        {presentation.remaining !== null && (
                          <span className="text-xs text-gray-700">
                            {presentation.remaining === 0
                              ? "Paid in full"
                              : `Remaining: ${presentation.remaining}`}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td className="border px-2 py-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`${calculateMonthlyFee(student)}`}
                    value={amounts[student.id] || ""}
                    onChange={(e) =>
                      handleInputChange(student.id, e.target.value)
                    }
                    className="border p-1 w-28 rounded"
                  />
                </td>

                <td className="border px-2 py-1">
                  <button
                    onClick={() => handleSave(student.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list (visible on small screens) */}
      <div className="md:hidden space-y-4">
        {students.length === 0 && (
          <div className="text-center p-4 text-gray-500">
            No students found.
          </div>
        )}

        {students.map((student) => (
          <div
            key={student.id ?? student.student_id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">ID: {student.id}</div>
                <div className="text-lg font-semibold">
                  {student.full_name || student.name || "—"}
                </div>
                <div className="text-sm text-gray-500">
                  {student.class_pair ||
                    student.group?.class_pair ||
                    student.group?.class_pair_compact ||
                    ""}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Wallet:{" "}
                  {formatWallet(
                    student.wallet_balance,
                    student.wallet_currency
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Amount</div>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`${calculateMonthlyFee(student)}`}
                    value={amounts[student.id] || ""}
                    onChange={(e) =>
                      handleInputChange(student.id, e.target.value)
                    }
                    className="border p-1 w-28 rounded"
                  />
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleSave(student.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {monthItems.map((month) => {
                const payment = student.payments?.[month.key];
                const presentation = getPaymentPresentation(payment);
                return (
                  <div
                    key={month.key}
                    className={`px-2 py-1 text-xs rounded-full ${
                      presentation.isPaid
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {month.label.slice(0, 3)}: {presentation.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div ref={sentinelRef} />

      {hasMore && (
        <div className="py-4 text-center text-gray-500">
          {loadingMore ? "Loading more students..." : "Scroll to load more"}
        </div>
      )}

      {!hasMore && students.length > 0 && (
        <div className="py-4 text-center text-gray-400">
          You've reached the end.
        </div>
      )}
    </div>
  );
}
