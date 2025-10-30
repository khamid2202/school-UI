// src/Components/PaymentPage/Payments.jsx
import React, { useState, useMemo, useCallback } from "react";

import PaymentsTable from "./PaymentsTable";

const BASE_TUITION = 2600;

export default function TuitionPayments({
  students,
  setStudents,
  months,
  loading,
  loadingMore,
  error,
  meta,
  totalLoaded,
  hasMore,
  onRefresh,
  onLoadMore,
}) {
  const [search, setSearch] = useState("");

  const monthItems = useMemo(() => {
    if (!Array.isArray(months)) return [];
    return months.map((month) => ({
      key: month.key ?? month.label ?? String(month),
      label: month.label ?? month.key ?? String(month),
      month: month.month ?? null,
      year: month.year ?? null,
    }));
  }, [months]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const studentName = (
        student.full_name ||
        student.name ||
        ""
      ).toLowerCase();
      return (
        studentName.includes(q) || String(student.id).toLowerCase().includes(q)
      );
    });
  }, [students, search]);

  const calculateMonthlyFee = useCallback(
    (student) => {
      if (!student) return BASE_TUITION;
      const payments = student.payments || {};

      for (const month of monthItems) {
        const entry = payments[month.key];
        if (
          entry &&
          entry.total_required_amount !== undefined &&
          entry.total_required_amount !== null
        ) {
          return Number(entry.total_required_amount);
        }
      }

      const fallback = Object.values(payments).find(
        (entry) =>
          entry &&
          entry.total_required_amount !== undefined &&
          entry.total_required_amount !== null
      );

      if (fallback) {
        return Number(fallback.total_required_amount);
      }

      return BASE_TUITION;
    },
    [monthItems]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <div className="w-full md:w-1/3 text-sm text-gray-500">
              <span>
                Showing {filteredStudents.length} of{" "}
                {meta?.total ?? totalLoaded} students
              </span>
            </div>

            <div className="w-full md:w-1/3 text-center">
              <h1 className="text-2xl font-bold">Tuition Payments</h1>
              {meta?.academic_year && (
                <p className="text-sm text-gray-500">{meta.academic_year}</p>
              )}
            </div>

            <div className="w-full md:w-1/3 flex justify-end items-center gap-2">
              {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  className="px-3 py-2 rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              )}
              <input
                type="text"
                placeholder="Search by ID or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-2 rounded w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <PaymentsTable
          studentData={filteredStudents}
          setStudentData={setStudents}
          months={monthItems}
          calculateMonthlyFee={calculateMonthlyFee}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          paymentPurposePrefix="tuition"
        />
      </div>
    </div>
  );
}
