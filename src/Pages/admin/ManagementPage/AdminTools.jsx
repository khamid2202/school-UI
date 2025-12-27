import React from "react";
import { Link } from "react-router-dom";

function AdminTools() {
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Jump to invoices or discounts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* <Link
            to="/management/invoices"
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Invoices
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure billing and invoice assignments.
                </p>
              </div>
              <span className="text-blue-600 font-medium opacity-0 transition group-hover:opacity-100">
                →
              </span>
            </div>
          </Link> */}

          <Link
            to="/management/discounts"
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Discounts
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage discounts and related rules.
                </p>
              </div>
              <span className="text-blue-600 font-medium opacity-0 transition group-hover:opacity-100">
                →
              </span>
            </div>
          </Link>
          <Link
            to="/management/invoivces-2.0"
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Invoivces 2.0
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  New invoivces management page.
                </p>
              </div>
              <span className="text-blue-600 font-medium opacity-0 transition group-hover:opacity-100">
                →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminTools;
