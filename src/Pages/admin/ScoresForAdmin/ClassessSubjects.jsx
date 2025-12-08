import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, ArrowLeft } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import ScoreTableAdmin from "./ScoreTableAdmin";
import useStudentsForClass from "./useStudentsForClass";

const normalizeStudents = (classInfo) => {
  if (!classInfo) return [];
  // if (Array.isArray(classInfo.students)) {
  //   return classInfo.students;
  // }
  if (Array.isArray(classInfo.studentList)) {
    console.log(
      "Normalizing students from studentList:",
      classInfo.studentList
    );
    return classInfo.studentList;
  }
  return [];
};

function ClassSubjects() {
  const location = useLocation();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  // students state moved to hook

  const classInfo = location?.state?.classInfo || null;
  // console.log("Class info in ClassSubjects:", classInfo);

  //fetch subject from timetable and filter by classInfo.id
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!classInfo || !classInfo.id) return;
      setLoading(true);
      try {
        const url = `${endpoints.GET_DATA_FROM_TIMETABLE}&group_ids=[${classInfo.id}]`;
        const response = await api.get(url);

        const timetableEntries = response.data?.timetable || [];
        const normalizedSubjects = timetableEntries.reduce((acc, entry) => {
          if (!entry || !entry.subject) return acc;
          const key = entry.subject.trim();
          if (!key) return acc;

          if (!acc.some((subject) => subject.name === key)) {
            acc.push({
              name: key,
            });
          }
          return acc;
        }, []);

        setSubjects(normalizedSubjects);
        console.log("Fetched subjects for class:", response.data);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [classInfo]);

  // Use hook to fetch students for the selected class
  const { students: studentsList, loading: studentsLoading } =
    useStudentsForClass(classInfo);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonPoints, setLessonPoints] = useState([]);
  const [pointsLoading, setPointsLoading] = useState(false);

  //get alll the subjects from the localstorage
  const allSubjects = JSON.parse(localStorage.getItem("subjects")) || [];

  // handle lesson selection and fetch points
  const handleSelectLesson = async (subject) => {
    setSelectedLesson(subject);
    console.log("Selected lesson:", subject);

    if (!classInfo || !subject) return;

    // Build class pair (e.g., "4-A")
    const classPair = classInfo.class_pair;

    // Get subject ID (required for the endpoint)
    const subjectId = allSubjects.find((sub) => sub.name === subject.name)?.id;

    if (!subjectId) {
      console.warn(
        "Cannot fetch points: subject ID not available. Subject:",
        subject
      );
      return;
    }

    setPointsLoading(true);
    try {
      // Build the URL: /students/points?class_pairs=["4-A"]&subject_id=9
      const classPairsParam = encodeURIComponent(JSON.stringify([classPair]));
      const url = `${
        endpoints.GET_LESSON_POINTS
      }?class_pairs=${classPairsParam}&subject_id=${encodeURIComponent(
        subjectId
      )}`;
      const response = await api.get(url);
      console.log("Lesson points response:", response);

      setLessonPoints(response.data || null);
      console.log("Fetched lesson points", response.data);
    } catch (err) {
      console.error("Failed to fetch lesson points", err);
      setLessonPoints([]);
    } finally {
      setPointsLoading(false);
    }
  };

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-gray-50/80 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-gray-200 bg-white/70 p-10 text-center shadow-sm">
          {/* <BookOpen className="mx-auto mb-4 h-10 w-10 text-gray-400" /> */}
          <h1 className="text-xl font-semibold text-gray-900">
            No class selected
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Return to the class list and pick a class to view its subjects.
            details.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back to classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 px-4 py-8">
      <div className="mx-auto  space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              {classInfo.grade && classInfo.class
                ? `${classInfo.grade}-${classInfo.class}`
                : "Unnamed class"}
            </h1>
            <h2 className="text-xl font-medium text-gray-700 mt-1">
              {`Class ID: ${classInfo.id}` || ""}
            </h2>
            {classInfo.teacher && (
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <User size={16} className="text-indigo-500" />
                Teacher: {classInfo.teacher}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Subjects</h2>
            {loading && (
              <span className="text-xs text-gray-400">Loading...</span>
            )}
          </div>
          <div className="main flex items-center justify-between w-full mt-4">
            {/* LEFT — SUBJECT TAGS */}
            <div className="left flex flex-wrap gap-2 items-center max-w-[70%]">
              {subjects.length ? (
                subjects.map((subject) => (
                  <button
                    key={subject.name}
                    type="button"
                    className={`flex-shrink-0 px-4 py-1 rounded-full text-sm font-medium shadow-sm transition-colors truncate
            ${
              selectedLesson?.name === subject.name
                ? "bg-indigo-500 text-white"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            }`}
                    onClick={() => handleSelectLesson(subject)}
                  >
                    {subject.name}
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-4 text-center text-gray-500">
                  {loading
                    ? "Fetching subjects..."
                    : "No subjects found for this class."}
                </div>
              )}
            </div>

            {/* RIGHT — FILTER BUTTON GROUP */}
            <div className="right flex items-center gap-2">
              {["Day", "Week", "Month", "All"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className="px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium
                   text-gray-700 hover:bg-gray-100 transition"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Scoring table: delegated to ScoreTableAdmin component */}
          {classInfo && (
            <div className="mt-6">
              <React.Suspense fallback={<div>Loading table...</div>}>
                {/* dynamic import is not necessary here, but Suspense keeps parity if needed later */}
                <ScoreTableAdmin
                  studentsList={studentsList}
                  loading={studentsLoading}
                  lessonPoints={lessonPoints}
                  pointsLoading={pointsLoading}
                  selectedSubject={selectedLesson}
                />
              </React.Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassSubjects;
