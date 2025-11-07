import { useEffect, useState, useMemo } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import { Loader2, AlertCircle, Upload } from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
const DAY_MAP = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

function Timetable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timetableData, setTimetableData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [viewMode, setViewMode] = useState("class"); // 'class' | 'teacher'
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [dayFilter, setDayFilter] = useState("all"); // 'all' | day name

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadAcademicYear, setUploadAcademicYear] = useState("2025-2026");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");

  // Fetch groups and teachers on mount
  useEffect(() => {
    const fetchBasics = async () => {
      try {
        const [groupsRes, teachersRes] = await Promise.all([
          api.get(endpoints.GROUPS),
          api.get(endpoints.TEACHERS),
        ]);
        setGroups(groupsRes.data?.groups || []);
        const rawUsers = teachersRes.data?.users || teachersRes.data || [];
        const onlyTeachers = rawUsers.filter((u) =>
          Array.isArray(u.roles) ? u.roles.includes("teacher") : true
        );
        setTeachers(onlyTeachers);
      } catch (e) {
        console.error("Failed to load basics", e);
      }
    };
    fetchBasics();
  }, []);

  // Fetch timetable data when filters change
  useEffect(() => {
    // Don't fetch if teacher mode is selected but no teacher chosen
    if (viewMode === "teacher" && !selectedTeacherId) {
      setTimetableData([]);
      setLoading(false);
      return;
    }

    // Set loading immediately when filters change
    setLoading(true);

    const fetchTimetable = async () => {
      setError("");
      try {
        const params = { academic_year: academicYear };

        // Add filters based on view mode
        // Send as comma-separated string, not array
        if (viewMode === "class" && selectedGroupId) {
          params.group_ids = String(selectedGroupId);
        } else if (viewMode === "teacher" && selectedTeacherId) {
          params.teacher_ids = String(selectedTeacherId);
        }

        // Add day filter if specific day selected
        if (dayFilter !== "all") {
          params.days = String(DAY_MAP[dayFilter]);
        }

        const timetableRes = await api.get(endpoints.TIMETABLES, params);
        const timetables = timetableRes.data?.timetables || [];
        const today = new Date();
        const filteredTimetables = timetables.filter((item) => {
          return item.end_date ? new Date(item.end_date) >= today : true;
        });
        
        // Transform data: add missing fields that backend doesn't provide
        const transformedData = filteredTimetables.map((item) => ({
          ...item,
          // Add day_index if missing
          day_index: item.day_index || DAY_MAP[item.day],
          // Add time_id: create unique ID from time_slot
          time_id: item.time_id || `${item.start_time}-${item.end_time}`,
          // Add group_id: use the lesson id or create from grade+class
          group_id: item.group_id || `${item.grade}-${item.class}`,
        }));
        
        console.log("filteredTimetables:", transformedData);
        setTimetableData(transformedData);
      } catch (err) {
        console.error(err);
        setError("Failed to load timetable data");
      } finally {
        setLoading(false);
      }
    };

    // Debounce academic year input
    const timer = setTimeout(() => {
      fetchTimetable();
    }, 300);

    return () => clearTimeout(timer);
  }, [academicYear, viewMode, selectedGroupId, selectedTeacherId, dayFilter]);

  // Build grid structure: days × time slots × classes
  const { timeSlots, classesSorted, gridData } = useMemo(() => {
    // Extract unique time slots
    const timeSlotsMap = new Map();
    timetableData.forEach((item) => {
      if (!timeSlotsMap.has(item.time_id)) {
        timeSlotsMap.set(item.time_id, {
          id: item.time_id,
          start: item.start_time,
          end: item.end_time,
          slot: item.time_slot,
        });
      }
    });
    const timeSlots = Array.from(timeSlotsMap.values()).sort((a, b) =>
      a.start.localeCompare(b.start)
    );

    // Extract unique classes and sort them
    const classesMap = new Map();
    timetableData.forEach((item) => {
      if (!classesMap.has(item.group_id)) {
        classesMap.set(item.group_id, {
          id: item.group_id,
          class_pair: item.class_pair,
          grade: item.grade,
          class: item.class,
        });
      }
    });
    const classesSorted = Array.from(classesMap.values()).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.class.localeCompare(b.class);
    });

    // Build grid: Map<day_timeId_groupId, lesson>
    const gridData = new Map();
    timetableData.forEach((item) => {
      const key = `${item.day_index}_${item.time_id}_${item.group_id}`;
      gridData.set(key, item);
    });

    return { timeSlots, classesSorted, gridData };
  }, [timetableData]);

  // Handle file upload
  const handleUpload = async () => {
    if (!file || !uploadAcademicYear || !startDate) {
      setUploadError("Please fill in all required fields");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("academic_year", uploadAcademicYear);
      formData.append("start_date", startDate);
      if (endDate) formData.append("end_date", endDate);

      const res = await api.postForm(endpoints.TIMETABLES_UPLOAD, formData);
      setUploadResult(res.data || res);

      // Refresh timetable data after successful upload
      setTimeout(() => {
        setShowUploadModal(false);
        setFile(null);
        setStartDate("");
        setEndDate("");
        setUploadResult(null);
        // Trigger refetch by updating a dependency
        setAcademicYear(uploadAcademicYear);
      }, 2000);
    } catch (err) {
      console.error(err);
      setUploadError(
        err.response?.data?.message ||
          "Upload failed. Please check the file format."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Non-scrolling part: Header and Filters - Fixed container */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 w-full">
        {/* Fixed header - won't be affected by table width */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Timetable - {academicYear}
            </h1>
            <p className="text-gray-500 mt-1">
              Weekly schedule for all classes
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition whitespace-nowrap"
          >
            <Upload size={18} />
            Upload Timetable
          </button>
        </div>

        {/* Filters - also fixed width */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end flex-wrap">
            {/* View mode toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "class"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => {
                  setViewMode("class");
                  setSelectedTeacherId("");
                }}
              >
                By Class
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "teacher"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => {
                  setViewMode("teacher");
                  setSelectedGroupId("");
                }}
              >
                By Teacher
              </button>
            </div>

            {/* Academic year */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">
                Academic Year
              </label>
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="px-3 py-2 border rounded-lg w-44 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="2025-2026"
              />
            </div>

            {/* Class or Teacher selector */}
            {viewMode === "class" ? (
              <div className="flex flex-col min-w-56">
                <label className="text-xs text-gray-500 mb-1">Class</label>
                <select
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">All classes</option>
                  {groups
                    .slice()
                    .sort((a, b) =>
                      `${a.grade}-${a.class}`.localeCompare(
                        `${b.grade}-${b.class}`
                      )
                    )
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.grade}-{g.class}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col min-w-56">
                <label className="text-xs text-gray-500 mb-1">Teacher</label>
                <select
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  <option value="">Select a teacher</option>
                  {teachers
                    .slice()
                    .sort((a, b) =>
                      (a.full_name || "").localeCompare(b.full_name || "")
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Day filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Day</label>
              <select
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
              >
                <option value="all">All days</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 mt-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Scrolling part: Table - Completely independent scrolling container */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        <div className="h-full overflow-auto bg-white rounded-xl shadow-sm border">
          {loading ? (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-0 bg-gray-50 z-30">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-[100px] bg-gray-50 z-30">
                    Period
                  </th>
                  {/* Skeleton class headers - show 1 if class selected, otherwise 6 */}
                  {Array.from({ length: selectedGroupId ? 1 : 6 }).map(
                    (_, i) => (
                      <th
                        key={`skeleton-header-${i}`}
                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r min-w-[180px]"
                      >
                        <div className="h-5 bg-gray-200 rounded animate-pulse mx-auto w-16"></div>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Skeleton rows - show 1 day if day filter, otherwise 6 days */}
                {Array.from({ length: dayFilter === "all" ? 6 : 1 }).map(
                  (_, dayIdx) =>
                    Array.from({ length: 6 }).map((_, slotIdx) => (
                      <tr
                        key={`skeleton_${dayIdx}_${slotIdx}`}
                        className="border-b"
                      >
                        {/* Day column - only show on first time slot */}
                        {slotIdx === 0 ? (
                          <td
                            rowSpan={6}
                            className="px-4 py-3 text-sm font-medium text-gray-700 border-r align-top sticky left-0 bg-white"
                          >
                            <div className="h-5 bg-gray-200 rounded animate-pulse w-20"></div>
                          </td>
                        ) : null}

                        {/* Period column */}
                        <td className="px-4 py-3 text-sm text-gray-600 border-r sticky left-[100px] bg-white">
                          <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                        </td>

                        {/* Class cells - show 1 if class selected, otherwise 6 */}
                        {Array.from({ length: selectedGroupId ? 1 : 6 }).map(
                          (_, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-3 py-2 text-sm border-r align-top"
                            >
                              <div className="space-y-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                              </div>
                            </td>
                          )
                        )}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          ) : classesSorted.length === 0 || timeSlots.length === 0 ? (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-0 bg-gray-50 z-30">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-[100px] bg-gray-50 z-30">
                    Period
                  </th>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <th
                      key={`empty-header-${i}`}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r min-w-[180px]"
                    >
                      <div className="h-5 w-16 mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="px-8 py-16 text-center">
                    <div className="text-gray-500">
                      {viewMode === "teacher" && !selectedTeacherId
                        ? "Select a teacher to view their schedule"
                        : `No timetable data available for ${academicYear}`}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {(dayFilter === "all" ? DAYS : [dayFilter]).map((day) => {
                  const dayIndex = DAY_MAP[day];
                  return (
                    <>
                      {/* Class headers row for this day */}
                      <tr key={`${day}_classes`} className="bg-indigo-50 border-b">
                        <td className="px-4 py-2 text-sm font-semibold text-gray-800 border-r sticky left-0 bg-indigo-50 z-10">
                          {day}
                        </td>
                        {classesSorted.map((cls) => (
                          <td
                            key={`${day}_class_${cls.id}`}
                            className="px-4 py-2 text-center text-sm font-semibold text-gray-800 border-r bg-indigo-50 whitespace-nowrap"
                          >
                            {cls.class_pair}
                          </td>
                        ))}
                      </tr>
                      {/* Time slot rows */}
                      {timeSlots.map((timeSlot, slotIdx) => (
                        <tr
                          key={`${day}_${timeSlot.id}`}
                          className="border-b hover:bg-gray-50/50"
                        >
                      {/* Period column */}
                      <td className="px-4 py-3 text-sm text-gray-600 border-r sticky left-0 bg-white whitespace-nowrap">
                        <div className="font-medium">{timeSlot.slot}</div>
                      </td>

                      {/* Class cells */}
                      {classesSorted.map((cls) => {
                        const key = `${dayIndex}_${timeSlot.id}_${cls.id}`;
                        const lesson = gridData.get(key);
                        return (
                          <td
                            key={`cell-${key}`}
                            className="px-3 py-2 text-sm border-r align-top"
                          >
                            {lesson ? (
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">
                                  {lesson.subject}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {lesson.teacher}
                                </div>
                                {lesson.room && (
                                  <div className="text-xs text-gray-500">
                                    Room {lesson.room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Upload Timetable
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload an Excel file with timetable data
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel file <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 2MB. .xlsx or .xls format
                </p>
              </div>

              {/* Academic year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadAcademicYear}
                  onChange={(e) => setUploadAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Error */}
              {uploadError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}

              {/* Success */}
              {uploadResult && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-2">
                    Upload Successful!
                  </div>
                  <div className="flex gap-4 text-sm text-green-700">
                    <div>
                      <span className="font-semibold">Inserted:</span>{" "}
                      {uploadResult.inserted ?? 0}
                    </div>
                    <div>
                      <span className="font-semibold">Updated:</span>{" "}
                      {uploadResult.updated ?? 0}
                    </div>
                    <div>
                      <span className="font-semibold">Skipped:</span>{" "}
                      {uploadResult.skipped ?? 0}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                  setStartDate("");
                  setEndDate("");
                  setUploadError("");
                  setUploadResult(null);
                }}
                disabled={uploading}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  !file || !uploadAcademicYear || !startDate || uploading
                }
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timetable;
