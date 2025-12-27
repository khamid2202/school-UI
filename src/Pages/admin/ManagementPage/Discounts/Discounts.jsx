import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../../../Library/RequestMaker";
import { endpoints } from "../../../../Library/Endpoints";
import { useGlobalContext } from "../../../../Hooks/UseContext";

const normalizeDiscount = (d = {}) => ({
  id: d.id ?? d.discount_id ?? d.uuid,
  student_id: d.student_id,
  student_name:
    d.student_name ||
    d.student_full_name ||
    d.full_name ||
    d.student?.full_name ||
    d.student?.name,
  name: d.name,
  reason: d.reason,
  percent: d.percent,
  status: d.status,
  created_at: d.created_at,
  start_date: d.start_date,
  end_date: d.end_date,
  student_group_id: d.student_group_id,
  billing_id: d.billing_id,
});

function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({
    student_group_id: "",
    billing_id: "",
    // student_id: "",
    name: "",
    reason: "",
    percent: "",
    start_date: "",
    end_date: "",
  });

  const { billings = [] } = useGlobalContext();

  const billingOptions = useMemo(
    () =>
      billings.map((b) => ({
        id: b?.id,
        code: b?.code,
        label: b?.code || `Billing ${b?.id}`,
      })),
    [billings]
  );
  // console.log("Billing options:", billingOptions);

  const billingById = useMemo(() => {
    const map = new Map();
    billings.forEach((b) => {
      if (b?.id) map.set(b.id, b);
    });
    return map;
  }, [billings]);

  const activeDiscounts = useMemo(
    () => discounts.filter((d) => d.status !== "inactive"),
    [discounts]
  );

  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.DISCOUNTS);
      const payload = Array.isArray(res?.data?.discounts)
        ? res.data.discounts
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setDiscounts(payload.map(normalizeDiscount));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const searchStudents = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await api.get(endpoints.GET_ALL_STUDENTS_FOR_PAYMENTS, {
        q: query.trim(),
        // limit: 10,
      });
      const payload = Array.isArray(res?.data?.students)
        ? res.data.students
        : Array.isArray(res?.data)
        ? res.data
        : [];

      console.log("Search results:", payload);
      setSearchResults(payload);
    } catch (err) {
      setSearchError(
        err?.response?.data?.message || "Failed to search students"
      );
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  //HANDLE CREATE DISCOUNT
  const handleCreate = async (e) => {
    e.preventDefault();
    // const studentIdNum = Number(form.student_id);
    const studentGroupIdNum = Number(form.student_group_id);
    const billingIdNum = Number(form.billing_id);
    const percentNum = form.percent === "" ? undefined : Number(form.percent);

    if (!form.name.trim()) {
      toast.error("Tuition name is required");
      return;
    }

    if (!studentGroupIdNum || !billingIdNum) {
      toast.error("student_group_id and billing_id are required");
      return;
    }

    if (!form.start_date || !form.end_date) {
      toast.error("start_date and end_date are required");
      return;
    }

    if (percentNum !== undefined && (percentNum < 1 || percentNum > 100)) {
      toast.error("percent must be between 1 and 100");
      return;
    }

    if (new Date(form.start_date) > new Date(form.end_date)) {
      toast.error("start_date cannot be after end_date");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(endpoints.DISCOUNTS, {
        student_group_id: studentGroupIdNum,
        billing_id: billingIdNum,
        name: form.name.trim(),
        reason: form.reason.trim() || undefined,
        percent: percentNum,
        start_date: form.start_date,
        end_date: form.end_date,
      });

      toast.success("Discount created");
      setForm({
        student_group_id: "",
        billing_id: "",
        name: "",
        reason: "",
        percent: "",
        start_date: "",
        end_date: "",
      });
      console.log("Created discount", form);
      fetchDiscounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (discount) => {
    const discountId = discount?.id ?? discount?.discount_id ?? discount?.uuid;
    if (!discountId) {
      toast.error("Missing discount id");
      return;
    }
    try {
      await api.delete(`${endpoints.DISCOUNTS}/${discountId}`);
      toast.success("Discount deactivated");
      setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate");
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
          <h1 className="text-2xl font-semibold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage student discounts.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px,1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              New discount
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Find student
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchStudents(searchQuery);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search by full name"
                    />
                    <button
                      type="button"
                      onClick={() => searchStudents(searchQuery)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Search
                    </button>
                  </div>

                  {searchError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {searchError}
                    </div>
                  )}

                  {searching ? (
                    <div className="text-sm text-gray-500">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Enter a name to search for a student.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((s) => (
                        <button
                          key={s.student_id || s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setForm((prev) => ({
                              ...prev,
                              student_id: s.student_id ?? s.id ?? "",
                              student_group_id: s.student_group_id ?? "-",
                            }));
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="font-medium text-gray-900">
                            {s.full_name || s.name || s.first_name || "Unnamed"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {s.student_id ?? s.id ?? "-"} · Class:{" "}
                            {s.group?.class_pair || s.group?.name || "-"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStudent && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Assign discount
                    </h3>
                    <form className="mt-3 space-y-4" onSubmit={handleCreate}>
                      <div>
                        <label className="text-sm text-gray-700">
                          Student group ID *
                        </label>
                        <input
                          type="number"
                          name="student_group_id"
                          value={form.student_group_id}
                          onChange={handleChange}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-spin"
                          placeholder="Student group ID"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-700">
                          Discount name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Discount name"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-700">
                          Billing *
                        </label>
                        <select
                          name="billing_id"
                          value={form.billing_id}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="" disabled>
                            Select billing
                          </option>
                          {billingOptions.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-700">Percent</label>
                        <input
                          type="number"
                          name="percent"
                          value={form.percent}
                          onChange={handleChange}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-spin"
                          placeholder="15"
                          min={1}
                          max={100}
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-700">Reason</label>
                        <input
                          type="text"
                          name="reason"
                          value={form.reason}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="for good performance"
                          minLength={3}
                          maxLength={255}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm text-gray-700">
                            Start date *
                          </label>
                          <input
                            type="date"
                            name="start_date"
                            value={form.start_date}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">
                            End date *
                          </label>
                          <input
                            type="date"
                            name="end_date"
                            value={form.end_date}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Saving..." : "Create discount"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Active discounts
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {activeDiscounts.length}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchDiscounts}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-sm text-gray-500">Loading...</div>
            ) : activeDiscounts.length === 0 ? (
              <div className="mt-6 text-sm text-gray-500">
                No discounts yet.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2 text-left">SGID</th>
                      <th className="px-3 py-2 text-left">Billing</th>
                      <th className="px-3 py-2 text-left">Percent</th>
                      <th className="px-3 py-2 text-left">Reason</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeDiscounts.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {d.student_name || "Unnamed"}
                            </span>
                            {/* <span className="text-xs text-gray-500"></span> */}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {d.student_group_id || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {billingById.get(d.billing_id)?.code ||
                            d.billing_id ||
                            "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {d.percent ? `${d.percent}%` : "0%"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {d.reason || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {d.status || "active"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(d)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Discounts;
