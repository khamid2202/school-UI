import React, { useCallback, useEffect, useState } from "react";
import { data, useLocation } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import AddStudentModal from "./AddStudentModal";

function ClassManagement() {
  const location = useLocation();
  const classInfo = location.state?.classInfo;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentPendingDelete, setStudentPendingDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

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
      const url = `${endpoints.STUDENTS}&filter=${filter}`;
      const res = await api.get(url);
      console.log("Fetched students for class:", res.data?.students || []);
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

  const handleRequestDelete = (student) => {
    setWarningMessage("");
    setStudentPendingDelete(student);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setStudentPendingDelete(null);
    setWarningMessage("");
  };

  const handleConfirmDelete = async () => {
    if (!studentPendingDelete) return;

    const walletBalance = Number(studentPendingDelete?.wallet?.uzs ?? 0);
    if (walletBalance > 0) {
      setWarningMessage(
        `${studentPendingDelete.full_name} cannot be deleted while their wallet balance is ${walletBalance} UZS.`
      );
      return;
    }

    try {
      await api.delete(endpoints.REMOVE_FROM_GROUP, {
        data: {
          student_id: Number(studentPendingDelete.student_id),
          group_id: classInfo.id,
        },
      });

      // ⬇️ instead of refetching:
      setStudents((prev) =>
        prev.filter((s) => s.student_id !== studentPendingDelete.student_id)
      );
    } catch (error) {
      setWarningMessage("Failed to delete student");
    }

    setShowDeleteModal(false);
    setStudentPendingDelete(null);
  };

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
              className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-start gap-2 border border-gray-200 hover:shadow-xl transition overflow-hidden"
            >
              <div className="flex  items-center justify-between w-full mb-2 min-w-0">
                <h3 className="text-md font-bold text-gray-900 truncate min-w-0 overflow-hidden">
                  {student.full_name}
                </h3>
                {/* <span
                  className={`px-3 py-1 rounded-full text-base font-semibold flex-shrink-0 ml-3 ${
                    student.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {student.status
                    ? student.status.charAt(0).toUpperCase() +
                      student.status.slice(1)
                    : "Unknown"}
                </span> */}
              </div>
              <div className="w-full flex flex-col gap-2 text-lg">
                <div className="flex gap-2 items-center">
                  <span className="font-medium text-gray-700">ID:</span>
                  <span className="text-gray-900">{student.student_id}</span>
                </div>
                <div className="flex gap-2 items-center"></div>
              </div>
              <button
                type="button"
                onClick={() => handleRequestDelete(student)}
                className="mt-auto self-end rounded-md border border-red-200 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                aria-label="Delete student"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        groupId={classInfo.id}
        onAdd={(newStudent) => {
          setStudents((prev) => [...prev, newStudent]);
        }}
      />

      {showDeleteModal && studentPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleCancelDelete}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Student
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {studentPendingDelete.full_name}
              </span>
              ? This action cannot be undone.
            </p>

            {warningMessage && (
              <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                {warningMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassManagement;
