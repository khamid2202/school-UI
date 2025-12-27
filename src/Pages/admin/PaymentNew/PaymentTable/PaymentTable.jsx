import React, { useEffect, useRef } from "react";
import TableRow from "../TableRow/TableRow";
import { useGlobalContext } from "../../../../Hooks/UseContext";

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

function PaymentTable() {
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
  } = useGlobalContext();

  const sentinelRef = useRef(null);

  const isDorm = selectedPurpose === "dorm";
  const activeList = isDorm ? dormStudents : students;
  const activeError = isDorm ? errorDorm : error;
  const activeLoading = isDorm ? loadingDorm : loading;
  const activeLoadingMore = isDorm ? loadingMoreDorm : loadingMore;
  const activeHasMore = isDorm ? hasMoreDorm : hasMore;
  const activeLoadMore = isDorm ? loadMoreDorm : loadMore;

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
    <div className="mt-4 overflow-x-auto rounded-lg  bg-white shadow-sm">
      {activeLoading && activeList.length === 0 ? (
        <div className="p-4 text-sm text-gray-600">Loading students…</div>
      ) : activeError ? (
        <div className="p-4 text-sm text-red-600">{activeError}</div>
      ) : (
        <table className="min-w-[1100px] w-full text-sm text-gray-800 border-t">
          <thead className="text-xs uppercase tracking-wide  text-gray-600">
            <tr className="">
              <th className="sticky border-b left-0 z-10  px-3 py-3 text-left w-16 bg-white">
                ID
              </th>
              <th className="sticky border-b left-16 z-10  px-3 py-3 text-left  bg-white">
                Full name
              </th>
              <th className="px-3 py-3 border text-left">Grade</th>
              <th className="px-3 py-3 border text-left">Tutor</th>
              <th className="px-3 py-3 border text-left">Discount</th>
              {months.map((month) => (
                <th key={month.key} className="px-3 py-3 border text-right">
                  {month.label}
                </th>
              ))}
              <th className="px-3 py-3 border text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {activeList.map((student, index) => (
              <TableRow key={`${student.id}-${index}`} student={student} />
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
    </div>
  );
}

export default PaymentTable;
