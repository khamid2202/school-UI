import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";
import { use } from "react";

const normalizeStudentKey = (student) => {
  const key = student?.id ?? student?.student_id ?? student?.user_id ?? null;
  return key !== null && key !== undefined ? String(key) : null;
};

const resolveCurrentPage = (meta, fallback) => {
  if (!meta || typeof meta !== "object") return fallback;
  if (typeof meta.current_page === "number") return meta.current_page;
  if (typeof meta.page === "number") return meta.page;
  if (typeof meta.offset === "number" && typeof meta.limit === "number") {
    return Math.floor(meta.offset / meta.limit) + 1;
  }
  return fallback;
};

const computeHasMore = (meta, fetchedLength) => {
  if (!meta || typeof meta !== "object") {
    return fetchedLength > 0;
  }

  if (Object.prototype.hasOwnProperty.call(meta, "next_page_url")) {
    return Boolean(meta.next_page_url);
  }

  if (
    typeof meta.current_page === "number" &&
    typeof meta.last_page === "number"
  ) {
    return meta.current_page < meta.last_page;
  }

  if (typeof meta.page === "number" && typeof meta.total_pages === "number") {
    return meta.page < meta.total_pages;
  }

  if (
    typeof meta.offset === "number" &&
    typeof meta.limit === "number" &&
    typeof meta.total === "number"
  ) {
    return meta.offset + meta.limit < meta.total;
  }

  if (typeof meta.end_index === "number" && typeof meta.total === "number") {
    return meta.end_index < meta.total;
  }

  return fetchedLength > 0;
};

const mergeStudents = (existing, incoming) => {
  if (!existing.length) return incoming;

  const indexById = new Map();
  const merged = [...existing];

  merged.forEach((student, index) => {
    const key = normalizeStudentKey(student);
    if (key !== null) {
      indexById.set(key, index);
    }
  });

  incoming.forEach((student) => {
    const key = normalizeStudentKey(student);
    if (key !== null && indexById.has(key)) {
      merged[indexById.get(key)] = student;
      return;
    }

    if (key !== null) {
      indexById.set(key, merged.length);
    }
    merged.push(student);
  });

  return merged;
};

const buildMonthCatalog = (students) => {
  if (!Array.isArray(students) || !students.length) {
    return [];
  }

  const monthLabelLookup = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const uniqueMonthMap = new Map();

  students.forEach((student) => {
    if (!Array.isArray(student?.payments)) return;

    student.payments.forEach((payment) => {
      if (!payment || typeof payment.month !== "number") return;

      const year = payment.year ?? null;
      const mapKey = `${year ?? "na"}-${payment.month}`;

      if (!uniqueMonthMap.has(mapKey)) {
        uniqueMonthMap.set(mapKey, {
          key: mapKey,
          monthNumber: payment.month,
          year,
          label:
            monthLabelLookup[payment.month - 1] || `Month ${payment.month}`,
        });
      }
    });
  });

  const academicOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

  return Array.from(uniqueMonthMap.values()).sort((a, b) => {
    const indexA = academicOrder.indexOf(a.monthNumber);
    const indexB = academicOrder.indexOf(b.monthNumber);

    if (indexA === -1 && indexB === -1) {
      if (a.year === b.year) {
        return a.monthNumber - b.monthNumber;
      }
      return (a.year ?? 0) - (b.year ?? 0);
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    if (indexA === indexB) {
      return (a.year ?? 0) - (b.year ?? 0);
    }

    return indexA - indexB;
  });
};

export const useStudentPayments = ({ enabled = true } = {}) => {
  const [students, setStudents] = useState([]);
  const [dormStudents, setDormStudents] = useState([]);
  const [months, setMonths] = useState([]);
  const [billings, setBillings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [dormQuery, setDormQuery] = useState("");

  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchBillings = async () => {
      try {
        const response = await api.get(endpoints.GET_BILLINGS);
        const billings = response.data.billing_codes || [];

        setBillings(billings);
      } catch (error) {
        console.error("Error fetching billings:", error);
        setBillings([]);
      }
    };

    fetchBillings();
  }, []);

  const fetchStudents = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const sanitizedQuery = query.trim();
        const params = { page };

        if (sanitizedQuery) {
          params.q = sanitizedQuery;
        }

        const response = await api.get(
          endpoints.GET_STUDENT_WITH_PAYMENTS,
          params
        );

        const fetchedStudents = response.data?.students || [];
        const metaData = response.data?.meta || null;

        setStudents((prev) =>
          append ? mergeStudents(prev, fetchedStudents) : fetchedStudents
        );
        setMeta(metaData);

        const resolvedPage = resolveCurrentPage(metaData, page);
        setCurrentPage(resolvedPage);

        const moreAvailable = computeHasMore(metaData, fetchedStudents.length);
        setHasMore(moreAvailable);

        if (!append) {
          setError("");
        }
      } catch (fetchError) {
        console.error("Error fetching students with payments:", fetchError);
        if (!append) {
          setError("Failed to load students. Please try again later.");
        }
      } finally {
        isFetchingRef.current = false;
        if (!append) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [query]
  );

  const refresh = useCallback(
    () => fetchStudents({ page: 1, append: false }),
    [fetchStudents]
  );

  const loadMore = useCallback(() => {
    if (isFetchingRef.current) return;
    if (!hasMore) return;
    fetchStudents({ page: currentPage + 1, append: true });
  }, [fetchStudents, hasMore, currentPage]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    setMonths(buildMonthCatalog(students));
  }, [students]);

  const fetchDormStudents = useCallback(async (searchValue = "") => {
    try {
      const sanitizedQuery = (searchValue ?? "").trim();
      const baseUrl = endpoints.GET_DORM_STUDENTS;
      const requestUrl = sanitizedQuery
        ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}q=${encodeURIComponent(
            sanitizedQuery
          )}`
        : baseUrl;

      const response = await api.get(requestUrl);
      const fetchedDormStudents = response.data?.students || [];

      setDormStudents(fetchedDormStudents);
    } catch (fetchError) {
      console.error("Error fetching dorm students:", fetchError);
      setDormStudents([]);
    }
  }, []);

  useEffect(() => {
    fetchDormStudents(dormQuery);
  }, [dormQuery, fetchDormStudents]);

  const monthOptions = useMemo(() => months, [months]);

  const recordPayment = useCallback(
    async ({ studentId, purpose, amount, method, isRefund = false }) => {
      try {
        const response = await api.post(endpoints.CREATE_PAYMENT, {
          student_id: studentId,
          purpose,
          amount,
          method,
          is_refund: isRefund,
        });

        if (response.data?.ok) {
          await refresh();
          return { ok: true };
        }

        return {
          ok: false,
          message: response.data?.message || "Failed to record payment.",
        };
      } catch (error) {
        console.error("Payment submission error:", error);
        return {
          ok: false,
          message: "An error occurred while saving payment.",
        };
      }
    },
    [refresh]
  );

  return {
    students,
    months: monthOptions,
    dormStudents,
    meta,
    loading,
    loadingMore,
    error,
    billings,

    hasMore,
    refresh,
    loadMore,
    setStudents,
    recordPayment,
    query,
    setQuery,
    dormQuery,
    setDormQuery,
  };
};

export default useStudentPayments;
