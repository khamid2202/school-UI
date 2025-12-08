import React, { useState, useMemo } from "react";

import PaymentsTable from "./PaymentsTable";

export const OtherPayments = ({
  students,
  months,
  billings,
  loading,
  loadingMore,
  error,
  meta,
  totalLoaded,
  onRefresh,
  hasMore,
  onLoadMore,
  recordPayment,
}) => {
  const [search, setSearch] = useState("");

  const monthItems = useMemo(() => {
    if (!Array.isArray(months)) return [];
    return months.map((month) => ({
      key: month.key ?? month.label ?? String(month),
      label: month.label ?? month.key ?? String(month),
      monthNumber:
        month.monthNumber ?? month.month ?? month.month_index ?? null,
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
              <h1 className="text-2xl font-bold">Other Payments</h1>
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
          students={filteredStudents}
          months={monthItems}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          recordPayment={recordPayment}
        />
      </div>
    </div>
  );
};
