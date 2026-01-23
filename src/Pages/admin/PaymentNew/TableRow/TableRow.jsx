import React, { useEffect, useMemo, useState } from "react";
import TableCell from "../TableCell/TableCell";
import { monthsOptions } from "../Filters/MonthsToFilter";
import { useGlobalContext } from "../../../../Hooks/UseContext";
import DiscountModule from "../TableModules/DiscountModule";
import TotalPaidModule from "../TableModules/TotalPaidModule";
import InvoiceModule from "../TableModules/InvoiceModule";
import { api } from "../../../../Library/RequestMaker";
import toast from "react-hot-toast";

function TableRow({ student, onAddPayment, showDiscounts = true, months }) {
  const { normalizeDiscounts, normalizeInvoices, selectedPurpose } =
    useGlobalContext();
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeMonthKey, setActiveMonthKey] = useState(null);
  const [fullName, setFullName] = useState(student.full_name || "");

  useEffect(() => {
    setFullName(student.full_name || "");
  }, [student.full_name]);

  const discountsDisplay = normalizeDiscounts(student.discounts);

  const billingCodeById = useMemo(() => {
    const map = new Map();
    if (Array.isArray(student?.billings)) {
      student.billings.forEach((b) => {
        if (b?.id && b?.code) map.set(b.id, b.code);
      });
    }
    return map;
  }, [student]);

  const purposeFilter = useMemo(() => {
    if (selectedPurpose === "course") {
      return (code) => typeof code === "string" && code.startsWith("course/");
    }
    if (selectedPurpose === "dorm") {
      return (code) => typeof code === "string" && code.startsWith("dorm/");
    }
    return null; // tuition or default: no filtering
  }, [selectedPurpose]);

  const filteredInvoices = useMemo(() => {
    const list = Array.isArray(student?.invoices) ? student.invoices : [];
    if (!purposeFilter) return list;

    return list.filter((inv) => {
      const code =
        inv?.billing?.code || billingCodeById.get(inv?.billing_id) || null;
      return purposeFilter(code);
    });
  }, [student, purposeFilter, billingCodeById]);

  const invoiceStatus = useMemo(
    () => normalizeInvoices(filteredInvoices),
    [filteredInvoices, normalizeInvoices],
  );

  const isCourse = selectedPurpose === "course";
  const isDorm = selectedPurpose === "dorm";

  const walletBalance =
    student.wallet_balance ?? student.wallet?.balance ?? "-";

  const monthsToRender =
    Array.isArray(months) && months.length > 0 ? months : monthsOptions;

  const handleFullNameChange = async (e) => {
    const newName = e.target.value.trim();
    setFullName(newName);

    const studentId = student.student_id ?? student.id;
    if (!studentId) return;
    if (newName === (student.full_name || "")) return;

    try {
      await api.patch(`/students/${studentId}`, { full_name: newName });
      toast.success("Full name updated successfully");
    } catch (error) {
      console.error("Failed to update student name", error);
      setFullName(student.full_name || "");
      toast.error("Failed to update full name");
    }
  };

  return (
    <>
      <tr
        className={
          `hover:bg-gray-50` +
          (student.status === "inactive" || student.status === "deactivated"
            ? " bg-red-50 "
            : "")
        }
      >
        <td
          className={
            `sticky left-0 z-10 w-16 min-w-16 max-w-16 border-b px-3 py-1 font-medium text-gray-900 ` +
            (student.status === "inactive" || student.status === "deactivated"
              ? "bg-red-50"
              : "bg-white")
          }
        >
          {student.student_id}
        </td>
        <td
          className={
            `sticky left-16 z-10 w-56 min-w-56 max-w-56 border-b px-1 py-1 font-medium ` +
            (student.status === "inactive" || student.status === "deactivated"
              ? "bg-red-50"
              : "bg-white text-gray-900")
          }
        >
          <input
            className={
              `flex w-full rounded-md px-1 py-0.5 ` +
              (student.status === "inactive" || student.status === "deactivated"
                ? "bg-red-50  placeholder-red-400 border-red-200"
                : "bg-white text-gray-900 border-gray-200")
            }
            type="text"
            onBlur={handleFullNameChange}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </td>
        <td className="px-3 py-1 border w-24 min-w-24 max-w-24">
          {student.group?.class_pair || "-"}
        </td>
        <td className="px-3 py-1 border w-32 min-w-32 max-w-32">
          {student.group?.teacher_name || "-"}
        </td>
        {showDiscounts ? (
          <td className="px-3 py-1 border text-center w-18 min-w-18 max-w-18">
            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              className={`w-full rounded-lg px-2 py-1 text-sm font-medium transition
    ${
      discountsDisplay
        ? "bg-green-100 text-green-700 hover:bg-green-200"
        : "bg-gray-100 text-gray-400 cursor-not-allowed"
    }
  `}
            >
              {discountsDisplay || "—"}
            </button>
          </td>
        ) : null}
        {monthsToRender.map((m) => {
          const monthHasInvoice = Boolean(invoiceStatus[m.key]);
          const cellValue =
            invoiceStatus[m.key] ||
            (isCourse || isDorm ? { status: "N/A" } : undefined);

          return (
            <TableCell
              key={m.key}
              value={cellValue}
              onClick={() => {
                if (!monthHasInvoice) return;
                setActiveMonthKey(m.key);
                setShowInvoiceModal(true);
              }}
            />
          );
        })}
        <td className="px-3 py-1 border text-right font-semibold text-gray-900 w-18 min-w-18 max-w-18">
          <button
            type="button"
            onClick={() => setShowWalletModal(true)}
            className="w-full rounded-lg px-2 py-1 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {walletBalance}
          </button>
        </td>
        <td className="px-3 py-1 border text-center">
          <button
            type="button"
            onClick={() => onAddPayment?.(student)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
            aria-label="Add payment"
          >
            +
          </button>
        </td>
      </tr>
      <DiscountModule
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        discounts={student.discounts || []}
        studentName={student.full_name}
      />
      <TotalPaidModule
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        payments={student.payments || []}
        studentName={student.full_name}
        walletBalance={walletBalance}
      />
      <InvoiceModule
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        student={student}
        monthKey={activeMonthKey}
      />
    </>
  );
}

export default TableRow;
