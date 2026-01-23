import React from "react";

function TableCell({ value, onClick }) {
  const isObject = value && typeof value === "object";

  const normalizedStatus = isObject
    ? String(value.status || "").toLowerCase()
    : "";

  const badgeClasses = (() => {
    if (!isObject) return "bg-gray-100 text-gray-600";
    if (normalizedStatus.includes("not paid")) return "bg-red-100 text-red-600";
    if (normalizedStatus.includes("not full"))
      return "bg-yellow-100 text-yellow-700";
    if (normalizedStatus.includes("paid")) return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  })();

  const display = (() => {
    if (isObject) {
      const label = value.status || "-";
      const isNotFull = normalizedStatus.includes("not full");
      if (isNotFull && Number.isFinite(value.paid)) {
        return value.paid;
      }
      return label;
    }
    return value === 0 || value ? value : "-";
  })();

  return (
    <td className="px-2 py-1 text-center border">
      {isObject ? (
        <button
          onClick={onClick}
          className={`inline-flex min-w-[96px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition hover:brightness-[0.97] ${badgeClasses}`}
        >
          {display}
        </button>
      ) : (
        display
      )}
    </td>
  );
}

export default TableCell;
