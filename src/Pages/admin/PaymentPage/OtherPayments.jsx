import React, { useState } from "react";

import PaymentsTable from "./PaymentsTable";

const TRAINING_FEE = 150;

export const OtherPayments = () => {
  // get AllStudents from localStorage to use as initial data
  const studentsInit = (() => {
    const stored = localStorage.getItem("AllStudents");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s) => ({
        ...s,
        dorm: s.dorm ?? false,
        hasEnglishTraining: s.hasEnglishTraining ?? false,
        discount: s.discount ?? 0,
      }));
    } catch {
      return [];
    }
  })();

  const [studentData, setStudentData] = useState(studentsInit);
  const [search, setSearch] = useState("");

  const months = studentData.length ? Object.keys(studentData[0].payments) : [];

  const calculateMonthlyFee = (student) => {
    // Other payments currently mapped to training fee if applicable
    return student.hasEnglishTraining ? TRAINING_FEE : 0;
  };

  const filteredStudents = studentData.filter((student) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      student.name.toLowerCase().includes(q) ||
      String(student.id).toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-1/3" />
            <div className="w-1/3 text-center">
              <h1 className="text-2xl font-bold">Other Payments</h1>
            </div>
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

        <PaymentsTable
          studentData={filteredStudents}
          setStudentData={setStudentData}
          months={months}
          calculateMonthlyFee={calculateMonthlyFee}
        />
      </div>
    </div>
  );
};
