import React, { useState } from "react";
import TuitionPayments from "./TuitionPayments";
import { DormPayments } from "./DormPayments";
import { OtherPayments } from "./OtherPayments";
import useStudentPayments from "./hooks/useStudentPaymentsContext";

export const Payments = () => {
  const [tab, setTab] = useState("tuition");

  const {
    students,
    dormStudents,
    months,
    billings,
    meta,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    recordPayment,
    query,
    setQuery,
    dormQuery,
    setDormQuery,
  } = useStudentPayments();

  const totalLoaded = students.length;
  const dormLoaded = dormStudents.length;

  return (
    <div className="min-h-screen">
      <div className="p-2 h-full">
        <div className="flex items-center justify-center gap-10 mb-">
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "tuition"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-indigo-600 text-indigo-600"
            }`}
            onClick={() => setTab("tuition")}
          >
            Tuition
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "dorm"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-indigo-600 text-indigo-600"
            }`}
            onClick={() => setTab("dorm")}
          >
            Dorm
          </button>
          {/* <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "other"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-indigo-600 text-indigo-600"
            }`}
            onClick={() => setTab("other")}
          >
            Other
          </button> */}
        </div>

        <div>
          {tab === "tuition" && (
            <TuitionPayments
              students={students}
              months={months}
              billings={billings}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={totalLoaded}
              hasMore={hasMore}
              onRefresh={refresh}
              onLoadMore={loadMore}
              recordPayment={recordPayment}
              searchQuery={query}
              onSearchChange={setQuery}
            />
          )}
          {tab === "dorm" && (
            <DormPayments
              students={dormStudents}
              months={months}
              billings={billings}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={dormLoaded}
              hasMore={hasMore}
              onRefresh={refresh}
              onLoadMore={loadMore}
              recordPayment={recordPayment}
              searchQuery={dormQuery}
              onSearchChange={setDormQuery}
            />
          )}
          {tab === "other" && (
            <OtherPayments
              students={students}
              months={months}
              billings={billings}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={totalLoaded}
              hasMore={hasMore}
              onRefresh={refresh}
              onLoadMore={loadMore}
              recordPayment={recordPayment}
            />
          )}
        </div>
      </div>
    </div>
  );
};
