import React, { useEffect, useMemo, useState } from "react";
import PaymentTable from "../PaymentTable/PaymentTable";
import MonthsToFilter, { monthsOptions } from "../Filters/MonthsToFilter";
import PaymentPurpose from "../Filters/PaymentPurpose";
import PaymentStatusFilter from "../Filters/PaymentStatusFilter";
import GradeFilter from "../Filters/GradeFilter";
import TeacherFilter from "../Filters/TeacherFilter";
import { useGlobalContext } from "../../../../Hooks/UseContext";

// Map JS Date month (0-11) to month key
const monthIndexToKey = {
  0: "jan",
  1: "feb",
  2: "mar",
  3: "apr",
  4: "may",
  5: "jun",
  // Jul & Aug not in academic year options
  8: "sep",
  9: "oct",
  10: "nov",
  11: "dec",
};

// Get default months: previous, current, and next month
const getDefaultMonths = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const prevMonth = (currentMonth - 1 + 12) % 12;
  const nextMonth = (currentMonth + 1) % 12;

  const keys = [prevMonth, currentMonth, nextMonth]
    .map((m) => monthIndexToKey[m])
    .filter(Boolean); // Filter out Jul/Aug which aren't in options

  // If we have no valid months (summer), default to sep
  return keys.length > 0 ? keys : ["sep"];
};

// Load saved filter from localStorage
const loadSavedFilter = (key, allowedKeys, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    if (allowedKeys) {
      const valid = parsed.filter((k) => allowedKeys.includes(k));
      return valid.length ? valid : fallback;
    }
    return parsed;
  } catch (err) {
    console.warn(`Failed to read ${key}`, err);
    return fallback;
  }
};

function PaymentsPage() {
  const allMonthKeys = useMemo(() => monthsOptions.map((m) => m.key), []);
  const defaultMonths = useMemo(() => getDefaultMonths(), []);

  // Filters state
  const [selectedMonths, setSelectedMonths] = useState(() =>
    loadSavedFilter("payments.selectedMonths", allMonthKeys, defaultMonths),
  );
  const [selectedStatuses, setSelectedStatuses] = useState(() =>
    loadSavedFilter("payments.selectedStatuses", null, []),
  );
  const [selectedGrades, setSelectedGrades] = useState(() =>
    loadSavedFilter("payments.selectedGrades", null, []),
  );
  const [selectedTeachers, setSelectedTeachers] = useState(() =>
    loadSavedFilter("payments.selectedTeachers", null, []),
  );
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("payments.showFilters");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const {
    searchTerm,
    setSearchTerm,
    selectedPurpose,
    students,
    dormStudents,
    courseStudents,
    meta,
    metaDorm,
    metaCourse,
    normalizeInvoices,
    teachers,
    classes,
  } = useGlobalContext();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatuses.length > 0) count++;
    if (selectedGrades.length > 0) count++;
    if (selectedTeachers.length > 0) count++;
    return count;
  }, [selectedStatuses, selectedGrades, selectedTeachers]);

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem(
        "payments.selectedMonths",
        JSON.stringify(selectedMonths),
      );
    } catch (err) {
      console.warn("Failed to persist months", err);
    }
  }, [selectedMonths]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "payments.selectedStatuses",
        JSON.stringify(selectedStatuses),
      );
    } catch (err) {
      console.warn("Failed to persist statuses", err);
    }
  }, [selectedStatuses]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "payments.selectedGrades",
        JSON.stringify(selectedGrades),
      );
    } catch (err) {
      console.warn("Failed to persist grades", err);
    }
  }, [selectedGrades]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "payments.selectedTeachers",
        JSON.stringify(selectedTeachers),
      );
    } catch (err) {
      console.warn("Failed to persist teachers", err);
    }
  }, [selectedTeachers]);

  useEffect(() => {
    try {
      localStorage.setItem("payments.showFilters", showFilters.toString());
    } catch (err) {
      console.warn("Failed to persist showFilters", err);
    }
  }, [showFilters]);

  // Drop stale teacher selections so missing options do not hide all rows by default
  useEffect(() => {
    if (!Array.isArray(teachers) || teachers.length === 0) {
      setSelectedTeachers((prev) => (prev.length ? [] : prev));
      return;
    }

    const allowed = teachers
      .map((t) => {
        const label = t.full_name || t.name || "";
        return label ? label.trim().toLowerCase() : null;
      })
      .filter(Boolean);

    setSelectedTeachers((prev) => {
      const valid = prev.filter((k) => allowed.includes(k));
      return valid.length === prev.length ? prev : valid;
    });
  }, [teachers]);

  // Drop stale class selections so old grade values don't persist
  useEffect(() => {
    if (!Array.isArray(classes) || classes.length === 0) {
      setSelectedGrades((prev) => (prev.length ? [] : prev));
      return;
    }

    const allowed = classes.map((c) => c.class_pair || c.grade).filter(Boolean);

    setSelectedGrades((prev) => {
      const valid = prev.filter((k) => allowed.includes(k));
      return valid.length === prev.length ? prev : valid;
    });
  }, [classes]);

  const isDorm = selectedPurpose === "dorm";
  const isCourse = selectedPurpose === "course";
  const rawList = isDorm ? dormStudents : isCourse ? courseStudents : students;

  // Apply filters to student list
  const activeList = useMemo(() => {
    let filtered = rawList;

    // Filter by class
    if (selectedGrades.length > 0) {
      filtered = filtered.filter((s) => {
        const classPair = s.group?.class_pair || s.group?.grade;
        return classPair && selectedGrades.includes(classPair);
      });
    }

    // Filter by teacher (match by name)
    if (selectedTeachers.length > 0) {
      filtered = filtered.filter((s) => {
        const teacherName = s.group?.teacher_name;
        const key = teacherName ? teacherName.trim().toLowerCase() : null;
        return key && selectedTeachers.includes(key);
      });
    }

    // Filter by payment status for selected months
    if (selectedStatuses.length > 0 && selectedMonths.length > 0) {
      filtered = filtered.filter((s) => {
        const invoiceStatus = normalizeInvoices(s.invoices);
        // Check if any selected month matches any selected status
        return selectedMonths.some((monthKey) => {
          const monthData = invoiceStatus[monthKey];
          if (!monthData) {
            // No invoice = Not Paid
            return selectedStatuses.includes("not_paid");
          }
          const status = (monthData.status || "").toLowerCase();
          if (
            status.includes("not full") &&
            selectedStatuses.includes("not_full")
          )
            return true;
          if (
            status.includes("not paid") &&
            selectedStatuses.includes("not_paid")
          )
            return true;
          if (status === "paid" && selectedStatuses.includes("paid"))
            return true;
          return false;
        });
      });
    }

    return filtered;
  }, [
    rawList,
    selectedGrades,
    selectedTeachers,
    selectedStatuses,
    selectedMonths,
    normalizeInvoices,
  ]);

  const activeTotal = isDorm
    ? (metaDorm?.total ?? rawList.length)
    : isCourse
      ? (metaCourse?.total ?? rawList.length)
      : (meta?.total ?? rawList.length);

  const toggleMonth = (key) => {
    setSelectedMonths((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleStatus = (key) => {
    setSelectedStatuses((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleGrade = (key) => {
    setSelectedGrades((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleTeacher = (key) => {
    setSelectedTeachers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 flex flex-col gap-2 overflow-hidden">
      <div className="shrink-0 rounded-2xl bg-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.2)] border border-slate-100/80 mx-4 mt-4">
        {/* TOP BAR */}
        <div className="flex flex-col gap-3 px-4 pt-4">
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* LEFT: Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters((p) => !p)}
                className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors
            ${
              showFilters || activeFilterCount > 0
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Expanded filters */}
              {showFilters && (
                <div className="flex flex-wrap items-center gap-3">
                  <PaymentPurpose />
                  <MonthsToFilter
                    selectedMonths={selectedMonths}
                    onToggle={toggleMonth}
                  />
                  <PaymentStatusFilter
                    selectedStatuses={selectedStatuses}
                    onToggle={toggleStatus}
                  />
                  <GradeFilter
                    selectedGrades={selectedGrades}
                    onToggle={toggleGrade}
                  />
                  <TeacherFilter
                    selectedTeachers={selectedTeachers}
                    onToggle={toggleTeacher}
                  />
                </div>
              )}
            </div>

            {/* RIGHT: Search */}
            <div className="shrink-0 w-full sm:w-auto">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students by full name"
                className="w-full sm:w-80 rounded-full border px-4 py-2 text-sm text-gray-900
                     focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* META */}
          <p className="text-xs pb-2 text-gray-500">
            Showing {activeList.length} students of {activeTotal}
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
        <PaymentTable
          visibleMonths={selectedMonths}
          filteredStudents={activeList}
        />
      </div>
    </div>
  );
}

export default PaymentsPage;
