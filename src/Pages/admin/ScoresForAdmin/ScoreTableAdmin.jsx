import React from "react";

function ScoreTableAdmin({
  studentsList = [],
  loading = false,
  lessonPoints = null,
  pointsLoading = false,
  selectedSubject = null,
}) {
  //   console.log("lesson points in ScoreTableAdmin:", lessonPoints);
  // build a map from lessonPoints for quick lookup
  // The API returns a flat array of points: { student_id, points, created_at, ... }
  // For each student, pick the most recent point entry (by created_at or date)
  const pointsMap = React.useMemo(() => {
    const map = new Map();
    if (!lessonPoints || !Array.isArray(lessonPoints.points)) return map;

    // Group points by student_id and find the latest for each
    const byStudent = {};
    lessonPoints.points.forEach((pt) => {
      const sid = String(pt.student_id);
      if (!byStudent[sid]) {
        byStudent[sid] = pt;
      } else {
        // compare timestamps to keep the latest
        const existingTime = byStudent[sid]?.created_at
          ? new Date(byStudent[sid].created_at).getTime()
          : byStudent[sid]?.date
          ? new Date(byStudent[sid].date).getTime()
          : 0;
        const newTime = pt?.created_at
          ? new Date(pt.created_at).getTime()
          : pt?.date
          ? new Date(pt.date).getTime()
          : 0;
        if (newTime >= existingTime) {
          byStudent[sid] = pt;
        }
      }
    });

    // Convert to map
    Object.entries(byStudent).forEach(([sid, pt]) => {
      map.set(sid, pt);
    });

    return map;
  }, [lessonPoints]);

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold text-gray-800 mb-3">
        Scoring Table {selectedSubject ? `— ${selectedSubject.name}` : ""}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-20 px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                ID
              </th>
              <th className="w-1/3 px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                Student
              </th>
              <th className="w-1/3 px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                Lesson Points
              </th>
              <th className="w-1/3 px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                Column 3
              </th>
            </tr>
          </thead>
          <tbody>
            {loading || pointsLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-sm text-gray-500 border border-gray-200 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : studentsList && studentsList.length ? (
              studentsList.map((s, idx) => {
                const key = String(s.student_id || s.studentId || s.id || idx);
                const pt = pointsMap.get(key);
                const display = pt ? pt.points ?? "-" : "-";
                return (
                  <tr
                    key={`student-row-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800 border border-gray-200 truncate">
                      {s.student_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border border-gray-200 truncate">
                      {s.full_name || s.fullName || `Student ${idx + 1}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border border-gray-200">
                      {display}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border border-gray-200">
                      &nbsp;
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500 border border-gray-200">
                  No students found
                </td>
                <td className="px-4 py-6 text-sm text-gray-500 border border-gray-200">
                  &nbsp;
                </td>
                <td className="px-4 py-6 text-sm text-gray-500 border border-gray-200">
                  &nbsp;
                </td>
                <td className="px-4 py-6 text-sm text-gray-500 border border-gray-200">
                  &nbsp;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ScoreTableAdmin;
