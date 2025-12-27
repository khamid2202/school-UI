import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";

const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
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

  //    get all students for payments
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
      const normalized = raw.map((item) => {
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
      });
      setStudents((prev) => (append ? [...prev, ...normalized] : normalized));
      setMeta(res?.data?.meta || null);
      setPage(nextPage);
    } catch (err) {
      setError(err?.message || "Failed to load students");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  //    get dorm students for payments
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
      const normalized = raw.map((item) => {
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
      });
      setDormStudents((prev) =>
        append ? [...prev, ...normalized] : normalized
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

  // get billings
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
  useEffect(() => {
    fetchBillings();
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
      students,
      setStudents,
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
    ]
  );

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};

export function usePaymentContext() {
  const ctx = useContext(PaymentContext);
  if (!ctx)
    throw new Error("usePaymentContext must be used within PaymentProvider");
  return ctx;
}
