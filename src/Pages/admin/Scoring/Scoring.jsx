import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

function  Scores() {
  const location = useLocation();
  const classInfo = location.state?.classInfo;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  let localUser = {};
  try {
    const raw = localStorage.getItem("user");
    localUser = raw ? JSON.parse(raw) : {};
  } catch (e) {
    localUser = {};
  }
  const roles = localUser?.user?.roles || localUser?.roles || [];
  const isTeacher = Array.isArray(roles) && roles.includes("teacher");

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
      setStudents(res.data?.students || []);
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {classInfo.grade + "-" + classInfo.class} Students
        </h1>
        <p className="text-gray-500 mt-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {students.map((student) => (
            <div
              key={student.sgid || student.student_id}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start gap-4 border border-gray-200 hover:shadow-xl transition overflow-hidden"
            >
              <div className="flex items-center justify-between w-full mb-2 min-w-0">
                <h3 className="text-2xl font-bold text-gray-900 truncate min-w-0 overflow-hidden">
                  {student.full_name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Scores;
