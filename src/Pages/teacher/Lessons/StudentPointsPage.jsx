import React, { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Loader, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../../Library/RequestMaker.jsx";

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function ScoreModal({ open, title, onClose, onSelect, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
        disabled={loading}
      />

      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-5 gap-2">
            {SCORE_OPTIONS.map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onSelect(score)}
                disabled={loading}
                className="h-10 rounded-lg border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                {score}
              </button>
            ))}
          </div>
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentPointsPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const lessonFromState = location.state?.lesson || {};
  const selectedDateFromState = location.state?.selectedDate;
  const lessonDateFromState = lessonFromState?.date;

  const selectedDate = useMemo(() => {
    const dateFromQuery = searchParams.get("date");
    if (dateFromQuery) return dateFromQuery;
    if (selectedDateFromState) return selectedDateFromState;
    if (lessonDateFromState) return lessonDateFromState;
    return new Date().toISOString().split("T")[0];
  }, [searchParams, selectedDateFromState, lessonDateFromState]);

  const classLabel =
    searchParams.get("class") ||
    lessonFromState.class_pair ||
    (lessonFromState.grade && lessonFromState.class
      ? `${lessonFromState.grade}-${lessonFromState.class}`
      : "");

  const groupIdRaw =
    searchParams.get("groupId") || lessonFromState.group_id || "";
  const subjectIdRaw =
    searchParams.get("subjectId") || lessonFromState.subject_id || "";

  const groupId = useMemo(() => {
    const asString = String(groupIdRaw ?? "").trim();
    if (!asString) return null;
    return /^\d+$/.test(asString) ? Number(asString) : null;
  }, [groupIdRaw]);

  const subjectId = useMemo(() => {
    const asString = String(subjectIdRaw ?? "").trim();
    if (!asString) return null;
    return /^\d+$/.test(asString) ? Number(asString) : null;
  }, [subjectIdRaw]);

  const [lessonData, setLessonData] = useState(null);
  const [students, setStudents] = useState([]);
  const [pointsByStudent, setPointsByStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");

  const [activeCell, setActiveCell] = useState(null);
  const [savingCellKey, setSavingCellKey] = useState(null);

  const lessonTitle =
    lessonFromState.subject || lessonData?.subject || "Lesson";

  const lessonTime = useMemo(() => {
    if (lessonFromState.start_time && lessonFromState.end_time) {
      return `${lessonFromState.start_time} - ${lessonFromState.end_time}`;
    }
    if (lessonFromState.time_slot) return lessonFromState.time_slot;
    if (lessonData?.time_slot?.start_time && lessonData?.time_slot?.end_time) {
      return `${lessonData.time_slot.start_time} - ${lessonData.time_slot.end_time}`;
    }
    return "";
  }, [lessonFromState, lessonData]);

  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/teacher/lessons");
  };

  const fetchLessonStudents = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      if (!subjectId) {
        setStudents([]);
        setLessonData(null);
        setPointsByStudent({});
        setFetchError("Missing subject_id for this lesson.");
        return;
      }

      const params = {
        date: selectedDate,
        subject_id: subjectId,
      };
      if (groupId) params.group_id = groupId;

      const response = await api.get("/students/points/lesson", params);
      const responseData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const dayData = responseData.find((d) => d.date === selectedDate);
      const lessons = dayData?.lessons || [];
      if (lessons.length === 0) {
        setStudents([]);
        setLessonData(null);
        setPointsByStudent({});
        return;
      }

      let targetLesson = lessons[0];
      if (groupId) {
        const match = lessons.find(
          (l) => String(l.group_id) === String(groupId)
        );
        if (match) targetLesson = match;
      }

      setLessonData(targetLesson);

      const studentList = targetLesson.students || [];
      setStudents(studentList);

      const mapped = {};
      studentList.forEach((student) => {
        const studentId = student.student_id || student.id;
        if (!studentId) return;

        const point = student.point || {};
        const hw = point.homework;
        const pf = point.performance;

        mapped[studentId] = {
          homework: hw?.points ?? null,
          performance: pf?.points ?? null,
          homeworkId: hw?.id ?? null,
          performanceId: pf?.id ?? null,
        };
      });
      setPointsByStudent(mapped);
    } catch (err) {
      console.error("Failed to fetch lesson students:", err);
      setFetchError("Failed to load students. Please try again.");
      setStudents([]);
      setLessonData(null);
      setPointsByStudent({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, subjectId, groupId, lessonId]);

  const getStudentName = (student, index) => {
    return student.full_name || student.fullName || `Student ${index + 1}`;
  };

  const filteredStudents = useMemo(() => {
    const q = String(studentSearch || "")
      .trim()
      .toLowerCase();
    if (!q) return students;

    return students.filter((student, index) => {
      const name = getStudentName(student, index);
      const nickname = student.nickname || "";
      return `${name} ${nickname}`.toLowerCase().includes(q);
    });
  }, [students, studentSearch]);

  const openCell = (studentId, category) => {
    setActiveCell({ studentId, category });
  };

  const closeModal = () => {
    if (savingCellKey) return;
    setActiveCell(null);
  };

  const saveScore = async (score) => {
    if (!activeCell) return;

    const { studentId, category } = activeCell;
    const cellKey = `${studentId}:${category}`;

    if (!subjectId) {
      toast.error("Missing subject_id");
      return;
    }

    setSavingCellKey(cellKey);

    const existing = pointsByStudent[studentId] || {};
    const existingId =
      category === "homework" ? existing.homeworkId : existing.performanceId;

    const payload = {
      student_id: Number(studentId),
      group_id: groupId,
      subject_id: subjectId,
      points: score,
      reason: category,
      date: selectedDate,
    };

    try {
      if (existingId) {
        await api.patch(`/students/points/${existingId}`, payload);

        setPointsByStudent((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            [category]: score,
          },
        }));
      } else {
        const res = await api.post("/students/points", payload);
        const createdId = res?.data?.id ?? res?.data?.data?.id ?? null;

        setPointsByStudent((prev) => ({
          ...prev,
          [studentId]: {
            ...(prev[studentId] || {}),
            [category]: score,
            ...(category === "homework"
              ? { homeworkId: createdId }
              : { performanceId: createdId }),
          },
        }));

        if (!createdId) {
          // If backend doesn't return created ID, refetch to keep update IDs in sync.
          await fetchLessonStudents();
        }
      }

      toast.success(
        `${category === "homework" ? "Homework" : "Performance"} saved`
      );

      setActiveCell(null);
    } catch (err) {
      console.error("Failed to save score:", err);
      toast.error("Failed to save points");
    } finally {
      setSavingCellKey(null);
    }
  };

  const modalTitle = useMemo(() => {
    if (!activeCell) return "";
    return activeCell.category === "homework" ? "Homework" : "Performance";
  }, [activeCell]);

  const modalLoading = useMemo(() => {
    if (!activeCell) return false;
    const key = `${activeCell.studentId}:${activeCell.category}`;
    return savingCellKey === key;
  }, [activeCell, savingCellKey]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="flex items-start gap-3">
            <button
              onClick={goBack}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {classLabel || "Class"}
              </h1>
              <p className="text-sm text-gray-600">
                {lessonTime ? lessonTime + " • " : ""}
                {selectedDate}
              </p>
              <p className="text-sm text-gray-500 truncate">{lessonTitle}</p>
            </div>
          </div>

          {students.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                {studentSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredStudents.length} of {students.length}
              </div>
            </div>
          )}
        </header>

        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="ml-3 text-gray-600">Loading students...</p>
          </div>
        )}

        {!loading && filteredStudents.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/2">
                      Student
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 w-1/4">
                      Homework
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 w-1/4">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const studentId = student.student_id || student.id;
                    const studentName = getStudentName(student, index);
                    const row = pointsByStudent[studentId] || {};

                    const homeworkValue = row.homework;
                    const performanceValue = row.performance;

                    const homeworkKey = `${studentId}:homework`;
                    const performanceKey = `${studentId}:performance`;

                    const homeworkSaving = savingCellKey === homeworkKey;
                    const performanceSaving = savingCellKey === performanceKey;

                    return (
                      <tr
                        key={studentId || index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {student.picture ? (
                              <img
                                src={student.picture}
                                alt={studentName}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold">
                                {studentName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {studentName}
                              </p>
                              {student.nickname && (
                                <p className="text-xs text-gray-500 truncate">
                                  {student.nickname}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => openCell(studentId, "homework")}
                            disabled={homeworkSaving}
                            className="inline-flex items-center justify-center min-w-16 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition font-semibold text-gray-900 disabled:opacity-50"
                            aria-label={`Set homework points for ${studentName}`}
                          >
                            {homeworkSaving ? (
                              <Loader className="w-4 h-4 animate-spin text-blue-600" />
                            ) : homeworkValue !== null &&
                              homeworkValue !== undefined ? (
                              homeworkValue
                            ) : (
                              "—"
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => openCell(studentId, "performance")}
                            disabled={performanceSaving}
                            className="inline-flex items-center justify-center min-w-16 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition font-semibold text-gray-900 disabled:opacity-50"
                            aria-label={`Set performance points for ${studentName}`}
                          >
                            {performanceSaving ? (
                              <Loader className="w-4 h-4 animate-spin text-purple-600" />
                            ) : performanceValue !== null &&
                              performanceValue !== undefined ? (
                              performanceValue
                            ) : (
                              "—"
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading &&
          !fetchError &&
          students.length > 0 &&
          filteredStudents.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No students match your search.
            </div>
          )}

        {!loading && !fetchError && students.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            No students found for this class.
          </div>
        )}

        <ScoreModal
          open={!!activeCell}
          title={modalTitle}
          onClose={closeModal}
          onSelect={saveScore}
          loading={modalLoading}
        />
      </div>
    </div>
  );
}

export default StudentPointsPage;
