import React, { useState } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

export default function AddStudentModal({
  isOpen,
  onClose,
  onAdd,
  defaultClass,
  groupId,
}) {
  const getTodayDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [fullName, setFullName] = useState("");
  const [joinDate, setJoinDate] = useState(getTodayDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setFullName("");
    setJoinDate(getTodayDate());
    setError("");
    setLoading(false);
    onClose && onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Full name is required");
      return;
    }
    if (!groupId) {
      setError("Missing group ID. Please refresh the page and try again.");
      return;
    }

    setLoading(true);
    setError("");
    const joinDateToUse = joinDate || getTodayDate();

    try {
      const createRes = await api.post(endpoints.CREATE_STUDENT, {
        full_name: trimmedName,
      });
      const createdStudent = createRes?.data?.student || createRes?.data;
      if (!createdStudent || !createdStudent.id) {
        throw new Error("Invalid response while creating student");
      }

      await api.post(endpoints.ASSIGN_STUDENT_GROUP, {
        student_id: createdStudent.id,
        group_id: groupId,
        join_date: joinDateToUse,
      });

      // Prepare the object for UI refresh
      const studentForUi = {
        ...createdStudent,
        student_id: createdStudent.id,
        full_name: createdStudent.full_name || trimmedName,
        join_date: joinDateToUse,
        status: createdStudent.status || "active",
        ...(defaultClass ? { group: defaultClass } : {}),
      };

      if (onAdd) {
        await onAdd(studentForUi);
      }

      // reset and close
      handleClose();
    } catch (err) {
      console.error("Failed to add student:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add student. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 z-10">
        <h2 className="text-xl font-semibold mb-4">Add Student to Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full border px-3 py-2 rounded-md"
              placeholder="Student full name"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Join date
            </label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className="mt-1 block w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
