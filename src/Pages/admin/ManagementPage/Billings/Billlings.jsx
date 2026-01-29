import React, { useEffect, useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";

const normalizeBilling = (b = {}) => ({
  id: b.id,
  code: b.code || "",
  category: b.category || "tuition_fee",
  description: b.description || "",
  amount: b.amount ?? 0,
  is_active: b.is_active ?? true,
  created_at: b.created_at,
  updated_at: b.updated_at,
});

// Lightweight custom select to avoid native dropdowns overlapping adjacent controls.
function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span className="truncate">{current?.label || placeholder}</span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-auto py-1 text-sm text-gray-800">
            <button
              type="button"
              className={`flex w-full items-center px-3 py-2 text-left hover:bg-gray-50 ${
                value === "" ? "bg-gray-50 font-semibold" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onChange("", placeholder);
                setOpen(false);
              }}
            >
              <span className="truncate">{placeholder}</span>
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex w-full items-center px-3 py-2 text-left hover:bg-gray-50 ${
                  value === opt.value ? "bg-gray-50 font-semibold" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value, opt.label);
                  setOpen(false);
                }}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Billings() {
  const [billings, setBillings] = useState([]);
  const [allBillings, setAllBillings] = useState([]); // keeps full set for category options
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const [form, setForm] = useState({
    code: "",
    category: "tuition_fee",
    description: "",
    amount: "",
    is_active: true,
  });

  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      // Backend expects categories as a JSON array string
      if (filterCategory) params.categories = JSON.stringify([filterCategory]);
      if (filterActive !== "") params.is_active = filterActive === "true";

      const res = await api.get(endpoints.GET_BILLINGS, params);
      const payload = Array.isArray(res?.data?.billings)
        ? res.data.billings
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const normalized = payload.map(normalizeBilling);
      setBillings(normalized);

      // Preserve full category list by caching unfiltered results
      const isUnfiltered = !filterCategory && filterActive === "";
      if (isUnfiltered || allBillings.length === 0) {
        setAllBillings(normalized);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load billings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, [filterCategory, filterActive]);

  const filteredBillings = useMemo(() => {
    if (!searchCode.trim()) return billings;
    const q = searchCode.toLowerCase();
    return billings.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q),
    );
  }, [billings, searchCode]);

  const categoryOptions = useMemo(() => {
    const source = allBillings.length ? allBillings : billings;
    const unique = new Map();
    source.forEach((b) => {
      const value = b?.category || "tuition_fee";
      if (!unique.has(value)) unique.set(value, value.replace(/_/g, " "));
    });

    if (unique.size === 0) {
      // Fallback so users can create the first billing even if none exist yet.
      return [{ value: "tuition_fee", label: "tuition fee" }];
    }

    return Array.from(unique.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [allBillings, billings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      code: "",
      category: "tuition_fee",
      description: "",
      amount: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.code.trim()) {
      toast.error("Billing code is required");
      return;
    }
    if (form.code.length > 20) {
      toast.error("Code must be 20 characters or less");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (form.description.length > 300) {
      toast.error("Description must be 300 characters or less");
      return;
    }
    const amountNum = Number(form.amount);
    if (isNaN(amountNum) || amountNum < 0 || amountNum > 1000000) {
      toast.error("Amount must be between 0 and 1,000,000");
      return;
    }
    if (!form.category.trim() || form.category.length > 50) {
      toast.error("Category must be 1-50 characters");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(endpoints.CREATE_BILLING, {
        code: form.code.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        amount: amountNum,
        is_active: form.is_active,
      });

      toast.success("Billing created successfully");
      resetForm();
      fetchBillings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create billing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingId) return;

    if (form.code.trim() && form.code.length > 20) {
      toast.error("Code must be 20 characters or less");
      return;
    }
    if (form.description.trim() && form.description.length > 300) {
      toast.error("Description must be 300 characters or less");
      return;
    }
    const amountNum = form.amount !== "" ? Number(form.amount) : undefined;
    if (
      amountNum !== undefined &&
      (isNaN(amountNum) || amountNum < 0 || amountNum > 1000000)
    ) {
      toast.error("Amount must be between 0 and 1,000,000");
      return;
    }
    if (form.category.trim() && form.category.length > 50) {
      toast.error("Category must be 1-50 characters");
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {};
      if (form.code.trim()) updateData.code = form.code.trim();
      if (form.category.trim()) updateData.category = form.category.trim();
      if (form.description.trim())
        updateData.description = form.description.trim();
      if (amountNum !== undefined) updateData.amount = amountNum;
      updateData.is_active = form.is_active;

      await api.patch(endpoints.UPDATE_BILLING(editingId), updateData);

      toast.success("Billing updated successfully");
      resetForm();
      fetchBillings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update billing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (billing) => {
    setEditingId(billing.id);
    setForm({
      code: billing.code,
      category: billing.category,
      description: billing.description,
      amount: String(billing.amount),
      is_active: billing.is_active,
    });
  };

  const handleDelete = async (billing) => {
    if (
      !confirm(
        `Are you sure you want to delete billing "${billing.code}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.delete(endpoints.DELETE_BILLING(billing.id));
      toast.success("Billing deleted successfully");
      setBillings((prev) => prev.filter((b) => b.id !== billing.id));
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to delete billing";
      if (
        message.toLowerCase().includes("linked") ||
        message.toLowerCase().includes("reference")
      ) {
        toast.error("Cannot delete: this billing is linked to student groups");
      } else {
        toast.error(message);
      }
    }
  };

  const handleToggleActive = async (billing) => {
    try {
      await api.patch(endpoints.UPDATE_BILLING(billing.id), {
        is_active: !billing.is_active,
      });
      toast.success(
        `Billing ${billing.is_active ? "deactivated" : "activated"}`,
      );
      fetchBillings();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update billing status",
      );
    }
  };

  return (
    <div className="p-6">
      <style>{`
        input.no-spin::-webkit-outer-spin-button,
        input.no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spin {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage billing codes and amounts.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px,1fr]">
          {/* Form Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit billing" : "New billing"}
            </h2>
            <form
              onSubmit={editingId ? handleUpdate : handleCreate}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  maxLength={20}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., test-code/amount"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {form.code.length}/20 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter billing description"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {form.description.length}/300 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  min={0}
                  max={1000000}
                  className="no-spin w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 - 1,000,000"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                      ? "Update Billing"
                      : "Create Billing"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Search by code or description"
                className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FilterSelect
                label="Category"
                value={filterCategory}
                options={categoryOptions}
                placeholder="All Categories"
                onChange={(val) => setFilterCategory(val)}
              />
              <FilterSelect
                label="Status"
                value={filterActive}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                placeholder="All Status"
                onChange={(val) => setFilterActive(val)}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
                <p className="mt-2 text-sm text-gray-500">
                  Loading billings...
                </p>
              </div>
            ) : filteredBillings.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-sm text-gray-500">
                  {billings.length === 0
                    ? "No billings found. Create your first billing."
                    : "No billings match your search."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBillings.map((billing) => (
                        <tr
                          key={billing.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {billing.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                              {billing.category.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {billing.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {Number(billing.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleActive(billing)}
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                billing.is_active
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {billing.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(billing)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(billing)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    Showing {filteredBillings.length} of {billings.length}{" "}
                    billings
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billings;
