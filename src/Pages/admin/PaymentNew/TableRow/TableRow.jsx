import React from "react";
import TableCell from "../TableCell/TableCell";
import { monthsOptions } from "../Filters/MonthsToFilter";
import { useGlobalContext } from "../../../../Hooks/UseContext";

function TableRow({ student, onAddPayment, showDiscounts = true, months }) {
  const { normalizeDiscounts, normalizeInvoices } = useGlobalContext();

  const discountsDisplay = normalizeDiscounts(student.discounts);
  const invoiceStatus = normalizeInvoices(student.invoices);

  const walletBalance =
    student.wallet_balance ?? student.wallet?.balance ?? "-";

  const monthsToRender =
    Array.isArray(months) && months.length > 0 ? months : monthsOptions;

  return (
    <tr className="  hover:bg-gray-50">
      <td className="sticky left-0 z-10 w-16 min-w-16 max-w-16 border-b bg-white px-3 py-2 font-medium text-gray-900">
        {student.student_id}
      </td>
      <td className="sticky left-16 z-10 w-56 min-w-56 max-w-56 border-b bg-white px-3 py-2 font-medium text-gray-900">
        {student.full_name}
      </td>
      <td className="px-3 py-2 border w-24 min-w-24 max-w-24">
        {student.group?.class_pair || "-"}
      </td>
      <td className="px-3 py-2 border w-32 min-w-32 max-w-32">
        {student.group?.teacher_name || "-"}
      </td>
      {showDiscounts ? (
        <td className="px-3 py-2 border text-gray-700 w-18 min-w-18 max-w-18">
          <button>{discountsDisplay}</button>
        </td>
      ) : null}
      {monthsToRender.map((m) => (
        <TableCell key={m.key} value={invoiceStatus[m.key]} />
      ))}
      <td className="px-3 py-2 border text-right font-semibold text-gray-900 w-18 min-w-18 max-w-18">
        {walletBalance}
      </td>
      <td className="px-3 py-2 border text-center">
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
  );
}

export default TableRow;
