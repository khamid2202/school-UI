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
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [dormStudents, setDormStudents] = useState([]);
  const [loadingDorm, setLoadingDorm] = useState(false);
  const [loadingMoreDorm, setLoadingMoreDorm] = useState(false);
  const [errorDorm, setErrorDorm] = useState(null);
  const [metaDorm, setMetaDorm] = useState(null);
  const [pageDorm, setPageDorm] = useState(1);
  const [selectedPurpose, setSelectedPurpose] = useState("tuition");
  const [billings, setBillings] = useState([]);
  const [classes, setClasses] = useState([]);

  const normalizeStudent = (item) => {
    const classPair =
      item?.group?.class_pair ||
      [item?.group?.grade, item?.group?.class].filter(Boolean).join("-");

    const resolvedFullName =
      [item?.first_name, item?.last_name].filter(Boolean).join(" ") ||
      item?.full_name ||
      item?.name ||
      "Unnamed";

    return {
      id: item.student_id,
      student_id: item.student_id,
      student_group_id: item.student_group_id,
      fullName: resolvedFullName,
      full_name: item?.full_name,
      first_name: item?.first_name,
      last_name: item?.last_name,
      name: item?.name,
      grade: classPair,
      class_pair: classPair,
      class_pair_compact: item?.group?.class_pair_compact,
      tutor: item?.group?.teacher_name || "",
      status: item.status,
      group: item.group,
      payments: item.payments || [],
      billings: item.billings || [],
    };
  };

  const studentKey = (st) => {
    const primary = st?.student_id ?? st?.id ?? st?.uuid ?? "unknown";
    const groupPart =
      st?.student_group_id ?? st?.group_id ?? st?.group?.id ?? "nogroup";
    return `${primary}::${groupPart}`;
  };

  const dedupeStudents = (list) => {
    const seen = new Set();
    const unique = [];
    list.forEach((st) => {
      const key = studentKey(st);
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(st);
    });
    return unique;
  };

  //STUDENTS FETCHING
  const fetchStudents = async ({ page: nextPage = 1, append = false } = {}) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get(endpoints.GET_ALL_STUDENTS_FOR_PAYMENTS, {
        page: nextPage,
      });
      const raw = res?.data?.students || [];
      const normalized = raw.map(normalizeStudent);
      setStudents((prev) =>
        dedupeStudents(append ? [...prev, ...normalized] : normalized)
      );
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
  const fetchDormStudents = async ({
    page: nextPage = 1,
    append = false,
  } = {}) => {
    if (append) {
      setLoadingMoreDorm(true);
    } else {
      setLoadingDorm(true);
    }
    setErrorDorm(null);
    try {
      const res = await api.get(endpoints.GET_DORM_STUDENTS_FOR_PAYMENTS, {
        page: nextPage,
      });
      const raw = res?.data?.students || [];
      const normalized = raw.map(normalizeStudent);
      setDormStudents((prev) =>
        dedupeStudents(append ? [...prev, ...normalized] : normalized)
      );
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
    fetchStudents();
    fetchDormStudents();
    fetchBillings();
    fetchClasses();
  }, []);

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
    await fetchStudents({ page: page + 1, append: true });
  };

  const loadMoreDorm = async () => {
    if (loadingDorm || loadingMoreDorm || !hasMoreDorm) return;
    await fetchDormStudents({ page: pageDorm + 1, append: true });
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
      refetch: fetchStudents,
      refetchDorm: fetchDormStudents,
      loadMore,
      loadMoreDorm,
      hasMore,
      hasMoreDorm,
      selectedPurpose,
      setSelectedPurpose,
      billings,
      notifyBillingUpdate,
      notifyInvoiceCreated,
      setClasses,
      classes,
      fetchClasses,
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
      hasMore,
      hasMoreDorm,
      selectedPurpose,
      billings,
      classes,
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
