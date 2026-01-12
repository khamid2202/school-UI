import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../Library/RequestMaker";
import { endpoints } from "../Library/Endpoints";
import toast from "react-hot-toast";

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  // Shared app-wide state lives here; add fields as needed.
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [appReady, setAppReady] = useState(false);

  // Payments state (moved from paymentContext)
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [dormStudents, setDormStudents] = useState([]);
  const [loadingDorm, setLoadingDorm] = useState(false);
  const [loadingMoreDorm, setLoadingMoreDorm] = useState(false);
  const [errorDorm, setErrorDorm] = useState(null);
  const [metaDorm, setMetaDorm] = useState(null);
  const [pageDorm, setPageDorm] = useState(1);
  const [selectedPurpose, setSelectedPurpose] = useState("tuition");
  const [billings, setBillings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Deduplicate students by student_id.
  const deduplicateRaw = (list) => {
    const seen = new Map();
    list.forEach((st) => {
      const key = st.student_id;
      if (key != null) {
        // Keep the latest entry (in case of updates)
        seen.set(key, st);
      }
    });
    return Array.from(seen.values());
  };

  // Normalize discounts array to a display-friendly string.
  const normalizeDiscounts = (discounts) => {
    if (!Array.isArray(discounts) || discounts.length === 0) return "-";

    const percentValues = discounts
      .map((d) => (Number.isFinite(d?.percent) ? Number(d.percent) : null))
      .filter((v) => v !== null);

    if (percentValues.length > 1) {
      const total = percentValues.reduce((acc, val) => acc + val, 0);
      return `${total}%`;
    } else if (percentValues.length === 1) {
      return `${percentValues[0]}%`;
    } else {
      const names = discounts
        .map((d) => d?.name || null)
        .filter(Boolean)
        .join(", ");
      return names || "-";
    }
  };

  // Normalize invoices array to a month-keyed object with aggregated status.
  const normalizeInvoices = (invoices) => {
    if (!Array.isArray(invoices) || invoices.length === 0) return {};

    const monthKey = {
      1: "jan",
      2: "feb",
      3: "mar",
      4: "apr",
      5: "may",
      6: "jun",
      7: "jul",
      8: "aug",
      9: "sep",
      10: "oct",
      11: "nov",
      12: "dec",
    };

    // Aggregate invoices per month
    const invoiceTotals = {};
    invoices.forEach((inv) => {
      const key = monthKey[inv?.month];
      if (!key) return;

      const required = Number(inv?.total_required_amount) || 0;
      const paid = Number(inv?.total_paid_amount) || 0;
      const remainingRaw = inv?.remaining_amount;
      const remaining =
        remainingRaw === 0 || remainingRaw != null
          ? Number(remainingRaw)
          : Math.max(required - paid, 0);

      const current = invoiceTotals[key] || {
        required: 0,
        paid: 0,
        remaining: 0,
      };

      invoiceTotals[key] = {
        required: current.required + required,
        paid: current.paid + paid,
        remaining: current.remaining + remaining,
      };
    });

    // Calculate status for each month
    const invoiceStatus = {};
    Object.entries(invoiceTotals).forEach(([key, totals]) => {
      const required = totals.required || 0;
      const paid = totals.paid || 0;
      const remaining = totals.remaining;

      const percent = required > 0 ? Math.round((paid / required) * 100) : 0;

      let status = "Not Paid";
      if (remaining <= 0 || percent >= 100) {
        status = "Paid";
      } else if (paid > 0) {
        status = "Not Full";
      }

      invoiceStatus[key] = {
        status,
        percent: Math.min(100, Math.max(0, percent)),
        remaining,
        required,
        paid,
      };
    });

    return invoiceStatus;
  };

  //STUDENTS FETCHING
  const fetchStudents = async (nextPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get(endpoints.GET_STUDENTS_TO_TEST, {
        page: nextPage,
        q: searchTerm || undefined,
      });
      const raw = res?.data?.students || [];
      const unique = deduplicateRaw(raw);
      setStudents((prev) => (append ? [...prev, ...unique] : unique));
      setMeta(res?.data?.meta || null);
      setPage(nextPage);
    } catch (err) {
      setError(err?.message || "Failed to load students");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  //DORM STUDENTS
  const fetchDormStudents = async (nextPage = 1, append = false) => {
    if (append) {
      setLoadingMoreDorm(true);
    } else {
      setLoadingDorm(true);
    }
    setErrorDorm(null);
    try {
      const res = await api.get(endpoints.GET_DORM_STUDENTS_FOR_PAYMENTS, {
        page: nextPage,
        q: searchTerm || undefined,
      });
      const raw = res?.data?.students || [];
      const unique = deduplicateRaw(raw);
      setDormStudents((prev) => (append ? [...prev, ...unique] : unique));
      setMetaDorm(res?.data?.meta || null);
      setPageDorm(nextPage);
    } catch (err) {
      setErrorDorm(err?.message || "Failed to load dorm students");
    } finally {
      setLoadingDorm(false);
      setLoadingMoreDorm(false);
    }
  };

  useEffect(() => {
    fetchBillings();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents(1, false);
    fetchDormStudents(1, false);
  }, [searchTerm]);

  const hasMore = useMemo(() => {
    if (!meta) return false;
    const total = meta.total ?? 0;
    const to = meta.range?.to ?? students.length;
    return to < total;
  }, [meta, students.length]);

  const hasMoreDorm = useMemo(() => {
    if (!metaDorm) return false;
    const total = metaDorm.total ?? 0;
    const to = metaDorm.range?.to ?? dormStudents.length;
    return to < total;
  }, [metaDorm, dormStudents.length]);

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    await fetchStudents(page + 1, true);
  };

  const loadMoreDorm = async () => {
    if (loadingDorm || loadingMoreDorm || !hasMoreDorm) return;
    await fetchDormStudents(pageDorm + 1, true);
  };

  //BILLINGS
  const fetchBillings = async () => {
    try {
      const response = await api.get(endpoints.GET_BILLINGS);
      const billings = response.data.billings || [];
      setBillings(billings);
    } catch (error) {
      console.error("Error fetching billings:", error);
      setBillings([]);
    }
  };

  //CLASSES
  const fetchClasses = async () => {
    try {
      const response = await api.get(endpoints.GET_CLASSES);
      const classes = response.data.groups || [];
      console.log("Fetched classes:", classes);

      setClasses(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  const notifyBillingUpdate = (studentName) => {
    if (!studentName) return;
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center`}
      >
        <span>
          Updated billing assignments for <strong>{studentName}</strong>.
        </span>
      </div>
    ));
  };

  const notifyInvoiceCreated = (
    message = "Invoice created successfully for all students."
  ) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } bg-white text-black shadow-md rounded-md p-4 flex items-center`}
      >
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
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      authToken,
      setAuthToken,
      appReady,
      setAppReady,
      // payments
      students,
      setStudents,
      dormStudents,
      loading,
      loadingMore,
      loadingDorm,
      loadingMoreDorm,
      error,
      errorDorm,
      page,
      setPage,
      meta,
      hasMore,
      hasMoreDorm,
      loadMore,
      loadMoreDorm,
      refetch: fetchStudents,
      refetchDorm: fetchDormStudents,
      selectedPurpose,
      setSelectedPurpose,
      billings,
      notifyBillingUpdate,
      notifyInvoiceCreated,
      setClasses,
      classes,
      searchTerm,
      setSearchTerm,
      fetchClasses,
      normalizeDiscounts,
      normalizeInvoices,
    }),
    [
      currentUser,
      authToken,
      appReady,
      students,
      dormStudents,
      loading,
      loadingMore,
      loadingDorm,
      loadingMoreDorm,
      error,
      errorDorm,
      page,
      meta,
      hasMore,
      hasMoreDorm,
      selectedPurpose,
      billings,
      classes,
      searchTerm,
    ]
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx)
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  return ctx;
};
