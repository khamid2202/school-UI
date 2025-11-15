import React, { useEffect, useMemo, useRef, useState } from "react";
import PaymentModule from "./PaymentModule";

function PaymentsTable({
  students = [],
  months = [],
  loading = false,
  loadingMore = false,
  error = "",
  hasMore = false,
  onLoadMore,
  recordPayment,
  billings = [],
  paymentPurposes = [],
}) {
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentPurpose, setPaymentPurpose] = useState("");
  const [paymentPurposeLabel, setPaymentPurposeLabel] = useState("");
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "cash",
    date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const sentinelRef = useRef(null);
  const allowedPurposeSet = useMemo(() => {
    if (!Array.isArray(paymentPurposes) || !paymentPurposes.length) {
      return null;
    }
    return new Set(paymentPurposes);
  }, [paymentPurposes]);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !onLoadMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || loadingMore || !hasMore) return;
        onLoadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  const resolvePurposeForStudent = (student) => {
    if (!student) return { code: "", amount: "", description: "" };

    const allowed = allowedPurposeSet;

    const findMatch = (items, codeKey = "code") => {
      if (!Array.isArray(items)) return null;
      return (
        items.find((item) => {
          const code = item?.[codeKey];
          if (!code || typeof code !== "string") return false;
          if (allowed && !allowed.has(code)) return false;
          return true;
        }) || null
      );
    };

    const billingMatch =
      findMatch(student.billings, "code") ||
      findMatch(student.payments, "billing_code");

    let code = "";
    let amount = "";
    let description = "";

    if (billingMatch) {
      code = billingMatch.code || billingMatch.billing_code || "";

      const rawAmount =
        billingMatch.amount ??
        billingMatch.total_required_amount ??
        (typeof billingMatch.required_amount === "number"
          ? billingMatch.required_amount
          : undefined);
      if (rawAmount !== undefined && rawAmount !== null && rawAmount !== "") {
        amount = String(Number(rawAmount));
      }

      description =
        billingMatch.description ||
        billingMatch.title ||
        billingMatch.name ||
        "";
    }

    if (!code && Array.isArray(student.billings) && student.billings.length) {
      code = student.billings[0].code || "";
    }

    if (!code && allowed && allowed.size === 1) {
      const [fallbackCode] = Array.from(allowed);
      code = fallbackCode || "";
    }

    if (!amount && code) {
      const parts = code.split("/");
      if (parts.length > 1 && Number(parts[1])) {
        amount = String(Number(parts[1]));
      }
    }

    if (
      (amount === "" || description === "") &&
      code &&
      Array.isArray(billings)
    ) {
      const billingFromList = billings.find(
        (item) => item?.code && item.code === code
      );
      if (billingFromList) {
        if (amount === "" && billingFromList.amount !== undefined) {
          amount = String(Number(billingFromList.amount));
        }
        description =
          billingFromList.description || billingFromList.title || "";
      }
    }

    return { code, amount, description };
  };

  const handleOpenPayment = (student) => {
    const { code, amount, description } = resolvePurposeForStudent(student);
    const requiredAmount = amount || "";

    setSelectedStudent(student);
    setPaymentPurpose(code || "");
    setPaymentPurposeLabel(description || "");
    setPaymentData({
      amount: requiredAmount,
      method: "cash",
      date: new Date().toISOString().split("T")[0], // default today
    });

    setOpenPayment(true);
  };

  const handleClosePayment = () => {
    setOpenPayment(false);
    setSelectedStudent(null);
    setPaymentPurpose("");
    setPaymentPurposeLabel("");
    setErrorMsg("");
  };

  //handle payment is here
  const handleSubmitPayment = async (event) => {
    event.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    setErrorMsg("");

    const amount = Number(paymentData.amount);
    const isRefund = amount < 0;

    if (!recordPayment) {
      setErrorMsg("Payment submission is currently unavailable.");
      setSubmitting(false);
      return;
    }

    const result = await recordPayment({
      studentId: selectedStudent.id || selectedStudent.student_id,
      purpose: paymentPurpose || paymentPurposes[0] || "",
      amount,
      method: paymentData.method,
      isRefund,
    });

    if (result.ok) {
      handleClosePayment();
    } else {
      setErrorMsg(result.message || "Failed to record payment.");
    }

    setSubmitting(false);
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

        if (allowedPurposeSet) {
          const code = payment.billing_code || payment.code || payment.purpose;
          if (!code || !allowedPurposeSet.has(code)) {
            return false;
          }
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
              {months.map((month) => (
                <th
                  key={month.key}
                  className={`border px-3 py-2 ${MONTH_CELL_CLASSES}`}
                >
                  {month.label}
                </th>
              ))}
              <th className="border px-3 py-2">Amount</th>
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
              const { amount: dueAmount } = resolvePurposeForStudent(student);

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
                  {months.map((month) => {
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
                    <button
                      onClick={() => handleOpenPayment(student)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      {/* data comes as 2600.00, need to convert to 2600 */}
                      {dueAmount ? Math.floor(Number(dueAmount)) : "Pay"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/********************  mobile view **********************/}

      <div className="space-y-4 md:hidden">
        {students.map((student, index, amount) => {
          const studentId =
            student.id ?? student.student_id ?? student.user_id ?? index;
          const classLabel =
            student.class_pair ||
            student.group?.class_pair ||
            student.group?.class_pair_compact ||
            "—";
          const { amount: dueAmount } = resolvePurposeForStudent(student);

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

              {months.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase text-gray-500">Months</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {months.map((month) => {
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
                <button
                  onClick={() => handleOpenPayment(student)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  {/* data comes as 2600.00, need to convert to 2600 */}
                  {dueAmount ? Math.floor(Number(dueAmount)) : "Pay"}
                </button>
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
          purpose={paymentPurpose}
          purposeLabel={paymentPurposeLabel}
          onClose={handleClosePayment}
          onChange={handleChangePayment}
          onSubmit={handleSubmitPayment}
        />
      )}
    </div>
  );
}

export default PaymentsTable;
