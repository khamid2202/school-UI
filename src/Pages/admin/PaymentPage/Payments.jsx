import React, { useState, useEffect } from "react";
import TuitionPayments from "./TuitionPayments";
import { DormPayments } from "./DormPayments";
import { OtherPayments } from "./OtherPayments";
import { api } from "../../../Library/RequestMaker";
import { endpoints } from "../../../Library/Endpoints";

export const Payments = () => {
  const [tab, setTab] = useState("tuition"); // tuition | dorm | other

  // Fetch all students once when component mounts and store in localStorage
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const res = await api.get(
          endpoints.STUDENTS + "?academic_year=2024-2025&include_group=1"
        );
        const students = res.data?.students || res.data || [];

        // Provided sample student to ensure full_name exists for display
        const sample = {
          sgid: 918,
          student_id: 918,
          full_name: "Sobirov Usmon",
        };

        // Merge sample into fetched students, avoiding duplicates by id or student_id
        const normalized = Array.isArray(students) ? students.slice() : [];
        const exists = normalized.find(
          (s) => s.id === sample.sgid || s.student_id === sample.student_id
        );
        if (!exists) {
          // keep the minimal shape provided
          normalized.push(sample);
        }

        localStorage.setItem("AllStudents", JSON.stringify(normalized));
      } catch (error) {
        console.error("Failed to fetch all students:", error);
      }
    };
    fetchAllStudents();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "tuition" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTab("tuition")}
          >
            Tuition
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "dorm" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTab("dorm")}
          >
            Dorm
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "other" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTab("other")}
          >
            Other
          </button>
        </div>

        <div>
          {tab === "tuition" && <TuitionPayments />}
          {tab === "dorm" && <DormPayments />}
          {tab === "other" && <OtherPayments />}
        </div>
      </div>
    </div>
  );
};
