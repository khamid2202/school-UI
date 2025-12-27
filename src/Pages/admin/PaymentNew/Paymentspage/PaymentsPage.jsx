import React from "react";
import PaymentTable from "../PaymentTable/PaymentTable";
import MonthsToFilter from "../Filters/MonthsToFilter";
import PaymentPurpose from "../Filters/PaymentPurpose";

function PaymentsPage() {
  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-600">2025-2026 academic year</p>
        </div>
      </header>
      <div className="mb-4">
        <PaymentPurpose />
      </div>
      <MonthsToFilter />
      <PaymentTable />
    </div>
  );
}

export default PaymentsPage;
