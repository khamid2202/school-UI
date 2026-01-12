// src/Components/PaymentPage/Payments.jsx
import React, { useEffect, useMemo, useState } from "react";

import PaymentsTable from "./PaymentsTable";

export default function TuitionPayments({
  students,
  months,
  billings,
  loading,
  loadingMore,
  error,
  meta,
  totalLoaded,
  hasMore,
  onRefresh,
  onLoadMore,
  recordPayment,
  searchQuery = "",
  onSearchChange,
}) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!onSearchChange) return;

    const handler = setTimeout(() => {
      if (searchInput === searchQuery) return;
      onSearchChange(searchInput);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, searchQuery, onSearchChange]);

  //seperate the tuition billings and save to another variable
  const tuitionBillings = useMemo(() => {
    if (!Array.isArray(billings)) return [];
    return billings.filter(
      (billing) => billing.code && billing.code.startsWith("tuition")
    );
  }, [billings]);

  //payment purpose is billing.code
  const tuitionPaymentPurposes = useMemo(() => {
    if (!Array.isArray(tuitionBillings)) return [];
    return tuitionBillings.map((billing) => billing.code);
  }, [tuitionBillings]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <div className="w-full md:w-1/3" />

            <div className="w-full md:w-1/3 text-center">
              <h1 className="text-2xl font-bold">Tuition Payments</h1>
              {meta?.academic_year && (
                <p className="text-sm text-gray-500">
                  {typeof meta.academic_year === "string"
                    ? meta.academic_year
                    : meta?.academic_year?.name || ""}
                </p>
              )}
            </div>

            <div className="w-full md:w-1/3 flex justify-end items-center gap-2">
              {/* {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  className="px-3 py-2 rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              )} */}
              <input
                type="text"
                placeholder="Search by ID or name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border px-3 py-2 rounded w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <PaymentsTable
          students={students}
          months={monthItems}
          billings={tuitionBillings}
          paymentPurposes={tuitionPaymentPurposes}
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
}
