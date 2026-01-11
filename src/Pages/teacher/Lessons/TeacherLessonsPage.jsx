import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import DaySelector from "./DaySelector.jsx";
import LessonsList from "./LessonsList.jsx";

function TeacherLessonsPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch lessons for the selected date
  const fetchLessons = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/timetable/my-lessons`, {
        date: date,
      });

      const lessonsData = response.data?.lessons || [];
      setLessons(lessonsData);
      console.log("Lessons fetched for", date, ":", lessonsData);
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
      setError("Failed to fetch lessons. Please try again.");
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lessons when selected date changes
  useEffect(() => {
    fetchLessons(selectedDate);
  }, [selectedDate, fetchLessons]);

  const handleDayChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleLessonClick = (lesson) => {
    const query = new URLSearchParams({
      date: selectedDate,
      class: lesson.class_pair || `${lesson.grade || ""}-${lesson.class || ""}`,
      groupId: lesson.group_id || lesson.class_pair || "",
      lessonType: lesson.lesson_type || lesson.subject || "lesson",
      subjectId: lesson.subject_id || "",
    }).toString();

    navigate(`/teacher/lessons/${lesson.id}/students?${query}`, {
      state: {
        lesson,
        selectedDate,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">My Lessons</h1>
        </div>
        <p className="hidden sm:block text-gray-600 text-sm sm:text-base">
          View your daily lessons and manage student performance points
        </p>
      </header>

      {/* Day Selector */}
      <div className="mb-8">
        <DaySelector
          selectedDate={selectedDate}
          onDateChange={handleDayChange}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="ml-3 text-gray-600">Loading lessons...</p>
        </div>
      )}

      {/* Lessons List */}
      {!loading && !error && (
        <LessonsList
          lessons={lessons}
          onLessonClick={handleLessonClick}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

export default TeacherLessonsPage;
