import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../Library/RequestMaker";
import { endpoints } from "../../../Library/Endpoints";
import PaymentModule from "./Paymentmodule";

function PaymentsTable() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);
  const [months, setMonths] = useState([]);
  const [monthNames, setMonthNames] = useState([]);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "cash",
    date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  const getStudentKey = (student) => {
    const key = student?.id ?? student?.student_id ?? student?.user_id ?? null;
    return key !== null && key !== undefined ? String(key) : null;
  };

  const resolveCurrentPage = (metaData, fallback) => {
    if (!metaData || typeof metaData !== "object") return fallback;
    if (typeof metaData.current_page === "number") return metaData.current_page;
    if (typeof metaData.page === "number") return metaData.page;
    if (
      typeof metaData.offset === "number" &&
      typeof metaData.limit === "number"
    ) {
      return Math.floor(metaData.offset / metaData.limit) + 1;
    }
    return fallback;
  };

  const computeHasMore = (metaData, fetchedLength) => {
    if (!metaData || typeof metaData !== "object") {
      return fetchedLength > 0;
    }

    if (Object.prototype.hasOwnProperty.call(metaData, "next_page_url")) {
      return Boolean(metaData.next_page_url);
    }

    if (
      typeof metaData.current_page === "number" &&
      typeof metaData.last_page === "number"
    ) {
      return metaData.current_page < metaData.last_page;
    }

    if (
      typeof metaData.page === "number" &&
      typeof metaData.total_pages === "number"
    ) {
      return metaData.page < metaData.total_pages;
    }

    if (
      typeof metaData.offset === "number" &&
      typeof metaData.limit === "number" &&
      typeof metaData.total === "number"
    ) {
      return metaData.offset + metaData.limit < metaData.total;
    }

    if (
      typeof metaData.end_index === "number" &&
      typeof metaData.total === "number"
    ) {
      return metaData.end_index < metaData.total;
    }

    return fetchedLength > 0;
  };

  const mergeStudents = (existing, incoming) => {
    if (!existing.length) return incoming;

    const indexById = new Map();
    const merged = [...existing];

    merged.forEach((student, index) => {
      const key = getStudentKey(student);
      if (key !== null) {
        indexById.set(key, index);
      }
    });

    incoming.forEach((student) => {
      const key = getStudentKey(student);
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

  const loadStudents = useCallback(
    async (pageToLoad = 1, { append = false } = {}) => {
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
        const response = await api.get(endpoints.GET_STUDENT_WITH_PAYMENTS, {
          page: pageToLoad,
        });

        const fetchedStudents = response.data?.students || [];
        const metaData = response.data?.meta || null;

        setStudents((prev) =>
          append ? mergeStudents(prev, fetchedStudents) : fetchedStudents
        );
        setMeta(metaData);
        if (!append) {
          setError("");
        }

        const resolvedPage = resolveCurrentPage(metaData, pageToLoad);
        setCurrentPage(resolvedPage);

        const moreAvailable = computeHasMore(metaData, fetchedStudents.length);
        setHasMore(moreAvailable);
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
    []
  );

  // Load students with wallet information once on mount.
  useEffect(() => {
    loadStudents(1, { append: false });
  }, [loadStudents]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || loadingMore || !hasMore) return;
        loadStudents(currentPage + 1, { append: true });
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, currentPage, loadStudents, loading, loadingMore]);

  useEffect(() => {
    if (!students.length) {
      setMonths([]);
      setMonthNames([]);
      return;
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

      student.payments.forEach((payment, index) => {
        if (!payment || typeof payment.month !== "number") return;

        const year = payment.year ?? null;
        const key = `${year ?? "na"}-${payment.month}`;

        if (!uniqueMonthMap.has(key)) {
          uniqueMonthMap.set(key, {
            key,
            monthNumber: payment.month,
            year,
          });
        }
      });
    });

    const monthEntries = Array.from(uniqueMonthMap.values());

    if (!monthEntries.length) {
      setMonths([]);
      setMonthNames([]);
      return;
    }

    // Define academic order: September (9) → October (10) → November (11) → December (12) → January (1) → ... → June (6)
    const academicOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

    // Sort months according to academic order, falling back to natural order for unknown months
    const sortedMonths = monthEntries.sort((a, b) => {
      const indexA = academicOrder.indexOf(a.monthNumber);
      const indexB = academicOrder.indexOf(b.monthNumber);

      if (indexA === -1 && indexB === -1) {
        if (a.year === b.year) {
          return a.monthNumber - b.monthNumber;
        }
        return (a.year ?? 0) - (b.year ?? 0);
      }

      if (indexA === -1) return 1; // push unknown months to the end
      if (indexB === -1) return -1;

      if (indexA === indexB) {
        return (a.year ?? 0) - (b.year ?? 0);
      }

      return indexA - indexB;
    });

    const formattedMonthNames = sortedMonths.map((item) => ({
      ...item,
      label:
        monthLabelLookup[item.monthNumber - 1] || `Month ${item.monthNumber}`,
    }));

    setMonths(sortedMonths);
    setMonthNames(formattedMonthNames);
  }, [students]);

  const handleOpenPayment = (student) => {
    console.log("Opening payment module for student:", student);
    const billingCode = student.payments[0]?.billing_code || "";
    const parts = billingCode.split("/");
    const requiredAmount = parts.length > 1 ? parts[1] : "";

    setSelectedStudent(student);
    setPaymentData({
      amount: requiredAmount,
      method: "cash",
      date: new Date().toISOString().split("T")[0], // default today
    });
    // console.log("The payment data is set to:", paymentData);
    setOpenPayment(true);
  };

  const handleClosePayment = () => {
    setOpenPayment(false);
    setSelectedStudent(null);
    setErrorMsg("");
  };

  //handle payment is here
  const handleSubmitPayment = async (event) => {
    event.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const amount = Number(paymentData.amount);
      const isRefund = amount < 0; // refund if negative

      const body = {
        student_id: selectedStudent.id || selectedStudent.student_id,
        purpose: selectedStudent.payments[0]?.billing_code || "NULL",
        amount, // backend can get both negative and positive number
        method: paymentData.method,
        is_refund: isRefund, // tell backend it's a refund
      };

      console.log("Sending payment data:", body);

      const response = await api.post(endpoints.CREATE_PAYMENT, body);

      if (response.data.ok) {
        console.log("Payment success:", response.data);
        setOpenPayment(false);
        await loadStudents(1, { append: false });
      } else {
        setErrorMsg(response.data.message || "Failed to record payment.");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      setErrorMsg("An error occurred while saving payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePayment = (field, value) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  //change months to appropriate names like 1 : January, 2 : February etc.

  const formatWallet = (value) => {
    if (value === null || value === undefined) return "—";
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "—";
    return numeric;
  };

  const resolveWallet = (student) => {
    if (!student) return null;
    if (student.wallet?.uzs !== undefined) return student.wallet.uzs;
  };

  const findPaymentForMonth = (student, monthDescriptor) => {
    if (!student || !Array.isArray(student.payments) || !monthDescriptor) {
      return null;
    }

    return (
      student.payments.find((payment) => {
        if (!payment || typeof payment.month !== "number") return false;
        if (payment.month !== monthDescriptor.monthNumber) return false;

        if (
          monthDescriptor.year !== null &&
          monthDescriptor.year !== undefined &&
          payment.year !== monthDescriptor.year
        ) {
          return false;
        }

        return true;
      }) || null
    );
  };

  const getStatusClasses = (status) => {
    if (!status) return "bg-gray-100 text-gray-500";

    const normalized = String(status).toLowerCase();

    if (
      normalized.includes("not paid") ||
      normalized.includes("unpaid") ||
      normalized.includes("overdue")
    ) {
      return "bg-red-100 text-red-600";
    }

    if (normalized.includes("partial")) {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalized.includes("not full")) {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalized.includes("paid")) {
      return "bg-green-100 text-green-700";
    }

    if (normalized.includes("pending")) {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-600";
  };

  const MONTH_CELL_CLASSES = "w-[101px]  text-center";

  if (loading) {
    return (
      <div className="w-full py-10 text-center text-sm text-gray-500">
        Loading students...
      </div>
    );
  }

  if (error && !students.length) {
    return (
      <div className="w-full py-10 text-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="w-full py-10 text-center text-sm text-gray-500">
        No students found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="hidden overflow-x-auto rounded-md border border-gray-200 bg-white md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border px-3 py-2 ">ID</th>
              <th className="border px-3 py-2 min-w-[200px] whitespace-nowrap">
                Name
              </th>
              <th className="border px-3 py-2 ">Class</th>
              <th className="border px-3 py-2 ">Wallet</th>
              {monthNames.map((month) => (
                <th
                  key={month.key}
                  className={`border px-3 py-2 ${MONTH_CELL_CLASSES}`}
                >
                  {month.label}
                </th>
              ))}
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const studentId =
                student.id ?? student.student_id ?? student.user_id ?? index;
              const classLabel =
                student.class_pair ||
                student.group?.class_pair ||
                student.group?.class_pair_compact ||
                "—";

              return (
                <tr key={studentId} className="hover:bg-gray-50">
                  <td className="justify-center whitespace-nowrap items-center border px-3 py-2">
                    {studentId}
                  </td>
                  <td className="border px-3 py-2 align-middle whitespace-nowrap min-w-[200px]">
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm overflow-hidden text-ellipsis">
                      {student.full_name || student.name || "—"}
                    </div>
                  </td>
                  <td className=" justify-center items-center border px-3 py-2">
                    {classLabel}
                  </td>
                  <td className="justify-center items-center border px-3 py-2 ">
                    {formatWallet(resolveWallet(student))}
                  </td>
                  {monthNames.map((month) => {
                    const paymentForMonth = findPaymentForMonth(student, month);

                    return (
                      <td
                        key={month.key}
                        className={`border px-1 py-1 align-middle ${MONTH_CELL_CLASSES} whitespace-nowrap`}
                      >
                        <div>
                          {paymentForMonth ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-md font-bold ${getStatusClasses(
                                paymentForMonth.status
                              )}`}
                            >
                              {paymentForMonth.status === "Partially Paid"
                                ? "Not Full"
                                : paymentForMonth.status || "Status N/A"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="justify-center items-center border px-3 py-2">
                    {(() => {
                      // get billing_code safely
                      const billingCode =
                        student.billing_code ||
                        student.payments[0]?.billing_code ||
                        "";

                      // split and extract amount after slash
                      const parts = billingCode.split("/");
                      const requiredAmount = parts.length > 1 ? parts[1] : "—";
                      return (
                        <button
                          onClick={() => handleOpenPayment(student)}
                          className="w-full px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          {requiredAmount !== "—"
                            ? requiredAmount
                            : "Required amount"}
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/********************  mobile view **********************/}

      <div className="space-y-4 md:hidden">
        {students.map((student, index) => {
          const studentId =
            student.id ?? student.student_id ?? student.user_id ?? index;
          const classLabel =
            student.class_pair ||
            student.group?.class_pair ||
            student.group?.class_pair_compact ||
            "—";

          return (
            <div
              key={studentId}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <p className="text-xs uppercase text-gray-500">ID</p>
                  <p className="font-medium text-gray-800">{studentId}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Wallet</p>
                  <p className=" font-medium text-gray-800">
                    {formatWallet(resolveWallet(student))}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                <p className="font-medium">
                  {student.full_name || student.name || "—"}
                </p>
                <p className="text-xs uppercase text-gray-500">Class</p>
                <p>{classLabel}</p>
              </div>

              {monthNames.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase text-gray-500">Months</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {monthNames.map((month) => {
                      const paymentForMonth = findPaymentForMonth(
                        student,
                        month
                      );

                      return (
                        <span
                          key={month.key}
                          className="flex flex-col rounded border border-dashed border-gray-300 px-2 py-2 text-xs text-gray-600"
                        >
                          <span className="font-medium text-gray-700">
                            {month.label}
                          </span>
                          <span
                            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(
                              paymentForMonth?.status
                            )}`}
                          >
                            {paymentForMonth?.status ?? "—"}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-row items-center gap-3">
                {(() => {
                  // get billing_code safely
                  const billingCode =
                    student.billing_code ||
                    student.payments[0]?.billing_code ||
                    "";

                  // split and extract amount after slash
                  const parts = billingCode.split("/");
                  const requiredAmount = parts.length > 1 ? parts[1] : "—";
                  return (
                    <button
                      onClick={() => handleOpenPayment(student)}
                      className="w-full px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      {requiredAmount !== "—"
                        ? requiredAmount
                        : "Required amount"}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      <div ref={sentinelRef} className="h-2" />
      {loadingMore && (
        <div className="w-full py-4 text-center text-sm text-gray-500">
          Loading more students...
        </div>
      )}
      {!hasMore && !loadingMore && (
        <div className="w-full py-4 text-center text-xs text-gray-400">
          No more students to load.
        </div>
      )}
      {openPayment && selectedStudent && (
        <PaymentModule
          open={openPayment}
          studentName={
            selectedStudent?.full_name || selectedStudent?.name || ""
          }
          amount={paymentData.amount}
          method={paymentData.method}
          date={paymentData.date}
          error={errorMsg}
          submitting={submitting}
          onClose={handleClosePayment}
          onChange={handleChangePayment}
          onSubmit={handleSubmitPayment}
        />
      )}
    </div>
  );
}

export default PaymentsTable;
