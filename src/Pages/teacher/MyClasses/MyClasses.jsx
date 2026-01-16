import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import { useAuth } from "../../../Hooks/AuthContext.jsx";

function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Get logged-in teacher's name from AuthContext (verified by server)
  const { username: teacherName } = useAuth();

  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!teacherName) {
        setError("Teacher not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = `${endpoints.GET_DATA_FROM_TIMETABLE}`;
        const response = await api.get(url);

        const timetableEntries = response.data?.timetable || [];
        console.log("Timetable data:", timetableEntries);

        // Filter lessons where teacher matches logged-in user
        const myLessons = timetableEntries.filter(
          (entry) =>
            entry.teacher &&
            entry.teacher.toLowerCase() === teacherName.toLowerCase()
        );

        console.log("My lessons:", myLessons);

        // Group lessons by class_pair to get unique classes
        const classMap = new Map();
        myLessons.forEach((lesson) => {
          const classPair =
            lesson.class_pair || `${lesson.grade}-${lesson.class}`;
          if (!classMap.has(classPair)) {
            classMap.set(classPair, {
              class_pair: classPair,
              grade: lesson.grade,
              class: lesson.class,
              lessons: [],
            });
          }
          classMap.get(classPair).lessons.push(lesson);
        });

        const uniqueClasses = Array.from(classMap.values());
        setClasses(uniqueClasses);
        console.log("Unique classes:", uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch timetable:", err);
        setError("Failed to fetch classes");
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, [teacherName]);

  const handleClassClick = (classData) => {
    console.log("Class clicked:", classData);
    console.log("Lessons for this class:", classData.lessons);
    navigate("/home/my-classes/my-lessons", { state: { classData } });
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-2">
          {classes.length} class{classes.length !== 1 ? "es" : ""} found
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Classes Assigned
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            You don't have any classes assigned yet. Contact your administrator
            to assign classes to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {classes.map((classData) => (
            <button
              key={classData.class_pair}
              onClick={() => handleClassClick(classData)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 text-left cursor-pointer transform hover:scale-105 duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {classData.class_pair}
                </h3>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>
                    {classData.lessons.length} lesson
                    {classData.lessons.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-indigo-600 font-medium">
                  Click to view details →
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyClasses;
