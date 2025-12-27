import React from "react";

function TableCell({ value }) {
  const display = value === 0 || value ? value : "-";
  return <td className="px-3 py-2 text-center border">{display}</td>;
}

export default TableCell;
