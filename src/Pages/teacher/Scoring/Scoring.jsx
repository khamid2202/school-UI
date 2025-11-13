import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";


function Scores() {
  const location = useLocation();
  const classInfo = location.state?.classInfo;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudentId, setModalStudentId] = useState(null);
  const [modalField, setModalField] = useState(null);

  const [errors, setErrors] = useState({});

  let localUser = {};
  try {
    const raw = localStorage.getItem("user");
    localUser = raw ? JSON.parse(raw) : {};
  } catch (e) {
    localUser = {};
  }
  const roles = localUser?.user?.roles || localUser?.roles || [];
  const isTeacher = Array.isArray(roles) && roles.includes("teacher");

  // Helpers
  const studentKey = (s) => s.sgid || s.student_id || s.id || s.full_name;

  const allowedWords = ["absent", "n/a", "excused", "late"]; // extend as desired
  const normalize = (v) => (typeof v === "string" ? v.trim() : v);

  const isValidScore = (value) => {
    if (value === null || value === undefined) return false;
    const v = normalize(value);
    if (v === "") return false;
    // integer 1..10
    if (/^\d+$/.test(v)) {
      const n = parseInt(v, 10);
      return n >= 1 && n <= 10;
    }
    // allowed words (case-insensitive)
    return allowedWords.includes(v.toLowerCase());
  };

  // Called when user selects a score in the modal (mobile) or when saving inline.
  const setStudentField = (studentId, field, value) => {
    setStudents((prev) =>
      prev.map((s) =>
        studentKey(s) === studentId ? { ...s, [field]: value } : s
      )
    );
    // clear error
    setErrors((prev) => {
      const key = `${studentId}-${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // optional hook to persist a single student's scores (not implemented - placeholder)
  const saveStudentScores = async (student) => {
    // Example: send PATCH to your backend
    // await api.patch(`${endpoints.STUDENTS}/${student.id}/scores`, { homework: student.homework, performance: student.performance });
    // For now we just log
    console.log("Persist student scores (not implemented):", studentKey(student), student.homework, student.performance);
  };

  const onInputChange = (studentId, field, rawValue) => {
    // update immediately, validate later on blur
    setStudents((prev) =>
      prev.map((s) =>
        studentKey(s) === studentId ? { ...s, [field]: rawValue } : s
      )
    );
    // remove error while editing
    setErrors((prev) => {
      const key = `${studentId}-${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onInputBlur = (studentId, field, value) => {
    // validate on blur
    if (!isValidScore(value)) {
      setErrors((prev) => ({
        ...prev,
        [`${studentId}-${field}`]:
          'Value must be an integer 1-10 or one of: "absent", "n/a", "excused"',
      }));
      return;
    }
    const stu = students.find((s) => studentKey(s) === studentId);
    if (stu) {
      saveStudentScores({ ...stu }); // placeholder
    }
  };

  // Mobile: open modal to pick a score
  const openScoreModal = (studentId, field) => {
    setModalStudentId(studentId);
    setModalField(field);
    setModalOpen(true);
  };

  const closeScoreModal = () => {
    setModalOpen(false);
    setModalStudentId(null);
    setModalField(null);
  };

  const pickScoreFromModal = (value) => {
    if (!modalStudentId || !modalField) return;
    setStudentField(modalStudentId, modalField, String(value));
    const stu = students.find((s) => studentKey(s) === modalStudentId);
    if (stu) saveStudentScores({ ...stu, [modalField]: String(value) });
    closeScoreModal();
  };

  // Populate isMobile on mount and on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!classInfo) return;
    setLoading(true);
    try {
      const classPair = `${classInfo.grade}-${classInfo.class}`;
      const filter = encodeURIComponent(
        JSON.stringify({ class_pairs: [classPair] })
      );
      const url = `${endpoints.STUDENTS}?academic_year=2025-2026&filter=${filter}&include_group=1`;
      const res = await api.get(url);
      const fetched = res.data?.students || [];

      // Ensure each student has homework and performance fields (strings)
      const withScores = fetched.map((s) => ({
        ...s,
        homework: s.homework ?? "",
        performance: s.performance ?? "",
      }));
      setStudents(withScores);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  }, [classInfo]);

  useEffect(() => {
    if (!classInfo) return;
    fetchStudents();
  }, [classInfo, fetchStudents]);

  if (!classInfo) {
    return <div className="p-6 text-lg">No class selected.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
          {classInfo.grade + "-" + classInfo.class} Students
        </h1>
        <p className="text-lg font-semibold text-indigo-700 text-center">
          Teacher: {classInfo.teacher}
        </p>
      </div>

      {loading ? (
        <div className="text-xl font-medium">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-lg text-gray-500">
          No students found for this class.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Homework</th>
                <th className="text-left px-6 py-3">Performance</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const key = studentKey(student);
                const hwError = errors[`${key}-homework`];
                const perfError = errors[`${key}-performance`];

                return (
                  <tr
                    key={key}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 align-top max-w-xs">
                      <div className="text-lg font-medium text-gray-900 truncate">
                        {student.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.sgid ? `ID: ${student.sgid}` : ""}
                      </div>
                    </td>

                    {/* Homework Cell */}
                    <td className="px-6 py-4 align-top">
                      {isMobile ? (
                        // mobile: tap to open modal
                        <button
                          className="w-full text-left px-3 py-2 bg-white border rounded-lg hover:bg-indigo-50"
                          onClick={() => openScoreModal(key, "homework")}
                          type="button"
                          aria-label={`Set homework score for ${student.full_name}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-800">
                              {student.homework || "—"}
                            </span>
                            <span className="text-indigo-600 font-semibold">
                              Edit
                            </span>
                          </div>
                        </button>
                      ) : (
                        // desktop: inline editable input
                        <div>
                          <input
                            className={`w-full px-3 py-2 rounded-lg border ${
                              hwError ? "border-red-500" : "border-gray-300"
                            } focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                            value={student.homework ?? ""}
                            onChange={(e) =>
                              onInputChange(key, "homework", e.target.value)
                            }
                            onBlur={(e) =>
                              onInputBlur(key, "homework", e.target.value)
                            }
                            disabled={!isTeacher}
                            placeholder="1-10 or absent"
                            inputMode="numeric"
                            aria-label={`Homework score for ${student.full_name}`}
                          />
                          {hwError && (
                            <div className="text-sm text-red-600 mt-1">
                              {hwError}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Performance Cell */}
                    <td className="px-6 py-4 align-top">
                      {isMobile ? (
                        <button
                          className="w-full text-left px-3 py-2 bg-white border rounded-lg hover:bg-indigo-50"
                          onClick={() => openScoreModal(key, "performance")}
                          type="button"
                          aria-label={`Set performance score for ${student.full_name}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-800">
                              {student.performance || "—"}
                            </span>
                            <span className="text-indigo-600 font-semibold">
                              Edit
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div>
                          <input
                            className={`w-full px-3 py-2 rounded-lg border ${
                              perfError ? "border-red-500" : "border-gray-300"
                            } focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                            value={student.performance ?? ""}
                            onChange={(e) =>
                              onInputChange(key, "performance", e.target.value)
                            }
                            onBlur={(e) =>
                              onInputBlur(key, "performance", e.target.value)
                            }
                            disabled={!isTeacher}
                            placeholder="1-10 or absent"
                            inputMode="numeric"
                            aria-label={`Performance score for ${student.full_name}`}
                          />
                          {perfError && (
                            <div className="text-sm text-red-600 mt-1">
                              {perfError}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeScoreModal}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Set {modalField === "homework" ? "Homework" : "Performance"}{" "}
                  Score
                </h3>
                <button
                  onClick={closeScoreModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Choose a score 1–10 or a quick status.
              </div>
            </div>

            <div className="p-4 grid grid-cols-5 gap-2">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  onClick={() => pickScoreFromModal(n)}
                  className="py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  {n}
                </button>
              ))}

              {/* Quick options */}
              <button
                onClick={() => pickScoreFromModal("absent")}
                className="col-span-2 py-3 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200"
              >
                Absent
              </button>
              <button
                onClick={() => pickScoreFromModal("n/a")}
                className="col-span-3 py-3 rounded-lg bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200"
              >
                N/A
              </button>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={closeScoreModal}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scores;
