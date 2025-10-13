import React, { useState, useMemo } from "react";

export default function PaymentsTable({
  studentData,
  setStudentData,
  months,
  calculateMonthlyFee,
}) {
  const [amounts, setAmounts] = useState({});

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

  const filteredStudents = studentData || [];

  // Build maps from AllStudents in localStorage for id -> { name, classPair }
  const allStudentsInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem("AllStudents");
      if (!raw) return { names: {}, classes: {} };
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : parsed.StudentData || [];
      return arr.reduce(
        (acc, s) => {
          if (s && (s.id || s.student_id || s.sgid)) {
            const id = s.id ?? s.student_id ?? s.sgid;
            acc.names[id] = s.full_name || s.fullName || s.name || "";
            // Try group.class_pair, group.class_pair_compact, fallback to grade/class
            const classPair =
              s.group?.class_pair ||
              s.group?.class_pair_compact ||
              (s.group?.grade && s.group?.class
                ? `${s.group.grade}-${s.group.class}`
                : null) ||
              s.class_pair ||
              s.classPair ||
              null;
            acc.classes[id] = classPair || "";
          }
          return acc;
        },
        { names: {}, classes: {} }
      );
    } catch (e) {
      return { names: {}, classes: {} };
    }
  }, []);

  return (
    <div>
      {/* Desktop table (hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Full Name</th>
            <th className="border px-2 py-1">Class</th>
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
                colSpan={months.length + 5}
                className="text-center p-4 text-gray-500"
              >
                No students found.
              </td>
            </tr>
          )}

          {filteredStudents.map((student) => (
            <tr key={student.id} className="text-center">
              <td className="border px-2 py-1">{student.id}</td>
              <td className="border px-2 py-1 text-left pl-4">
                {allStudentsInfo.names[student.id] ||
                  student.full_name ||
                  student.name}
              </td>
              <td className="border px-2 py-1">
                {allStudentsInfo.classes[student.id] ||
                  student.group?.class_pair ||
                  student.group?.class_pair_compact ||
                  ""}
              </td>
              {/* Dorm and Course columns removed */}

              {months.map((month) => (
                <td
                  key={month}
                  className={`border px-2 py-1 ${
                    student.payments && student.payments[month]
                      ? "bg-green-200"
                      : "bg-red-200"
                  }`}
                >
                  {student.payments && student.payments[month]
                    ? "Paid"
                    : "Unpaid"}
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

      {/* Mobile card list (visible on small screens) */}
      <div className="md:hidden space-y-4">
        {filteredStudents.length === 0 && (
          <div className="text-center p-4 text-gray-500">No students found.</div>
        )}

        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">ID: {student.id}</div>
                <div className="text-lg font-semibold">
                  {allStudentsInfo.names[student.id] || student.full_name || student.name}
                </div>
                <div className="text-sm text-gray-500">
                  {allStudentsInfo.classes[student.id] || student.group?.class_pair || student.group?.class_pair_compact || ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Amount</div>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`${calculateMonthlyFee(student)}`}
                    value={amounts[student.id] || ""}
                    onChange={(e) => handleInputChange(student.id, e.target.value)}
                    className="border p-1 w-28 rounded"
                  />
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleSave(student.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {months.map((month) => (
                <div
                  key={month}
                  className={`px-2 py-1 text-xs rounded-full ${
                    student.payments && student.payments[month]
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {month.slice(0, 3)}: {(student.payments && student.payments[month]) ? "Paid" : "Unpaid"}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
