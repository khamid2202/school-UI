import React, { useState, useEffect, useCallback } from "react";
import TuitionPayments from "./TuitionPayments";
import { DormPayments } from "./DormPayments";
import { OtherPayments } from "./OtherPayments";
import { api } from "../../../Library/RequestMaker";
import { endpoints } from "../../../Library/Endpoints";

const MONTH_NAMES = [
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

//Comment: This is a helper function to sort the months, used to keep months in chronological order
const sortMonthEntries = (entries) =>
  entries.slice().sort((a, b) => {
    const yearA = typeof a.year === "number" ? a.year : null;
    const yearB = typeof b.year === "number" ? b.year : null;

    if (yearA !== yearB) {
      if (yearA === null) return 1;
      if (yearB === null) return -1;
      return yearA - yearB;
    }

    const monthA = typeof a.month === "number" ? a.month : null;
    const monthB = typeof b.month === "number" ? b.month : null;

    if (monthA !== monthB) {
      if (monthA === null) return 1;
      if (monthB === null) return -1;
      return monthA - monthB;
    }

    return (a.label || "").localeCompare(b.label || "");
  });

const mergeMonths = (existing = [], incoming = []) => {
  if (!incoming.length) {
    return existing;
  }

  const monthMap = new Map();

  existing.forEach((month) => {
    if (!month) return;
    const key = month.key || month.label;
    if (!key) return;
    monthMap.set(key, month);
  });

  incoming.forEach((month) => {
    if (!month) return;
    const key = month.key || month.label;
    if (!key) return;
    const prev = monthMap.get(key) || {};
    monthMap.set(key, { ...prev, ...month });
  });

  return sortMonthEntries(Array.from(monthMap.values()));
};

//Comment: This is a helper function to merge students, avoiding duplicates based on student ID
const mergeStudents = (existing = [], incoming = []) => {
  if (!incoming.length) {
    return existing;
  }

  const merged = existing.slice();
  const indexById = new Map();

  merged.forEach((student, index) => {
    if (!student) return;
    const key = student.id ?? student.student_id;
    if (key === undefined || key === null) return;
    indexById.set(key, index);
  });

  incoming.forEach((student) => {
    if (!student) return;
    const key = student.id ?? student.student_id;
    if (key === undefined || key === null) {
      return;
    }

    if (indexById.has(key)) {
      const existingIndex = indexById.get(key);
      const previous = merged[existingIndex] || {};
      merged[existingIndex] = {
        ...previous,
        ...student,
        payments: student.payments ?? previous.payments,
        wallet_balance:
          student.wallet_balance ?? previous.wallet_balance ?? null,
        wallet_currency:
          student.wallet_currency ?? previous.wallet_currency ?? null,
      };
    } else {
      indexById.set(key, merged.length);
      merged.push(student);
    }
  });

  return merged;
};

//Comment: This is a helper function to normalize student data with their payments
const normalizeStudentsWithPayments = (students = []) => {
  const monthMap = new Map();

  const normalized = students
    .map((student, index) => {
      if (!student) return null;

      const id = student.id ?? student.student_id ?? index;

      const classPair = student.group?.class_pair || student.class_pair || "";

      const paymentsList = Array.isArray(student.payments)
        ? student.payments
        : [];

      const walletInfo = student.wallet || {};
      const walletBalance = (() => {
        const value =
          student.wallet_balance ??
          walletInfo.balance ??
          walletInfo.amount ??
          student.walletBalance ??
          null;
        if (value === null || value === undefined) return null;
        const numeric = Number(value);
        return Number.isNaN(numeric) ? null : numeric;
      })();

      const walletCurrency =
        student.wallet_currency ??
        walletInfo.currency ??
        walletInfo.currency_code ??
        null;

      const paymentsByMonth = paymentsList.reduce((acc, payment) => {
        if (!payment) return acc;
        const rawMonth = Number(payment.month);
        if (!rawMonth || Number.isNaN(rawMonth)) return acc;

        const rawYear = payment.year ? Number(payment.year) : null;
        const monthName = MONTH_NAMES[rawMonth - 1] || `Month ${rawMonth}`;
        const keyYear = rawYear ?? "unknown";
        const key = `${keyYear}-${String(rawMonth).padStart(2, "0")}`;
        const label = rawYear ? `${monthName} ${rawYear}` : monthName;

        if (!monthMap.has(key)) {
          monthMap.set(key, {
            key,
            label,
            month: rawMonth,
            year: rawYear,
            monthName,
          });
        }

        acc[key] = {
          ...payment,
          key,
          label,
          status:
            payment.status ||
            (Number(payment.remaining_amount) <= 0 ? "Paid" : "Not Paid"),
        };
        return acc;
      }, {});

      const fullName =
        student.full_name ||
        student.name ||
        [student.first_name, student.last_name].filter(Boolean).join(" ") ||
        "";

      return {
        ...student,
        id,
        student_id: student.student_id ?? id,
        full_name: fullName,
        class_pair: classPair,
        payments: paymentsByMonth,
        wallet_balance: walletBalance,
        wallet_currency: walletCurrency,
      };
    })
    .filter(Boolean);

  const months = sortMonthEntries(Array.from(monthMap.values()));

  return { students: normalized, months };
};

export const Payments = () => {
  const [tab, setTab] = useState("tuition");
  const [students, setStudents] = useState([]);
  const [months, setMonths] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalLoaded, setTotalLoaded] = useState(0);

  const fetchStudentsWithPayments = useCallback(
    async (page = 1, { append = false } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setHasMore(true);
      }

      setError(null);

      try {
        const response = await api.get(endpoints.GET_STUDENT_WITH_PAYMENTS, {
          page,
        });

        const payload = response?.data || {};
        const rawStudents = payload.students || [];
        const { students: normalizedStudents, months: derivedMonths } =
          normalizeStudentsWithPayments(rawStudents);

        let snapshot = [];

        setStudents((prev) => {
          const merged = append
            ? mergeStudents(prev, normalizedStudents)
            : normalizedStudents;
          snapshot = merged;
          return merged;
        });

        setTotalLoaded(snapshot.length);

        setMonths((prev) =>
          append ? mergeMonths(prev, derivedMonths) : derivedMonths
        );

        const metaData = payload.meta || null;
        setMeta(metaData);

        const resolvedPage = Number(metaData?.page) || page;
        setCurrentPage(resolvedPage);

        const total = Number(metaData?.total) || null;
        const limit = Number(metaData?.limit) || Number(metaData?.count) || 0;
        const count = Number(metaData?.count) || normalizedStudents.length;

        let nextHasMore;

        if (total && limit) {
          nextHasMore = resolvedPage * limit < total;
        } else if (total && count) {
          nextHasMore = resolvedPage * count < total;
        } else {
          nextHasMore = normalizedStudents.length > 0;
        }

        if (!normalizedStudents.length && append) {
          nextHasMore = false;
        }

        setHasMore(nextHasMore);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load data.";
        setError(message);
        console.error("Failed to fetch students with payments:", err);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchStudentsWithPayments();
  }, [fetchStudentsWithPayments]);

  const metaPage = meta?.page;

  const loadMoreStudents = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = (Number(metaPage) || currentPage) + 1;
    fetchStudentsWithPayments(nextPage, { append: true });
  }, [
    hasMore,
    loading,
    loadingMore,
    metaPage,
    currentPage,
    fetchStudentsWithPayments,
  ]);

  const handleRefresh = useCallback(() => {
    fetchStudentsWithPayments(1, { append: false });
  }, [fetchStudentsWithPayments]);

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "tuition" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTab("tuition")}
          >
            Tuition
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "dorm" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTab("dorm")}
          >
            Dorm
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "other" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTab("other")}
          >
            Other
          </button>
        </div>

        <div>
          {tab === "tuition" && (
            <TuitionPayments
              students={students}
              setStudents={setStudents}
              months={months}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={totalLoaded}
              hasMore={hasMore}
              onRefresh={handleRefresh}
              onLoadMore={loadMoreStudents}
            />
          )}
          {tab === "dorm" && (
            <DormPayments
              students={students}
              setStudents={setStudents}
              months={months}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              hasMore={hasMore}
              onRefresh={handleRefresh}
              onLoadMore={loadMoreStudents}
            />
          )}
          {tab === "other" && (
            <OtherPayments
              students={students}
              setStudents={setStudents}
              months={months}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              hasMore={hasMore}
              onRefresh={handleRefresh}
              onLoadMore={loadMoreStudents}
            />
          )}
        </div>
      </div>
    </div>
  );
};
