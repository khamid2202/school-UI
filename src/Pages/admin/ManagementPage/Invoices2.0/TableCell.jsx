import React from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function TableCell({ children, className = "" }) {
  return (
    <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>
  );
}

export default TableCell;
