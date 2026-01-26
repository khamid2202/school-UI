import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import { BookOpen, Users, User, Clock, BarChart3 } from "lucide-react";

const gradeColors = {
  4: "bg-blue-50 text-blue-700 border-blue-100",
  5: "bg-emerald-50 text-emerald-700 border-emerald-100",
  6: "bg-teal-50 text-teal-700 border-teal-100",
  7: "bg-amber-50 text-amber-700 border-amber-100",
  8: "bg-cyan-50 text-cyan-700 border-cyan-100",
  9: "bg-purple-50 text-purple-700 border-purple-100",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
};

function Classes() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const cached = localStorage.getItem("classes");

    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(endpoints.GET_CLASSES);
        const payload = Array.isArray(res?.data?.groups)
          ? res.data.groups
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setGroups(payload);
        localStorage.setItem("classes", JSON.stringify(payload));
      } catch (err) {
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setGroups(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setError("Failed to load classes");
          }
        } else {
          setError(err?.response?.data?.message || "Failed to load classes");
        }
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalStudents = groups.reduce(
      (sum, g) => sum + Number(g.students || 0),
      0,
    );
    const avg = totalGroups > 0 ? (totalStudents / totalGroups).toFixed(1) : 0;
    return { totalGroups, totalStudents, avg };
  }, [groups]);

  const gradeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(groups.map((g) => g.grade).filter(Boolean)),
    );
    return unique.sort((a, b) => a - b);
  }, [groups]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return groups.filter((g) => {
      const matchesSearch = term
        ? g.teacher_name?.toLowerCase().includes(term) ||
          g.name?.toLowerCase().includes(term) ||
          g.class_pair_compact?.toLowerCase().includes(term)
        : true;
      const matchesGrade =
        gradeFilter === "all" ? true : g.grade === gradeFilter;
      return matchesSearch && matchesGrade;
    });
  }, [groups, search, gradeFilter]);

  if (loading) {
    return <div className="p-8 text-lg text-gray-700">Loading groups...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 font-sans">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            Academic Groups
          </h1>
          <p className="text-sm text-slate-600">Academic Year 2025-2026</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Groups
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalGroups}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Students
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Average Class Size
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.avg}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class or teacher"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setGradeFilter("all")}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                gradeFilter === "all"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
              }`}
            >
              All
            </button>
            {gradeOptions.map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setGradeFilter(grade)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  gradeFilter === grade
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
                }`}
              >
                Grade {grade}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
              No groups match your filters.
            </div>
          ) : (
            filtered.map((g) => {
              const color =
                gradeColors[g.grade] ||
                "bg-slate-100 text-slate-700 border-slate-200";
              return (
                <div
                  key={g.id}
                  className="group relative flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {/* <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${color}`}
                      >
                        {g.class_pair_compact || g.name}
                        <span className="text-xs font-medium text-slate-500">
                          Grade {g.grade}
                        </span>
                      </div> */}
                      <p className="text-sm text-slate-500">
                        {g.class_pair || g.name}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800">
                      <User size={16} />
                      <span className="text-sm font-medium">
                        {g.teacher_name || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-800">
                      <Users size={16} />
                      <span className="text-sm font-semibold">
                        {g.students || 0} students
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end pt-2 text-xs text-slate-500">
                    {/*  */}
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/class-management", {
                          state: { classInfo: g },
                        })
                      }
                      className="rounded-lg border border-indigo-200 px-3 py-1 text-sm font-semibold text-indigo-700 transition group-hover:bg-indigo-50"
                    >
                      View Class
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Classes;
