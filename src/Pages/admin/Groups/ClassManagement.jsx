import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Trash2,
  Users,
  User,
  GraduationCap,
  CalendarClock,
  Search,
} from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import AddStudentModal from "./AddStudentModal";
import { useAuth } from "../../../Hooks/AuthContext.jsx";

function ClassManagement() {
  const location = useLocation();
  const classInfo = location.state?.classInfo;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentPendingDelete, setStudentPendingDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [undoStudent, setUndoStudent] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [finalizedToast, setFinalizedToast] = useState("");

  // Get role from AuthContext (verified by server)
  const { isTeacher } = useAuth();

  const fetchStudents = useCallback(async () => {
    if (!classInfo) return;
    setLoading(true);
    try {
      const classPair = `${classInfo.grade}-${classInfo.class}`;
      const filter = encodeURIComponent(
        JSON.stringify({ class_pairs: [classPair] }),
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

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === "active").length;
    return { total, active };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => s.full_name?.toLowerCase().includes(term));
  }, [students, search]);

  const pendingWalletBalance = useMemo(
    () => Number(studentPendingDelete?.wallet?.balance ?? 0),
    [studentPendingDelete],
  );

  // Undo countdown effect
  useEffect(() => {
    if (!undoStudent || undoCountdown <= 0) return;

    const timer = setTimeout(() => {
      if (undoCountdown === 1) {
        // Time's up - actually deactivate the student
        api
          .patch(`${endpoints.REMOVE_FROM_GROUP}/${undoStudent.student_id}`, {
            status: "inactive",
          })
          .then(() => {
            setStudents((prev) =>
              prev.map((s) =>
                s.student_id === undoStudent.student_id
                  ? { ...s, status: "inactive" }
                  : s,
              ),
            );
          })
          .catch(() => {
            // Revert optimistic update on error
            setStudents((prev) =>
              prev.map((s) =>
                s.student_id === undoStudent.student_id
                  ? { ...s, status: "active" }
                  : s,
              ),
            );
          });
        setFinalizedToast("Student deactivated");
        setUndoStudent(null);
        setUndoCountdown(0);
      } else {
        setUndoCountdown((c) => c - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [undoStudent, undoCountdown]);

  // Auto-hide finalized toast
  useEffect(() => {
    if (!finalizedToast) return;
    const t = setTimeout(() => setFinalizedToast(""), 1000);
    return () => clearTimeout(t);
  }, [finalizedToast]);

  const handleUndo = () => {
    // Revert the optimistic update
    if (undoStudent) {
      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === undoStudent.student_id
            ? { ...s, status: "active" }
            : s,
        ),
      );
    }
    setUndoStudent(null);
    setUndoCountdown(0);
  };

  const handleRequestDelete = (student) => {
    setWarningMessage("");
    setStudentPendingDelete(student);
    console.log("Student pending delete:", student);
    setShowDeleteModal(true);
  };

  const handleActivate = async (student) => {
    try {
      await api.patch(`${endpoints.REMOVE_FROM_GROUP}/${student.student_id}`, {
        status: "active",
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === student.student_id ? { ...s, status: "active" } : s,
        ),
      );
    } catch (error) {
      setWarningMessage("Failed to activate student");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setStudentPendingDelete(null);
    setWarningMessage("");
  };

  const handleConfirmDelete = async () => {
    if (!studentPendingDelete) return;

    const walletBalance = Number(
      studentPendingDelete?.wallet?.balance ?? "N/A",
    );
    if (walletBalance > 0) {
      setWarningMessage(
        `${studentPendingDelete.full_name} cannot be set inactive while their wallet balance is ${walletBalance} UZS.`,
      );
      return;
    }

    // Optimistically update status to inactive
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentPendingDelete.student_id
          ? { ...s, status: "inactive" }
          : s,
      ),
    );

    // Start undo countdown
    setUndoStudent(studentPendingDelete);
    setUndoCountdown(5);

    setShowDeleteModal(false);
    setStudentPendingDelete(null);
  };

  if (!classInfo) {
    return <div className="p-6 text-lg">No class selected.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-indigo-700">
              Class Overview
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {classInfo.class_pair_compact ||
                `${classInfo.grade}${classInfo.class}`}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
              <User size={16} />
              Teacher: {classInfo.teacher_name || classInfo.teacher || "-"}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              <GraduationCap size={16} /> Grade {classInfo.grade}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              <CalendarClock size={16} /> Active
            </div>
            {isTeacher && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Add Student
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Students
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Active
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <CalendarClock size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Updated
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {classInfo.updated_at
                    ? new Date(classInfo.updated_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name"
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing {filteredStudents.length} of {students.length}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-amber-800">
            No students match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <div
                key={student.sgid || student.student_id}
                className={`group flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                  student.status === "active"
                    ? "border-slate-200 bg-white"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xl font-semibold text-slate-900 truncate">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ID: {student.student_id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      student.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.status || "-"}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Joined{" "}
                  {student.group?.join_date
                    ? new Date(student.group.join_date).toLocaleDateString(
                        "en",
                        { month: "short", day: "numeric" },
                      )
                    : "-"}
                </div>

                <div className="mt-auto flex justify-end pt-2">
                  {student.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(student)}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      aria-label="Deactivate student"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(student)}
                      className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      aria-label="Activate student"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              Deactivate Student
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to mark{" "}
              <span className="font-medium text-gray-900">
                {studentPendingDelete.full_name}
              </span>
              as inactive? They will remain in the group.
            </p>

            <div
              className={`mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                pendingWalletBalance > 0
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              Wallet balance: {pendingWalletBalance.toLocaleString("en-US")} UZS
            </div>

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

      {/* Undo Toast */}
      {undoStudent && undoCountdown > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center gap-4 rounded-2xl border border-violet-300 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700 ring-2 ring-violet-200">
                {undoCountdown}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900">
                  Deactivating...
                </span>
                <span className="text-xs text-slate-500">
                  Tap undo to restore
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {/* Finalized Toast */}
      {finalizedToast && !undoStudent && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              ✓
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {finalizedToast}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassManagement;
