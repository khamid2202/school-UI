import React, { useEffect, useRef } from "react";
import TableRow from "./TableRow";

function InvoiceTable({
  students = [],
  billingCodes = [],
  loading = false,
  loadingMore = false,
  error = "",
  hasMore = false,
  onLoadMore,
  pendingAssignments = {},
  onToggleBilling,
  getAllowedTuitionAmount,
  extractTuitionAmountFromCode,
}) {
  const sentinelRef = useRef(null);

  // Trigger load more on scroll (infinite scroll)
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !onLoadMore || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || loadingMore) return;
        onLoadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="divide-x divide-gray-200">
              <th className="px-4 py-3 text-left font-semibold">Student</th>
              <th className="px-4 py-3 text-left font-semibold">Class</th>
              {billingCodes.map((code) => (
                <th key={code} className="px-4 py-3 text-center font-semibold">
                  {code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-gray-500"
                  colSpan={2 + billingCodes.length}
                >
                  Loading students...
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-red-600"
                  colSpan={2 + billingCodes.length}
                >
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && students.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-gray-500"
                  colSpan={2 + billingCodes.length}
                >
                  No students to display.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              students.map((student, idx) => (
                <TableRow
                  key={`${student.student_id ?? student.id ?? idx}-${idx}`}
                  student={student}
                  billingCodes={billingCodes}
                  pendingAssignments={pendingAssignments}
                  onToggleBilling={onToggleBilling}
                  rowIndex={idx}
                  getAllowedTuitionAmount={getAllowedTuitionAmount}
                  extractTuitionAmountFromCode={extractTuitionAmountFromCode}
                />
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
        <span>
          Showing {students.length} student{students.length === 1 ? "" : "s"}
        </span>
        <span className="text-gray-500">
          {loadingMore
            ? "Loading more..."
            : hasMore
            ? "Scroll to load more"
            : "End of list"}
        </span>
      </div>
      <div ref={sentinelRef} className="h-2 w-full" aria-hidden />
    </div>
  );
}

export default InvoiceTable;
