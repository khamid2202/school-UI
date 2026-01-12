import React, { useMemo, useState } from "react";
import PaymentTable from "../PaymentTable/PaymentTable";
import MonthsToFilter, { monthsOptions } from "../Filters/MonthsToFilter";
import PaymentPurpose from "../Filters/PaymentPurpose";
import { useGlobalContext } from "../../../../Hooks/UseContext";

function PaymentsPage() {
  const allMonthKeys = useMemo(() => monthsOptions.map((m) => m.key), []);
  const [selectedMonths, setSelectedMonths] = useState(allMonthKeys);
  const {
    searchTerm,
    setSearchTerm,
    selectedPurpose,
    students,
    dormStudents,
    meta,
    metaDorm,
  } = useGlobalContext();

  const isDorm = selectedPurpose === "dorm";
  const activeList = isDorm ? dormStudents : students;
  const activeTotal = isDorm
    ? metaDorm?.total ?? activeList.length
    : meta?.total ?? activeList.length;

  const toggleMonth = (key) => {
    setSelectedMonths((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 flex flex-col gap-2 overflow-hidden">
      <div className="shrink-0 rounded-2xl bg-white pb-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.2)] border border-slate-100/80 mx-4 mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4">
          <PaymentPurpose />
          <div className="w-full sm:w-auto">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by full name"
              className="w-full sm:w-80 rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mb-2 px-4 pb-1">
          <MonthsToFilter
            selectedMonths={selectedMonths}
            onToggle={toggleMonth}
          />
          <p className="mt-2 text-xs text-gray-500">
            Showing {activeList.length} students of {activeTotal}
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
        <PaymentTable visibleMonths={selectedMonths} />
      </div>
    </div>
  );
}

export default PaymentsPage;
