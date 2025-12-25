import React from "react";
import TableCell from "./TableCell";
import BillingCheckBox from "./BillingCheckBox";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const fullName = (st) =>
  [st?.first_name, st?.last_name].filter(Boolean).join(" ") ||
  st?.name ||
  st?.full_name ||
  "Unnamed";

const studentHasBillingCode = (student, code) => {
  if (!code) return false;
  if (!Array.isArray(student?.billings)) return false;
  return student.billings.some((billing) => billing?.code === code);
};

function TableRow({
  student,
  billingCodes = [],
  pendingAssignments = {},
  onToggleBilling,
  rowIndex = 0,
  getAllowedTuitionAmount,
  extractTuitionAmountFromCode,
}) {
  const studentId = student.student_id ?? student.id;
  const classPair = student?.group?.class_pair || "-";
  const zebra = rowIndex % 2 === 1 ? "bg-gray-50/60" : "bg-white";

  return (
    <tr className={cn("divide-x divide-gray-100", zebra)}>
      <TableCell className="font-medium text-gray-900">
        {fullName(student)}
      </TableCell>
      <TableCell className="text-gray-700">{classPair}</TableCell>
      {billingCodes.map((code) => {
        const tuitionAmount = extractTuitionAmountFromCode(code);
        const allowedAmount = getAllowedTuitionAmount(student);
        const isTuitionCode = tuitionAmount !== null;
        const baseDisabled = isTuitionCode && tuitionAmount !== allowedAmount;
        const checked = studentHasBillingCode(student, code);

        const pendingKey = `${studentId}-${code}`;
        const hasPending = Object.prototype.hasOwnProperty.call(
          pendingAssignments,
          pendingKey
        );
        const pendingValue = pendingAssignments[pendingKey];
        const effectiveChecked =
          typeof pendingValue === "boolean" ? pendingValue : checked;
        const isDisabled = hasPending || (baseDisabled && !checked);

        return (
          <TableCell key={`${studentId}-${code}`} className="text-center">
            <BillingCheckBox
              checked={effectiveChecked}
              disabled={isDisabled}
              onChange={(value) => onToggleBilling?.(student, code, value)}
              title={
                baseDisabled ? "Tuition amount locked for this class" : code
              }
            />
          </TableCell>
        );
      })}
    </tr>
  );
}

export default TableRow;
