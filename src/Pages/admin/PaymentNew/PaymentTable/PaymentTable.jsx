import React, { useEffect, useRef, useState } from "react";
import TableRow from "../TableRow/TableRow";
import { useGlobalContext } from "../../../../Hooks/UseContext";
import PaymentModule from "../CreatePaymentModule/PaymentModule";
import { monthsOptions } from "../Filters/MonthsToFilter";

const months = [
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
];

function PaymentTable({ visibleMonths, filteredStudents }) {
  const {
    students,
    dormStudents,
    loading,
    loadingMore,
    loadingDorm,
    loadingMoreDorm,
    error,
    errorDorm,
    selectedPurpose,
    loadMore,
    loadMoreDorm,
    hasMore,
    hasMoreDorm,
    refetch,
    refetchDorm,
    meta,
    metaDorm,
  } = useGlobalContext();

  const sentinelRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const isDorm = selectedPurpose === "dorm";
  // Use filtered list if provided, otherwise fallback to full list
  const activeList = filteredStudents ?? (isDorm ? dormStudents : students);
  const activeError = isDorm ? errorDorm : error;
  const activeLoading = isDorm ? loadingDorm : loading;
  const activeLoadingMore = isDorm ? loadingMoreDorm : loadingMore;
  const activeHasMore = isDorm ? hasMoreDorm : hasMore;
  const activeLoadMore = isDorm ? loadMoreDorm : loadMore;
  const activeTotal = isDorm
    ? metaDorm?.total ?? activeList.length
    : meta?.total ?? activeList.length;
  const showDiscounts = selectedPurpose === "tuition";
  const monthsToShow = (
    visibleMonths?.length
      ? monthsOptions.filter((m) => visibleMonths.includes(m.key))
      : monthsOptions
  ).filter(Boolean);

  const handleAddPayment = (student) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (isDorm) {
      await refetchDorm?.();
    } else {
      await refetch?.();
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedStudent(null);
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (activeLoading || activeLoadingMore || !activeHasMore) return;
        activeLoadMore && activeLoadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activeHasMore, activeLoadMore, activeLoading, activeLoadingMore]);

  return (
    <div className="overflow-x-auto bg-white shadow-sm">
      {activeLoading && activeList.length === 0 ? (
        <div className="p-4 text-sm text-gray-600">Loading students…</div>
      ) : activeError ? (
        <div className="p-4 text-sm text-red-600">{activeError}</div>
      ) : (
        <table className="min-w-[1100px] w-full text-sm text-gray-800 border-t">
          <thead className="text-xs uppercase tracking-wide  text-gray-600">
            <tr className="">
              <th className="sticky left-0 z-10 w-16 min-w-16 max-w-16 border-b px-3 py-3 text-left bg-white">
                ID
              </th>
              <th className="sticky left-16 z-10 w-56 min-w-56 max-w-56 border-b px-3 py-3 text-left bg-white">
                Full name
              </th>
              <th className="px-3 py-3 border text-left w-24 min-w-24 max-w-24">
                Grade
              </th>
              <th className="px-3 py-3 border text-left w-32 min-w-32 max-w-32">
                Tutor
              </th>
              {showDiscounts ? (
                <th className="px-3 py-3 border text-left w-18 min-w-18 max-w-18">
                  Dis.
                </th>
              ) : null}
              {monthsToShow.map((month) => (
                <th key={month.key} className="px-3 py-3 border text-right">
                  {month.label}
                </th>
              ))}
              <th className="px-3 py-3 border text-center w-18 min-w-18 max-w-18">
                Wallet
              </th>
              <th className="px-3 py-3 border text-center">Add</th>
            </tr>
          </thead>
          <tbody>
            {activeList.map((student, index) => (
              <TableRow
                key={`${student.id}-${index}`}
                student={student}
                months={monthsToShow}
                showDiscounts={showDiscounts}
                onAddPayment={handleAddPayment}
              />
            ))}
          </tbody>
        </table>
      )}
      <div
        ref={sentinelRef}
        className="h-10 flex items-center justify-center text-sm text-gray-600"
      >
        {activeLoadingMore ? "Loading more students…" : null}
        {!activeHasMore && !activeLoadingMore && activeList.length > 0
          ? "End of list"
          : null}
      </div>

      {showPaymentModal && selectedStudent ? (
        <PaymentModule
          open={showPaymentModal}
          onClose={handleCloseModal}
          student={selectedStudent}
          purposeDefault={selectedPurpose}
          onSuccess={handlePaymentSuccess}
        />
      ) : null}
    </div>
  );
}

export default PaymentTable;
