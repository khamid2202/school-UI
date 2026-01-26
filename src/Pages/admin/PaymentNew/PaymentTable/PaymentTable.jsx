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
    loading,
    loadingMore,
    dormStudents,
    loadingDorm,
    loadingMoreDorm,
    courseStudents,
    loadingCourse,
    loadingMoreCourse,
    error,
    errorDorm,
    errorCourse,
    selectedPurpose,
    loadMore,
    loadMoreDorm,
    loadMoreCourse,
    hasMore,
    hasMoreDorm,
    hasMoreCourse,
    refetch,
    refetchDorm,
    refetchCourse,
    meta,
    metaDorm,
    metaCourse,
  } = useGlobalContext();

  const sentinelRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const isDorm = selectedPurpose === "dorm";
  const isCourse = selectedPurpose === "course";

  // Use filtered list if provided, otherwise fallback to purpose-specific list
  const activeList = filteredStudents
    ? filteredStudents
    : isDorm
      ? dormStudents
      : isCourse
        ? courseStudents
        : students;

  const activeError = isDorm ? errorDorm : isCourse ? errorCourse : error;
  const activeLoading = isDorm
    ? loadingDorm
    : isCourse
      ? loadingCourse
      : loading;
  const activeLoadingMore = isDorm
    ? loadingMoreDorm
    : isCourse
      ? loadingMoreCourse
      : loadingMore;
  const activeHasMore = isDorm
    ? hasMoreDorm
    : isCourse
      ? hasMoreCourse
      : hasMore;
  const activeLoadMore = isDorm
    ? loadMoreDorm
    : isCourse
      ? loadMoreCourse
      : loadMore;
  const activeTotal = isDorm
    ? (metaDorm?.total ?? activeList.length)
    : isCourse
      ? (metaCourse?.total ?? activeList.length)
      : (meta?.total ?? activeList.length);
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
    } else if (isCourse) {
      await refetchCourse?.();
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
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activeHasMore, activeLoadMore, activeLoading, activeLoadingMore]);

  const colCount = 6 + monthsToShow.length + (showDiscounts ? 1 : 0);

  return (
    <div className="relative overflow-x-auto bg-white shadow-sm">
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
                <th key={month.key} className="px-3 py-3 border text-center">
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
                onStudentsRefresh={async () => {
                  if (isDorm) {
                    await refetchDorm?.();
                  } else if (isCourse) {
                    await refetchCourse?.();
                  } else {
                    await refetch?.();
                  }
                }}
              />
            ))}
          </tbody>
        </table>
      )}
      <div
        ref={sentinelRef}
        className="h-10 flex items-center justify-center text-sm text-gray-600"
      >
        {!activeHasMore && !activeLoadingMore && activeList.length > 0
          ? "End of list"
          : null}
      </div>

      {activeLoadingMore ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 ">
          <div
            className="grid gap-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100 shadow-sm p-3"
            style={{
              gridTemplateColumns: `repeat(${colCount}, minmax(80px,1fr))`,
            }}
            aria-label="Loading more students"
          >
            {Array.from({ length: colCount }).map((_, idx) => (
              <div
                key={idx}
                className="h-3 rounded bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : null}

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
