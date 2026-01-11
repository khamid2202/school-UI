import React, { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import toast from "react-hot-toast";

function StudentPointsPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const lessonFromState = location.state?.lesson || {};
  const selectedDateFromState = location.state?.selectedDate;

  const selectedDate = useMemo(
    () =>
      searchParams.get("date") ||
      selectedDateFromState ||
      new Date().toISOString().split("T")[0],
    [searchParams, selectedDateFromState]
  );

  const classLabel =
    searchParams.get("class") || lessonFromState.class_pair || "";
  const groupId =
    searchParams.get("groupId") ||
    lessonFromState.group_id ||
    lessonFromState.class_pair ||
    "";
  const lessonType =
    searchParams.get("lessonType") ||
    lessonFromState.lesson_type ||
    lessonFromState.subject ||
    "lesson";
  const subjectId =
    searchParams.get("subjectId") || lessonFromState.subject_id || "";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState({}); // { studentId: { performance, homework } }
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const lessonTitle = lessonFromState.subject || `Lesson ${lessonId}`;
  const lessonTime =
    lessonFromState.start_time && lessonFromState.end_time
      ? `${lessonFromState.start_time} - ${lessonFromState.end_time}`
      : lessonFromState.time_slot || "";

  // Fetch students for the lesson's class/group with filters (date, class, lesson type)
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!groupId) {
          setError("No class/group information available for this lesson.");
          setStudents([]);
          setLoading(false);
          return;
        }

        const response = await api.get(`/students`, {
          group_id: groupId,
          academic_year_id: 1,
          include_group: 1,
          date: selectedDate,
          class: classLabel,
          lesson_type: lessonType,
        });

        const studentList = response.data?.students || response.data || [];
        const normalizedStudents = Array.isArray(studentList)
          ? studentList
          : [];

        const initialPoints = {};
        normalizedStudents.forEach((student) => {
          const studentId = student.id || student.student_id;
          if (!studentId) return;

          initialPoints[studentId] = {
            performance:
              student.performance_points ?? student.performance ?? null,
            homework: student.homework_points ?? student.homework ?? null,
          };
        });

        setStudents(normalizedStudents);
        setPoints(initialPoints);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to load students. Please try again.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [groupId, selectedDate, classLabel, lessonType]);

  const handlePointChange = (studentId, type, value) => {
    setPoints((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: value === "" ? null : parseInt(value, 10) || 0,
      },
    }));
  };

  const handleSubmitPoints = async () => {
    const pointsToSubmit = [];

    Object.entries(points).forEach(([studentId, pointsData]) => {
      if (
        pointsData?.performance !== null &&
        pointsData?.performance !== undefined
      ) {
        pointsToSubmit.push({
          student_id: parseInt(studentId, 10),
          lesson_id: lessonId,
          group_id: groupId,
          subject_id: subjectId || lessonFromState.subject_id,
          lesson_type: lessonType,
          class: classLabel,
          type: "performance",
          value: pointsData.performance,
          date: selectedDate,
        });
      }

      if (pointsData?.homework !== null && pointsData?.homework !== undefined) {
        pointsToSubmit.push({
          student_id: parseInt(studentId, 10),
          lesson_id: lessonId,
          group_id: groupId,
          subject_id: subjectId || lessonFromState.subject_id,
          lesson_type: lessonType,
          class: classLabel,
          type: "homework",
          value: pointsData.homework,
          date: selectedDate,
        });
      }
    });

    if (pointsToSubmit.length === 0) {
      toast.error("Please enter at least one point value");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await Promise.all(
        pointsToSubmit.map((pointData) => api.post("/points", pointData))
      );

      setSubmitSuccess(true);
      toast.success("Points submitted successfully");
    } catch (err) {
      console.error("Failed to submit points:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to submit points. Please try again."
      );
      toast.error("Failed to submit points");
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitSuccess(false), 2000);
    }
  };

  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/teacher/lessons");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={goBack}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition"
            aria-label="Back to lessons"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <p className="text-sm text-gray-500">Date: {selectedDate}</p>
            <h1 className="text-2xl font-bold text-gray-900">{lessonTitle}</h1>
            <p className="text-sm text-gray-600">
              {classLabel ? `${classLabel} • ` : ""}
              {lessonTime}
            </p>
          </div>
        </div>

        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-700">
              Points submitted successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="ml-3 text-gray-600">Loading students...</p>
          </div>
        )}

        {!loading && students.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No students found for this lesson.</p>
          </div>
        )}

        {!loading && students.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            {/* Table view for md+ */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Performance Points
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Homework Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const studentId = student.id || student.student_id;
                    const studentName =
                      student.full_name ||
                      student.fullName ||
                      `Student ${index + 1}`;
                    const studentPoints = points[studentId] || {};

                    return (
                      <tr
                        key={studentId || index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 text-gray-900">
                          {studentName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={studentPoints.performance ?? ""}
                            onChange={(e) =>
                              handlePointChange(
                                studentId,
                                "performance",
                                e.target.value
                              )
                            }
                            disabled={submitting}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={studentPoints.homework ?? ""}
                            onChange={(e) =>
                              handlePointChange(
                                studentId,
                                "homework",
                                e.target.value
                              )
                            }
                            disabled={submitting}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Card view for mobile */}
            <div className="sm:hidden space-y-3">
              {students.map((student, index) => {
                const studentId = student.id || student.student_id;
                const studentName =
                  student.full_name ||
                  student.fullName ||
                  `Student ${index + 1}`;
                const studentPoints = points[studentId] || {};

                return (
                  <div
                    key={studentId || index}
                    className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900 text-sm">
                        {studentName}
                      </p>
                      <span className="text-xs text-gray-500">
                        ID: {studentId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-700">
                          Performance
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={studentPoints.performance ?? ""}
                          onChange={(e) =>
                            handlePointChange(
                              studentId,
                              "performance",
                              e.target.value
                            )
                          }
                          disabled={submitting}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-700">
                          Homework
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={studentPoints.homework ?? ""}
                          onChange={(e) =>
                            handlePointChange(
                              studentId,
                              "homework",
                              e.target.value
                            )
                          }
                          disabled={submitting}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmitPoints}
                disabled={submitting || loading}
                className="w-full sm:flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader className="w-4 h-4 animate-spin" />}
                {submitting ? "Submitting..." : "Submit Points"}
              </button>
              <button
                onClick={goBack}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentPointsPage;
