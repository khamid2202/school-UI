import React, { useEffect, useMemo, useState } from "react";
import { endpoints } from "../../../Library/Endpoints";
import { api } from "../../../Library/RequestMaker";
import { Filter, Search } from "lucide-react";

// minimal className joiner
const cn = (...c) => c.filter(Boolean).join(" ");

function Configuration() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState({});
  const [billings, setBillings] = useState([]);

  // Normalize a student record to a display name
  const fullName = (st) =>
    [st?.first_name, st?.last_name].filter(Boolean).join(" ") ||
    st?.name ||
    st?.full_name ||
    "Unnamed";

  // Build default role map for a given set of billing codes
  const emptyRolesForCodes = (codes) =>
    codes.reduce((acc, c) => ({ ...acc, [c]: false }), {});

  useEffect(() => {
    let ignore = false;
    async function fetchStudents() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(endpoints.STUDENTS_WITH_GROUPS);
        const raw = response?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.students)
          ? raw.students
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        if (!ignore) {
          setStudents(list);
          // roles are initialized once we know billing codes (see effect below)
        }
      } catch (e) {
        if (!ignore)
          setError(
            e?.response?.data?.message || e.message || "Failed to load students"
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchStudents();
    return () => {
      ignore = true;
    };
  }, []);

  // When students or billing codes change, ensure roles state has entries for all
  const billingCodes = useMemo(
    () => billings.map((b) => b?.code).filter(Boolean),
    [billings]
  );

  useEffect(() => {
    if (students.length === 0 || billingCodes.length === 0) return;
    setRoles((prev) => {
      const next = { ...prev };
      for (const st of students) {
        const id = st.id ?? st._id ?? st.uuid ?? fullName(st);
        const existing = next[id] || {};
        // ensure all billing codes exist; preserve already toggled ones
        const merged = { ...emptyRolesForCodes(billingCodes), ...existing };
        next[id] = merged;
      }
      return next;
    });
  }, [students, billingCodes]);

  // get billing codes to render as options
  useEffect(() => {
    let ignore = false;
    async function fetchBillings() {
      try {
        const response = await api.get(endpoints.GET_BILLINGS);
        const raw = response?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.billings)
          ? raw.billings
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        if (!ignore) {
          setBillings(list);
        }
      } catch (e) {
        console.error("Failed to load billings:", e);
      }
    }
    fetchBillings();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query) return students;
    const q = query.toLowerCase();
    return students.filter((st) => {
      const name = fullName(st).toLowerCase();
      const idStr = String(st.id ?? st._id ?? st.uuid ?? "").toLowerCase();
      const clsPair = st?.group?.class_pair || "";
      return (
        name.includes(q) ||
        idStr.includes(q) ||
        String(clsPair).toLowerCase().includes(q)
      );
    });
  }, [students, query]);

  //when clicked get the data of student and key into the array and log it to the console
  const handleClick = (student, key) => {
    console.log("Clicked student:", student);
    console.log("Clicked key:", key);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Search */}
      <div className="flex w-full justify-center">
        <div className="relative w-full sm:w-[620px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name..."
            className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-12 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full size-10 text-gray-600 hover:bg-gray-100"
            aria-label="Filter"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-500 divide-x divide-gray-200">
                {/* Table header will show billing codes as options */}
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Class</th>
                {billings.map((b) => (
                  <th key={b.code} className="px-4 py-3 text-center">
                    {b.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-500"
                    colSpan={2 + billingCodes.length}
                  >
                    Loading students...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-red-600"
                    colSpan={2 + billingCodes.length}
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-500"
                    colSpan={2 + billingCodes.length}
                  >
                    No students found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filtered.map((st, idx) => {
                  const id = st.id ?? st._id ?? st.uuid ?? fullName(st);
                  const zebra = idx % 2 === 1 ? "bg-gray-50/60" : "bg-white";
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "hover:bg-gray-50 divide-x divide-gray-100",
                        zebra
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {fullName(st)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {st?.group?.class_pair || "-"}
                      </td>
                      {billingCodes.map((code) => (
                        <td key={code} className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            className="size-5 accent-blue-600 cursor-pointer"
                            checked={Boolean(roles[id]?.[code])}
                            onChange={() => handleClick(st, code)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Configuration;
