import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import AddStudentModal from "./AddStudentModal";

function ClassManagement() {
  const location = useLocation();
  const classInfo = location.state?.classInfo;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // determine if current user has teacher role
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
      const url = `${endpoints.STUDENTS}?academic_year=2024-2025&filter=${filter}&include_group=1`;
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
      <div className="mb-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
          {classInfo.grade + "-" + classInfo.class} Students
        </h1>
        <p className="text-2xl font-bold text-indigo-700 text-center">
          Teacher: {classInfo.teacher}
        </p>
        {isTeacher && (
          <div className="mt-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Student
            </button>
          </div>
        )}
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
                <span
                  className={`px-3 py-1 rounded-full text-base font-semibold flex-shrink-0 ml-3 ${
                    student.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {student.status.charAt(0).toUpperCase() +
                    student.status.slice(1)}
                </span>
              </div>
              <div className="w-full flex flex-col gap-2 text-lg">
                <div className="flex gap-2 items-center">
                  <span className="font-medium text-gray-700">ID:</span>
                  <span className="text-gray-900">{student.student_id}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-medium text-gray-700">Join Date:</span>
                  <span className="text-gray-900">
                    {student.join_date
                      ? new Date(student.join_date).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultClass={`${classInfo.grade}-${classInfo.class}`}
        groupId={classInfo.id}
        onAdd={async () => {
          await fetchStudents();
        }}
      />
    </div>
  );
}

export default ClassManagement;
