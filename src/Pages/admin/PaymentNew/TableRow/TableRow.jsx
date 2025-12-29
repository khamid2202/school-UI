import React from "react";
import TableCell from "../TableCell/TableCell";

const months = [
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
];

function TableRow({ student }) {
  return (
    <tr className="  hover:bg-gray-50">
      <td className="sticky left-0 z-10  border-b bg-white px-3 py-2 font-medium text-gray-900">
        {student.id}
      </td>
      <td className="sticky left-16 z-10  border-b bg-white px-3 py-2 font-medium text-gray-900">
        {student.fullName}
      </td>
      <td className="px-3 py-2 border ">{student.grade}</td>
      <td className="px-3 py-2 border ">{student.tutor}</td>
      <td className="px-3 py-2 border text-gray-700 ">
        {student.discounts_display || "-"}
      </td>
      {months.map((m) => (
        <TableCell key={m.key} value={student.payments?.[m.key]} />
      ))}
      <td className="px-3 py-2 border text-right font-semibold text-gray-900">
        -
      </td>
    </tr>
  );
}

export default TableRow;
