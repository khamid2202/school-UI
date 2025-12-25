import React, { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Search } from "lucide-react";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";
import { useGlobalContext } from "../../../../Hooks/UseContext";
import toast from "react-hot-toast";
import ReusableFilter from "../../../../Layouts/ReusableFilter";
import MobileCards from "./MobileCards";

//import the contex from payment context

// minimal className joiner
const cn = (...c) => c.filter(Boolean).join(" ");

const SPECIAL_TUITION_CLASSES = new Set(["4-A", "4-B"]);

// milliseconds before status toasts auto-dismiss
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
  // Derive class pair even if the API omits class_pair but provides grade/class.
  const classPair =
    student?.group?.class_pair ||
    [student?.group?.grade, student?.group?.class].filter(Boolean).join("-");

  // Only 4th classes (e.g., 4-A, 4-B) can have tuition/2300; others must use tuition/2600.
  if (SPECIAL_TUITION_CLASSES.has(classPair)) {
    return 2300;
  }

  // Default for all other grades.
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

function ConfigurationContent() {
  const {
    students,
    setStudents,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    billings = [],
    notifyBillingUpdate,
    notifyInvoiceCreated,
  } = useGlobalContext();

  //declare the new context values

  const [query, setQuery] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
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
  const billingCodes = useMemo(() => {
    const seen = new Set();
    return billings
      .map((b) => b?.code)
      .filter((code) => {
        if (!code) return false;
        if (seen.has(code)) return false;
        seen.add(code);
        return true;
      });
  }, [billings]);

  // Map billing code to full billing object for quick id lookups.
  const billingByCode = useMemo(() => {
    const map = new Map();
    billings.forEach((b) => {
      if (b?.code) map.set(b.code, b);
    });
    return map;
  }, [billings]);

  const classOptions = useMemo(() => {
    const seen = new Set();
    students.forEach((student) => {
      const classPair = student?.group?.class_pair;
      if (typeof classPair === "string" && classPair.trim()) {
        seen.add(classPair.trim());
      }
    });
    return Array.from(seen)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
  }, [students]);

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

  // Tuition enforcement handled during manual assignments.

  // Handle creating invoices for all students
  const handleCreateInvoices = async () => {
    const currentYear = new Date().getFullYear();

    try {
      const response = await api.post(endpoints.CREATE_INVOICE, {
        academic_year_id: 1,
        year: currentYear,
        month: invoiceMonth,
      });

      console.log("Invoice creation response:", response.data);

      notifyInvoiceCreated("Invoice created successfully for all students.");

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
    const q = query.toLowerCase();
    const hasClassFilter = Array.isArray(selectedClasses)
      ? selectedClasses.length > 0
      : false;

    return students.filter((st) => {
      const name = fullName(st).toLowerCase();
      const idStr = String(st.id ?? st.uuid ?? "").toLowerCase();
      const clsPair = (st?.group?.class_pair || "").trim();
      const matchesQuery = q
        ? name.includes(q) ||
          idStr.includes(q) ||
          String(clsPair).toLowerCase().includes(q)
        : true;

      const matchesClass = hasClassFilter
        ? selectedClasses.includes(clsPair)
        : true;

      return matchesQuery && matchesClass;
    });
  }, [students, query, selectedClasses]);

  const handleAssignBillingCode = async (student, code, nextChecked) => {
    if (!student || !code) return;

    const studentId = student.student_id ?? student.id;
    const studentGroupId =
      student.student_group_id ?? student.group_id ?? student.group?.id;

    if (!studentId || !studentGroupId) {
      console.error("Missing student identifiers");
      return;
    }

    const existingCodes = getStudentBillingCodes(student);
    const tuitionAmount = extractTuitionAmountFromCode(code);
    const allowedAmount = getAllowedTuitionAmount(student);

    let updatedCodes;

    if (tuitionAmount !== null) {
      // Enforce correct tuition code by class (4th -> 2300, others -> 2600).
      if (tuitionAmount !== allowedAmount) {
        toast.error(
          "4th classes must use tuition/2300; higher classes use tuition/2600."
        );
        return;
      }

      const nonTuitionCodes = existingCodes.filter(
        (c) => extractTuitionAmountFromCode(c) === null
      );
      const nextSet = new Set(nonTuitionCodes);
      if (nextChecked) {
        nextSet.add(code);
      }
      updatedCodes = Array.from(nextSet);
    } else {
      const codesSet = new Set(existingCodes);
      if (nextChecked) {
        codesSet.add(code);
      } else {
        if (!codesSet.has(code)) {
          return;
        }
        codesSet.delete(code);
      }
      updatedCodes = Array.from(codesSet);
    }

    const key = `${studentId}-${code}`;
    setPendingAssignments((prev) => ({ ...prev, [key]: nextChecked }));

    const billingIds = updatedCodes
      .map((c) => billingByCode.get(c)?.id)
      .filter(Boolean);

    try {
      await api.post(endpoints.ASSIGN_BILLING_CODE, {
        student_group_id: studentGroupId,
        billing_ids: billingIds,
      });

      notifyBillingUpdate(fullName(student));

      // Update local student state
      setStudents((prevStudents) =>
        prevStudents.map((st) => {
          const stId = st.student_id ?? st.id;
          if (stId !== studentId) return st;
          return {
            ...st,
            billings: updatedCodes.map((c) => ({
              code: c,
              id: billingByCode.get(c)?.id,
            })),
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
        <div className="mt-2 text-sm text-gray-500">
          <ReusableFilter
            title="Filter by class"
            options={classOptions}
            selectedValues={selectedClasses}
            onChange={setSelectedClasses}
            placeholder="Search classes"
          />
        </div>
      </div>

      {isInvoiceModalOpen && (
        <div className="fixed  z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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
                {billingCodes.map((code, idx) => (
                  <th key={`${code}-${idx}`} className="px-4 py-3 text-center">
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
                  const studentKey = st.student_id ?? st.id ?? `auto-${idx}`;
                  const groupKey =
                    st.student_group_id ??
                    st.group_id ??
                    st.group?.id ??
                    `grp-${idx}`;
                  const id = `${studentKey || "s"}-${groupKey || "g"}-${idx}`;
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
                      {billingCodes.map((code, cIdx) => (
                        <td
                          key={`${code}-${cIdx}`}
                          className="px-4 py-4 text-center"
                        >
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

      <MobileCards
        filtered={filtered}
        loading={loading}
        error={error}
        billingCodes={billingCodes}
        pendingAssignments={pendingAssignments}
        handleAssignBillingCode={handleAssignBillingCode}
        fullName={fullName}
        getAllowedTuitionAmount={getAllowedTuitionAmount}
        extractTuitionAmountFromCode={extractTuitionAmountFromCode}
        studentHasBillingCode={studentHasBillingCode}
        loadingMore={loadingMore}
        hasMore={hasMore}
      />

      <div ref={bottomSentinelRef} className="h-2" />
    </div>
  );
}

function Configuration() {
  return <ConfigurationContent />;
}

export default Configuration;
