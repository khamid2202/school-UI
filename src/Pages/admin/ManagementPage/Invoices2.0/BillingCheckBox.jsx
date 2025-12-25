import React from "react";

function BillingCheckBox({
  checked = false,
  disabled = false,
  onChange,
  title,
}) {
  return (
    <input
      type="checkbox"
      className="size-5 rounded border-gray-300 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      checked={checked}
      disabled={disabled}
      title={title}
      onChange={(event) => onChange?.(event.target.checked)}
    />
  );
}

export default BillingCheckBox;
