import React from "react";

const cn = (...c) => c.filter(Boolean).join(" ");

function MobileCards({
  filtered,
  loading,
  error,
  billingCodes,
  pendingAssignments,
  handleAssignBillingCode,
  fullName,
  getAllowedTuitionAmount,
  extractTuitionAmountFromCode,
  studentHasBillingCode,
  loadingMore,
  hasMore,
}) {
  return (
    <div className="space-y-3 md:hidden">
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-gray-500">
          Loading students...
        </div>
      )}
      {error && !loading && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-6 text-center text-red-600">
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-gray-500">
          No students found.
        </div>
      )}
      {!loading &&
        !error &&
        filtered.map((st, idx) => {
          const studentKey = st.student_id ?? st.id ?? `card-${idx}`;
          const groupKey =
            st.student_group_id ?? st.group_id ?? st.group?.id ?? `grp-${idx}`;
          const cardKey = `${studentKey || "s"}-${groupKey || "g"}-${idx}`;

          return (
            <div
              key={cardKey}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{fullName(st)}</p>
                  <p className="text-sm text-gray-500">
                    Class: {st?.group?.class_pair || "-"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {billingCodes.map((code, cIdx) => {
                  const tuitionAmount = extractTuitionAmountFromCode(code);
                  const allowedAmount = getAllowedTuitionAmount(st);
                  const isTuitionCode = tuitionAmount !== null;
                  const baseDisabled =
                    isTuitionCode && tuitionAmount !== allowedAmount;
                  const checked = studentHasBillingCode(st, code);
                  const studentId = st.student_id ?? st.id;
                  const pendingKey = `${studentId}-${code}`;
                  const hasPendingEntry = Object.prototype.hasOwnProperty.call(
                    pendingAssignments,
                    pendingKey
                  );
                  const pendingValue = pendingAssignments[pendingKey];
                  const effectiveChecked =
                    typeof pendingValue === "boolean" ? pendingValue : checked;
                  const isDisabled =
                    hasPendingEntry || (baseDisabled && !checked);

                  return (
                    <label
                      key={`${code}-${cIdx}`}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {code}
                        </p>
                        {baseDisabled && !checked && (
                          <p className="text-xs text-orange-500">
                            Not available for this class
                          </p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className={cn(
                          "size-5 accent-blue-600",
                          isDisabled
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer"
                        )}
                        disabled={isDisabled}
                        checked={effectiveChecked}
                        onChange={(event) => {
                          if (!isDisabled) {
                            handleAssignBillingCode(
                              st,
                              code,
                              event.target.checked
                            );
                          }
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      {loadingMore && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500">
          Loading more students...
        </div>
      )}
      {!hasMore && !loadingMore && filtered.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-400">
          End of list
        </div>
      )}
    </div>
  );
}

export default MobileCards;
