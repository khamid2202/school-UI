import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useGlobalContext } from "../../../../Hooks/UseContext";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";
import InvoiceTable from "./InvoiceTable";
import MobileCards from "./MobileCards";
import CreateInvoiceModule from "./CreateInvoiceModule";
import ClassFilter from "./Filters/ClassFilter";
import TeacherFilter from "./Filters/TeacherFilter";
import InvoiceCodeFilter from "./Filters/InvoiceCodeFilter";

const SPECIAL_TUITION_CLASSES = new Set(["4-A", "4-B"]);

const getAllowedTuitionAmount = (student) => {
  const classPair =
    student?.group?.class_pair ||
    [student?.group?.grade, student?.group?.class].filter(Boolean).join("-");

  if (SPECIAL_TUITION_CLASSES.has(classPair)) return 2300;
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

const fullName = (st) =>
  [st?.first_name, st?.last_name].filter(Boolean).join(" ") ||
  st?.name ||
  st?.full_name ||
  "Unnamed";

const getStudentBillingCodes = (student) => {
  if (!Array.isArray(student?.billings)) return [];
  const codes = student.billings
    .map((billing) => billing?.code)
    .filter(Boolean);
  return Array.from(new Set(codes));
};

function New_Invoices() {
  const {
    students,
    setStudents,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    meta,
    billings = [],
    notifyBillingUpdate,
    notifyInvoiceCreated,
    searchTerm,
    setSearchTerm,
    classes = [],
    teachers = [],
  } = useGlobalContext();

  const [pendingAssignments, setPendingAssignments] = useState({});
  const [creatingInvoices, setCreatingInvoices] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedInvoiceCodes, setSelectedInvoiceCodes] = useState([]);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [invoiceYear, setInvoiceYear] = useState(currentYear);
  const [invoiceMonth, setInvoiceMonth] = useState(currentMonth);

  const totalStudents = meta?.total ?? 0;

  const classOptions = useMemo(() => {
    if (!Array.isArray(classes)) return [];
    const seen = new Set();
    return classes
      .map((cls) => cls?.class_pair || cls?.name || null)
      .filter(Boolean)
      .filter((value) => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const teacherOptions = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    const seen = new Set();
    return teachers
      .map((t) => t.full_name || t.name || null)
      .filter(Boolean)
      .map((label) => ({ key: label.trim().toLowerCase(), label }))
      .filter(({ key }) => {
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teachers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedClasses.length > 0) count++;
    if (selectedTeachers.length > 0) count++;
    if (selectedInvoiceCodes.length > 0) count++;
    return count;
  }, [selectedClasses, selectedTeachers, selectedInvoiceCodes]);

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

  const billingByCode = useMemo(() => {
    const map = new Map();
    billings.forEach((b) => {
      if (b?.code) map.set(b.code, b);
    });
    return map;
  }, [billings]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const studentInvoiceCodes = (st) => {
      const invoices = Array.isArray(st?.invoices) ? st.invoices : [];
      const invoiceCodes = invoices
        .map((inv) => inv?.billing_code || inv?.code || inv?.billing?.code)
        .filter(Boolean);

      const assignedCodes = Array.isArray(st?.billings)
        ? st.billings.map((b) => b?.code).filter(Boolean)
        : [];

      return Array.from(new Set([...invoiceCodes, ...assignedCodes]));
    };

    return students.filter((st) => {
      const name = fullName(st).toLowerCase();
      const idStr = String(st.student_id ?? st.id ?? "").toLowerCase();
      const classPair =
        st?.group?.class_pair ||
        [st?.group?.grade, st?.group?.class].filter(Boolean).join("-");
      const teacherName = (st?.group?.teacher_name || "").trim().toLowerCase();
      const invoiceCodesForStudent = studentInvoiceCodes(st);

      if (q) {
        const matchesSearch =
          name.includes(q) ||
          idStr.includes(q) ||
          classPair.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (selectedClasses.length > 0 && !selectedClasses.includes(classPair)) {
        return false;
      }

      if (
        selectedTeachers.length > 0 &&
        (!teacherName || !selectedTeachers.includes(teacherName))
      ) {
        return false;
      }

      if (
        selectedInvoiceCodes.length > 0 &&
        !invoiceCodesForStudent.some((code) =>
          selectedInvoiceCodes.includes(code),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    students,
    searchTerm,
    selectedClasses,
    selectedTeachers,
    selectedInvoiceCodes,
  ]);

  const handleCreateInvoices = async ({ year, month }) => {
    if (!year || !month) {
      toast.error("Year and month are required");
      return;
    }

    setCreatingInvoices(true);

    try {
      await api.post(endpoints.CREATE_INVOICE, {
        academic_year_id: 1,
        year,
        month,
      });

      notifyInvoiceCreated?.(
        "Invoices created successfully for the selected month.",
      );
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create invoices.");
    } finally {
      setCreatingInvoices(false);
    }
  };

  const handleOpenCreateModal = () => {
    setInvoiceYear(currentYear);
    setInvoiceMonth(currentMonth);
    setShowCreateModal(true);
  };

  const handleAssignBillingCode = async (student, code, nextChecked) => {
    if (!student || !code) return;

    const studentId = student.student_id ?? student.id;
    const studentGroupId =
      student.student_group_id ?? student.group_id ?? student.group?.id;

    if (!studentId || !studentGroupId) {
      toast.error("Missing student identifiers");
      return;
    }

    const existingCodes = getStudentBillingCodes(student);
    const tuitionAmount = extractTuitionAmountFromCode(code);
    const allowedAmount = getAllowedTuitionAmount(student);

    let updatedCodes;

    if (tuitionAmount !== null) {
      if (tuitionAmount !== allowedAmount) {
        toast.error("Use the correct tuition amount for this class.");
        return;
      }

      const nonTuitionCodes = existingCodes.filter(
        (c) => extractTuitionAmountFromCode(c) === null,
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
        codesSet.delete(code);
      }
      updatedCodes = Array.from(codesSet);
    }

    const pendingKey = `${studentId}-${code}`;
    setPendingAssignments((prev) => ({ ...prev, [pendingKey]: nextChecked }));

    const billingIds = updatedCodes
      .map((c) => billingByCode.get(c)?.id)
      .filter(Boolean);

    try {
      await api.post(endpoints.ASSIGN_BILLING_CODE, {
        student_group_id: studentGroupId,
        billing_ids: billingIds,
      });

      notifyBillingUpdate(fullName(student));

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
        }),
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update billing codes.",
      );
    } finally {
      setPendingAssignments((prev) => {
        const next = { ...prev };
        delete next[pendingKey];
        return next;
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`relative inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                showFilters || activeFilterCount > 0
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              Filters
              <span
                aria-hidden={!activeFilterCount ? "true" : undefined}
                className={`pointer-events-none absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold leading-none text-white transition-opacity ${
                  activeFilterCount > 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                {activeFilterCount || 0}
              </span>
            </button>
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <InvoiceCodeFilter
                  options={billingCodes}
                  selected={selectedInvoiceCodes}
                  onChange={setSelectedInvoiceCodes}
                />
                <ClassFilter
                  options={classOptions}
                  selected={selectedClasses}
                  onChange={setSelectedClasses}
                />
                <TeacherFilter
                  options={teacherOptions}
                  selected={selectedTeachers}
                  onChange={setSelectedTeachers}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or class"
              className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={creatingInvoices}
            className={`inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 hover:bg-blue-700 sm:w-auto ${
              creatingInvoices ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {creatingInvoices ? "Creating invoices..." : "Create invoices"}
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <InvoiceTable
          students={filteredStudents}
          billingCodes={billingCodes}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          pendingAssignments={pendingAssignments}
          onToggleBilling={handleAssignBillingCode}
          getAllowedTuitionAmount={getAllowedTuitionAmount}
          extractTuitionAmountFromCode={extractTuitionAmountFromCode}
          totalStudents={totalStudents}
        />
      </div>

      <MobileCards
        students={filteredStudents}
        billingCodes={billingCodes}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        pendingAssignments={pendingAssignments}
        onToggleBilling={handleAssignBillingCode}
        getAllowedTuitionAmount={getAllowedTuitionAmount}
        extractTuitionAmountFromCode={extractTuitionAmountFromCode}
      />

      <CreateInvoiceModule
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        loading={creatingInvoices}
        defaultYear={invoiceYear}
        defaultMonth={invoiceMonth}
        onSubmit={(payload) => handleCreateInvoices(payload)}
      />
    </div>
  );
}

export default New_Invoices;
