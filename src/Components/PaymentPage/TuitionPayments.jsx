// src/Components/PaymentPage/Payments.jsx
import React, { useState } from "react";
import Navbar from "../Layout/Navbar";
import data from "./dummyData.json";

const BASE_TUITION = 2600;
const DORM_FEE = 700;
const TRAINING_FEE = 450;

export default function Payments() {
  const studentsInit =
    data && data.StudentData && Array.isArray(data.StudentData)
      ? data.StudentData.map((s) => ({
          ...s,
          dorm: s.dorm ?? false,
          hasEnglishTraining: s.hasEnglishTraining ?? false,
          discount: s.discount ?? 0,
        }))
      : [];

  const [studentData, setStudentData] = useState(studentsInit);
  const [filterType, setFilterType] = useState("all"); // "all" | "dorm" | "course"
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState({});

  const months = studentData.length ? Object.keys(studentData[0].payments) : [];

  // --- Fee calculation depending on filter ---
  const calculateMonthlyFee = (student) => {
    if (filterType === "dorm") return DORM_FEE;
    if (filterType === "course") return TRAINING_FEE;
    const tuitionAfterDiscount = BASE_TUITION * (1 - (student.discount || 0));
    return Math.round(tuitionAfterDiscount * 100) / 100;
  };

  const handleInputChange = (id, value) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = (id) => {
    const student = studentData.find((s) => s.id === id);
    if (!student) return;

    const entered = Number(amounts[id]);
    const expected = calculateMonthlyFee(student);

    if (Number.isNaN(entered)) {
      setAmounts((prev) => ({ ...prev, [id]: "" }));
      return;
    }

    if (Math.abs(entered - expected) <= 0.01) {
      const now = new Date();
      const currentMonthName = now.toLocaleString("en-US", { month: "long" });
      const monthToMark = months.includes(currentMonthName)
        ? currentMonthName
        : months[0];

      setStudentData((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, payments: { ...s.payments, [monthToMark]: true } }
            : s
        )
      );
    }

    setAmounts((prev) => ({ ...prev, [id]: "" }));
  };

  // --- Filter students ---
  const filteredStudents = studentData.filter((student) => {
    if (filterType === "dorm" && !student.dorm) return false;
    if (filterType === "course" && !student.hasEnglishTraining) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      student.name.toLowerCase().includes(q) ||
      String(student.id).toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}
      <div className="flex-1 p-6 overflow-x-auto">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center">
            {/* Left: Toggle */}
            <div className="w-1/3 flex items-center">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 border rounded-l-md ${
                    filterType === "all" ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                >
                  All Students
                </button>
                <button
                  onClick={() => setFilterType("dorm")}
                  className={`px-4 py-2 border ${
                    filterType === "dorm"
                      ? "bg-blue-600 text-white"
                      : "bg-white"
                  }`}
                >
                  Dorm Students
                </button>
                <button
                  onClick={() => setFilterType("course")}
                  className={`px-4 py-2 border rounded-r-md ${
                    filterType === "course"
                      ? "bg-blue-600 text-white"
                      : "bg-white"
                  }`}
                >
                  Course Students
                </button>
              </div>
            </div>

            {/* Center: Title */}
            <div className="w-1/3 text-center">
              <h1 className="text-2xl font-bold">Payments</h1>
            </div>

            {/* Right: Search */}
            <div className="w-1/3 flex justify-end">
              <input
                type="text"
                placeholder="Search by ID or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-2 rounded w-64"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Full Name</th>
                <th className="border px-2 py-1">Dorm</th>
                <th className="border px-2 py-1">Course</th>
                {months.map((month) => (
                  <th key={month} className="border px-2 py-1">
                    {month}
                  </th>
                ))}
                <th className="border px-2 py-1">Amount</th>
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={months.length + 6}
                    className="text-center p-4 text-gray-500"
                  >
                    No students found.
                  </td>
                </tr>
              )}

              {filteredStudents.map((student) => (
                <tr key={student.id} className="text-center">
                  <td className="border px-2 py-1">{student.id}</td>
                  <td className="border px-2 py-1">{student.name}</td>
                  <td className="border px-2 py-1">
                    {student.dorm ? "Yes" : "No"}
                  </td>
                  <td className="border px-2 py-1">
                    {student.hasEnglishTraining ? "Yes" : "No"}
                  </td>

                  {months.map((month) => (
                    <td
                      key={month}
                      className={`border px-2 py-1 ${
                        student.payments[month] ? "bg-green-200" : "bg-red-200"
                      }`}
                    >
                      {student.payments[month] ? "Paid" : "Unpaid"}
                    </td>
                  ))}

                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`${calculateMonthlyFee(student)}`}
                      value={amounts[student.id] || ""}
                      onChange={(e) =>
                        handleInputChange(student.id, e.target.value)
                      }
                      className="border p-1 w-28 rounded"
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <button
                      onClick={() => handleSave(student.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
