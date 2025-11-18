import React, { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Search } from "lucide-react";
import { api } from "../../../Library/RequestMaker";
import { endpoints } from "../../../Library/Endpoints";
import useStudentPayments from "../PaymentPage/hooks/useStudentPaymentsContext";
import toast from "react-hot-toast";

// minimal className joiner
const cn = (...c) => c.filter(Boolean).join(" ");

const SPECIAL_TUITION_CLASSES = new Set(["4-A", "4-B"]);
const DEFAULT_ACADEMIC_YEAR = "2025-2026";
const STATUS_STYLES = {
  success: "bg-green-50 text-green-700 border border-green-200",
  error: "bg-red-50 text-red-600 border border-red-200",
  info: "bg-blue-50 text-blue-600 border border-blue-200",
};
const STATUS_DISMISS_DELAY = 2000;

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const getAllowedTuitionAmount = (student) => {
  const classPair = student?.group?.class_pair || "";
  if (!classPair) return 2600;
  if (SPECIAL_TUITION_CLASSES.has(classPair)) {
    return 2300;
  }
  return 2600;
};

const extractTuitionAmountFromCode = (code) => {
  if (typeof code !== "string") return null;
  if (!code.startsWith("tuition")) return null;
  const parts = code.split("/");
  if (parts.length < 2) return null;
  const amount = Number(parts[1]);
  return Number.isFinite(amount) ? amount : null;
};

function Configuration() {
  const {
    students,
    setStudents,
    loading,
    loadingMore,
    error,
    billings,
    hasMore,
    loadMore,
  } = useStudentPayments({ enabled: true });

  const [query, setQuery] = useState("");
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceMonth] = useState(new Date().getMonth() + 1);
  const bottomSentinelRef = useRef(null);
  const [pendingAssignments, setPendingAssignments] = useState({});

  // Normalize a student record to a display name
  const fullName = (st) =>
    [st?.first_name, st?.last_name].filter(Boolean).join(" ") ||
    st?.name ||
    st?.full_name ||
    "Unnamed";

  // Billing codes rendered as columns
  const billingCodes = useMemo(
    () => billings.map((b) => b?.code).filter(Boolean),
    [billings]
  );

  const studentHasBillingCode = (student, code) => {
    if (!code) return false;
    if (!Array.isArray(student?.billings)) return false;
    return student.billings.some((billing) => billing?.code === code);
  };

  const getStudentBillingCodes = (student) => {
    if (!Array.isArray(student?.billings)) return [];
    const codes = student.billings
      .map((billing) => billing?.code)
      .filter(Boolean);
    return Array.from(new Set(codes));
  };

  // Handle creating invoices for all students
  const handleCreateInvoices = async () => {
    const currentYear = new Date().getFullYear();

    try {
      const response = await api.post(
        endpoints.CREATE_INVOICE + `/${currentYear}/${invoiceMonth}`
      );

      console.log("Invoice creation response:", response.data);

      toast.custom((t) => (
        <div
          className={cn(
            "bg-white text-black shadow-md rounded-md p-4",
            STATUS_STYLES.success
          )}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">
                Invoice created successfully for all students.
              </p>
            </div>
          </div>
        </div>
      ));

      toast.success("Invoice created successfully for all students.", {
        duration: STATUS_DISMISS_DELAY,
      });

      setInvoiceModalOpen(false);
    } catch (error) {
      toast.error("Failed to create invoice for all students.", {
        duration: STATUS_DISMISS_DELAY,
      });
    }
  };

  // Infinite scroll: load more students when sentinel enters view
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return undefined;
    if (!hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || loadingMore) return;
        loadMore?.();
      },
      {
        rootMargin: "200px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  // Billings already provided by payments context

  const filtered = useMemo(() => {
    if (!query) return students;
    const q = query.toLowerCase();
    return students.filter((st) => {
      const name = fullName(st).toLowerCase();
      const idStr = String(st.id ?? st._id ?? st.uuid ?? "").toLowerCase();
      const clsPair = st?.group?.class_pair || "";
      return (
        name.includes(q) ||
        idStr.includes(q) ||
        String(clsPair).toLowerCase().includes(q)
      );
    });
  }, [students, query]);

  const handleAssignBillingCode = async (student, code, nextChecked) => {
    if (!student || !code) return;

    const studentId = student.student_id ?? student.id;
    if (!studentId) {
      // toast error missing student identifier
      console.error("Missing student identifier");
      return;
    }

    const existingCodes = getStudentBillingCodes(student);
    const codesSet = new Set(existingCodes);

    if (nextChecked) {
      codesSet.add(code);
    } else {
      if (!codesSet.has(code)) {
        return;
      }
      codesSet.delete(code);
    }

    const updatedCodes = Array.from(codesSet);
    const key = `${studentId}-${code}`;
    setPendingAssignments((prev) => ({ ...prev, [key]: nextChecked }));

    try {
      await api.post(endpoints.ASSIGN_BILLING_CODE, {
        student_id: studentId,
        academic_year:
          student.academic_year_label ||
          student.academic_year ||
          DEFAULT_ACADEMIC_YEAR,
        billing_codes: updatedCodes,
      });

      //show the fullname in bold
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center`}
        >
          <span>
            Updated billing assignments for <strong>{fullName(student)}</strong>
            .
          </span>
        </div>
      ));

      // Update local student state
      setStudents((prevStudents) =>
        prevStudents.map((st) => {
          const stId = st.student_id ?? st.id;
          if (stId !== studentId) return st;
          return {
            ...st,
            billings: updatedCodes.map((c) => ({ code: c })),
          };
        })
      );
    } catch (assignError) {
      toast.error(
        assignError?.response?.data?.message ||
          "Failed to update billing codes."
      );
    } finally {
      setPendingAssignments((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Sticky header containing search + action */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 bg-white/95 px-4 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:-mx-6 sm:px-6">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-[620px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name..."
              className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-12 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full size-10 text-gray-600 hover:bg-gray-100"
              aria-label="Filter"
            >
              <Filter size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setInvoiceModalOpen(true)}
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-auto"
          >
            Create invoices
          </button>
        </div>
      </div>

      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm invoice month
              </h2>
              {/* <p className="mt-1 text-sm text-gray-500">
                Choose the month you want to create invoices for and confirm to proceed.
              </p> */}
            </div>
            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              This action will create invoices for
              <span className="font-semibold text-gray-900">
                {" "}
                {MONTH_OPTIONS.find((option) => option.value === invoiceMonth)
                  ?.label || "Selected month"}
              </span>
              .
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateInvoices}
                className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-auto"
              >
                Confirm & create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table (desktop) */}
      <div className="hidden md:block rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-500 divide-x divide-gray-200">
                {/* Table header will show billing codes as options */}
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Class</th>
                {billings.map((b) => (
                  <th key={b.code} className="px-4 py-3 text-center">
                    {b.code}
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
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-500"
                    colSpan={2 + billingCodes.length}
                  >
                    No students found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filtered.map((st, idx) => {
                  const id = st.student_id ?? `auto-${idx}`;
                  const zebra = idx % 2 === 1 ? "bg-gray-50/60" : "bg-white";

                  return (
                    <tr
                      key={id}
                      className={cn(
                        "hover:bg-gray-50 divide-x divide-gray-100",
                        zebra
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {fullName(st)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {st?.group?.class_pair || "-"}
                      </td>
                      {billingCodes.map((code) => (
                        <td key={code} className="px-4 py-4 text-center">
                          {(() => {
                            const tuitionAmount =
                              extractTuitionAmountFromCode(code);
                            const allowedAmount = getAllowedTuitionAmount(st);
                            const isTuitionCode = tuitionAmount !== null;
                            const baseDisabled =
                              isTuitionCode && tuitionAmount !== allowedAmount;
                            const checked = studentHasBillingCode(st, code);
                            const studentKey = st.student_id ?? st.id;
                            const pendingKey = `${studentKey}-${code}`;
                            const hasPendingEntry =
                              Object.prototype.hasOwnProperty.call(
                                pendingAssignments,
                                pendingKey
                              );
                            const pendingValue = pendingAssignments[pendingKey];
                            const effectiveChecked =
                              typeof pendingValue === "boolean"
                                ? pendingValue
                                : checked;
                            const isDisabled =
                              hasPendingEntry || (baseDisabled && !checked);

                            return (
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
                            );
                          })()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {loadingMore && (
          <div className="py-3 text-center text-xs text-gray-500 border-t border-gray-100">
            Loading more students...
          </div>
        )}
        {!hasMore && !loadingMore && students.length > 0 && (
          <div className="py-3 text-center text-xs text-gray-400 border-t border-gray-100">
            End of list
          </div>
        )}
      </div>

      {/* Card view (mobile) */}
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
          filtered.map((st, idx) => (
            <div
              key={st.student_id ?? `card-${idx}`}
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
                {billingCodes.map((code) => {
                  const tuitionAmount = extractTuitionAmountFromCode(code);
                  const allowedAmount = getAllowedTuitionAmount(st);
                  const isTuitionCode = tuitionAmount !== null;
                  const baseDisabled =
                    isTuitionCode && tuitionAmount !== allowedAmount;
                  const checked = studentHasBillingCode(st, code);
                  const studentKey = st.student_id ?? st.id;
                  const pendingKey = `${studentKey}-${code}`;
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
                      key={code}
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
          ))}
        {loadingMore && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500">
            Loading more students...
          </div>
        )}
        {!hasMore && !loadingMore && students.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-400">
            End of list
          </div>
        )}
      </div>

      <div ref={bottomSentinelRef} className="h-2" />
    </div>
  );
}

export default Configuration;
