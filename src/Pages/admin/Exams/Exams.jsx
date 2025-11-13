import React, { useEffect, useState } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

function Exams() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]); // fetched or fallback
  const [teachers, setTeachers] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");

  // Fixed subjects
  const SUBJECTS = ["Chemistry", "Biology", "Math", "IT", "Mother Tongue", "PE", "History"];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);

      try {
        // First try the same endpoint the Classes page uses (endpoints.GROUPS)
        let foundClasses = [];

        if (endpoints.GROUPS) {
          try {
            const grpRes = await api.get(endpoints.GROUPS);
            const grpData = grpRes?.data;

            // support shapes: { groups: [...] } or array directly
            const arr = Array.isArray(grpData)
              ? grpData
              : Array.isArray(grpData.groups)
              ? grpData.groups
              : Array.isArray(grpData.data)
              ? grpData.data
              : [];

            if (arr.length) {
              foundClasses = arr
                .map((it) => {
                  if (!it) return null;
                  if (typeof it === "string") return it;
                  // Prefer explicit grade-class if available, otherwise common name fields
                  if (it.grade && it.class) return `${it.grade}-${it.class}`;
                  return it.name ?? it.class_name ?? it.group_name ?? it.label ?? it.title ?? (it.id ? String(it.id) : null);
                })
                .filter(Boolean);
            }
          } catch (err) {
            // if groups endpoint fails, fall back to broader discovery below
            console.warn("Exams: groups endpoint failed, falling back", err);
          }
        }

        // Fetch teachers and exams in parallel (unchanged)
        const [tRes, eRes] = await Promise.allSettled([
          endpoints.TEACHERS ? api.get(endpoints.TEACHERS) : Promise.resolve({ data: [] }),
          endpoints.EXAMS ? api.get(endpoints.EXAMS) : Promise.resolve({ data: [] }),
        ]);

        if (!mounted) return;

        // Normalize teachers (unchanged)
        const teacherSrc = tRes.status === "fulfilled" ? (tRes.value.data?.users || tRes.value.data || []) : [];
        setTeachers(
          (Array.isArray(teacherSrc) ? teacherSrc : []).map((item) => ({
            id: item.id ?? item.uuid ?? item.teacher_id,
            name: item.full_name ?? item.name ?? item.username ?? String(item.id ?? ""),
          }))
        );

        // Normalize exams (unchanged)
        const examsList = eRes.status === "fulfilled"
          ? (Array.isArray(eRes.value.data?.exams) ? eRes.value.data.exams : (Array.isArray(eRes.value.data) ? eRes.value.data : []))
          : [];
        setExams(
          (examsList || []).map((ex, i) => ({
            id: ex.id ?? i,
            className: ex.class_name ?? ex.class ?? ex.className ?? "",
            subject: ex.subject ?? ex.subject_name ?? ex.title ?? "",
            teacher: ex.teacher_name ?? ex.teacher ?? ex.teacherFullName ?? "",
            date: ex.date ?? ex.scheduled_at ?? "",
          }))
        );

        // If groups endpoint returned nothing, fall back to previous discovery logic
        if (foundClasses.length === 0) {
          const classUrls = [
            endpoints.CLASSES,
            endpoints.CLASSES_LIST,
            endpoints.CLASSROOMS,
            endpoints.CLASSROOMS_LIST,
          ].filter(Boolean);

          if (classUrls.length > 0) {
            const classFetches = await Promise.allSettled(classUrls.map((u) => api.get(u).catch((err) => ({ ok: false, error: err }))));
            for (let r of classFetches) {
              if (r.status === "fulfilled" && r.value && r.value.data) {
                const data = r.value.data;
                const arr = Array.isArray(data)
                  ? data
                  : Array.isArray(data.classes)
                  ? data.classes
                  : Array.isArray(data.items)
                  ? data.items
                  : [];
                if (arr.length) {
                  foundClasses = foundClasses.concat(
                    arr
                      .map((it) =>
                        it && (it.name ?? it.class_name ?? it.label ?? it.title ?? (typeof it === "string" ? it : null))
                      )
                      .filter(Boolean)
                  );
                } else if (typeof data === "object") {
                  const vals = Object.values(data).flat().map((it) => it && (it.name ?? it.class_name ?? it.label ?? it.title));
                  foundClasses = foundClasses.concat(vals.filter(Boolean));
                }
              }
            }
          }
        }

        // Deduplicate and sort; if none found use fallback
        const uniqueClasses = Array.from(new Set(foundClasses.map((c) => String(c).trim()))).filter(Boolean);
        if (uniqueClasses.length > 0) {
          uniqueClasses.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
          setClasses(uniqueClasses);
        } else {
          setClasses(FALLBACK_CLASSES);
        }
      } catch (err) {
        console.warn("Exams page: load error", err);
        setTeachers([]);
        setExams([]);
        setClasses(FALLBACK_CLASSES);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAssign = async () => {
    setMessage("");
    if (!selectedClass || !selectedSubject || !selectedTeacher) {
      setMessage("Please select class, subject and teacher.");
      return;
    }
    setAssigning(true);
    try {
      const payload = { class: selectedClass, subject: selectedSubject, teacher: selectedTeacher };
      const url = endpoints.EXAMS_ASSIGN || (endpoints.EXAMS ? `${endpoints.EXAMS}/assign` : "/exams/assign");
      if (api && typeof api.post === "function") {
        await api.post(url, payload);
        setMessage("Exam assigned successfully.");
      } else {
        console.log("Assign payload (no API):", payload);
        setMessage("Assign simulated (no API available).");
      }

      // optimistic insert
      setExams((prev) => [{ id: Date.now(), className: selectedClass, subject: selectedSubject, teacher: selectedTeacher, date: "" }, ...prev]);
      // reset selections (optional)
      setSelectedSubject("");
      setSelectedTeacher("");
    } catch (err) {
      console.error("Assign failed", err);
      setMessage("Failed to assign exam.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Exams</h1>
            <p className="text-sm text-slate-500 mt-1">Assign exams quickly to classes, subjects and teachers</p>
          </div>
          <div className="text-sm text-slate-600">{classes.length} classes • {teachers.length} teachers</div>
        </div>

        {/* Top assignment card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Class select + chips */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                aria-label="Select class"
              >
                {/* simple dropdown placeholder; options only visible when clicked */}
                <option value="" disabled>
                  Select class
                </option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Subject select */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                aria-label="Select subject"
              >
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Teacher select */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                aria-label="Select teacher"
              >
                <option value="">Select teacher</option>
                {teachers.length === 0 && !loading ? (
                  <option value="">No teachers</option>
                ) : (
                  teachers.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)
                )}
              </select>
            </div>

            {/* Spacer for alignment */}
            <div className="sm:col-span-1 flex items-center justify-end">
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 shadow"
              >
                {assigning ? "Assigning..." : "Assign Exam"}
              </button>
            </div>
          </div>

          {/* message */}
          <div className="mt-3 md:mt-0 md:ml-4">
            {message && <div className="text-sm text-slate-600">{message}</div>}
          </div>
        </div>

        {/* Exams list card */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Scheduled / Assigned Exams</h2>
            <div className="text-sm text-slate-500">{exams.length} exams</div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-sm text-slate-600">No exams scheduled yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-violet-50 text-slate-700">
                  <tr>
                    <th className="text-left p-3">Class</th>
                    <th className="text-left p-3">Subject</th>
                    <th className="text-left p-3">Teacher</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((ex) => (
                    <tr key={ex.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{ex.className || "—"}</td>
                      <td className="p-3">{ex.subject || "—"}</td>
                      <td className="p-3">{ex.teacher || "—"}</td>
                      <td className="p-3">{ex.date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Exams;
