import React, { useEffect, useState } from "react";
import { X, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import toast from "react-hot-toast";

function StudentPointsModal({ lesson, isOpen, onClose, onPointsSubmitted }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState({}); // { studentId: { performance, homework } }
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch students for the lesson's group
  useEffect(() => {
    if (!isOpen || !lesson) return;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const groupId = lesson.class_pair || lesson.group_id;
        if (!groupId) {
          setError("No group information available for this lesson");
          setLoading(false);
          return;
        }

        // Try to fetch students by group_id or class_pair
        const response = await api.get(`/students`, {
          group_id: groupId,
          academic_year_id: 1,
          include_group: 1,
        });

        const studentList = response.data?.students || response.data || [];
        setStudents(Array.isArray(studentList) ? studentList : []);
        console.log("Students fetched for group:", groupId, studentList);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to load students. Please try again.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen, lesson]);

  const handlePointChange = (studentId, type, value) => {
    setPoints((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: value === "" ? null : parseInt(value) || 0,
      },
    }));
  };

  const handleSubmitPoints = async () => {
    // Collect all points that were entered
    const pointsToSubmit = [];

    Object.entries(points).forEach(([studentId, pointsData]) => {
      if (pointsData?.performance !== null) {
        pointsToSubmit.push({
          student_id: parseInt(studentId),
          lesson_id: lesson.id,
          group_id: lesson.group_id || lesson.class_pair,
          subject_id: lesson.subject_id,
          type: "performance",
          value: pointsData.performance,
          date: new Date().toISOString().split("T")[0],
        });
      }

      if (pointsData?.homework !== null) {
        pointsToSubmit.push({
          student_id: parseInt(studentId),
          lesson_id: lesson.id,
          group_id: lesson.group_id || lesson.class_pair,
          subject_id: lesson.subject_id,
          type: "homework",
          value: pointsData.homework,
          date: new Date().toISOString().split("T")[0],
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
      // Submit all points
      await Promise.all(
        pointsToSubmit.map((pointData) => api.post("/points", pointData))
      );

      setSubmitSuccess(true);
      setPoints({}); // Clear the form

      setTimeout(() => {
        setSubmitSuccess(false);
        if (onPointsSubmitted) {
          onPointsSubmitted();
        }
      }, 1500);
    } catch (err) {
      console.error("Failed to submit points:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to submit points. Please try again."
      );
      toast.error("Failed to submit points");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {lesson.subject}
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-snug">
              {lesson.class_pair || `Grade ${lesson.grade}-${lesson.class}`} •{" "}
              {lesson.start_time && lesson.end_time
                ? `${lesson.start_time} - ${lesson.end_time}`
                : lesson.time_slot}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Success State */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700">
                Points submitted successfully!
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="ml-3 text-gray-600">Loading students...</p>
            </div>
          )}

          {/* Students Table */}
          {!loading && students.length > 0 && (
            <>
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
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
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

              {/* Submit Button */}
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
                  onClick={onClose}
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* No Students State */}
          {!loading && students.length === 0 && !error && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No students found for this lesson.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentPointsModal;
