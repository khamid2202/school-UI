import React, { useState } from "react";
import data from "../PaymentPage/dummyData.json";

export default function Configuration() {
  const studentsInit =
    data && data.StudentData && Array.isArray(data.StudentData)
      ? data.StudentData.map((s) => ({
          ...s,
          dorm: s.dorm ?? false,
          hasEnglishTraining: s.hasEnglishTraining ?? false,
          discount: s.discount ?? 0,
        }))
      : [];

  const [students, setStudents] = useState(studentsInit);

  const handleChange = (id, field, value) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, [field]: value } : student
      )
    );
  };

  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

  return (
    <div style={{ padding: "32px" }}>
      <h2 style={{ marginBottom: "8px", fontSize: "1.5rem" }}>
        Student Configuration
      </h2>
      <div style={{ marginBottom: "24px", fontSize: "1.1rem", color: "#555" }}>
        Current Month: <strong>{currentMonth}</strong>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          background: "#fff",
        }}
      >
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                textAlign: "left",
              }}
            >
              Name
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                textAlign: "left",
              }}
            >
              Dorm (This Month)
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                textAlign: "left",
              }}
            >
              English Course
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                textAlign: "left",
              }}
            >
              Discount (%)
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr
              key={student.id}
              style={{
                background: idx % 2 === 0 ? "#fafafa" : "#fff",
                textAlign: "center",
              }}
            >
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  textAlign: "left",
                }}
              >
                {student.name}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  textAlign: "left",
                }}
              >
                <input
                  type="checkbox"
                  checked={student.dorm}
                  onChange={(e) =>
                    handleChange(student.id, "dorm", e.target.checked)
                  }
                />
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  textAlign: "left",
                }}
              >
                <input
                  type="checkbox"
                  checked={student.hasEnglishTraining}
                  onChange={(e) =>
                    handleChange(
                      student.id,
                      "hasEnglishTraining",
                      e.target.checked
                    )
                  }
                />
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  textAlign: "left",
                }}
              >
                <input
                  type="number"
                  value={Math.round(student.discount * 100)}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    handleChange(
                      student.id,
                      "discount",
                      Number(e.target.value) / 100
                    )
                  }
                  style={{ width: "60px", padding: "4px" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
