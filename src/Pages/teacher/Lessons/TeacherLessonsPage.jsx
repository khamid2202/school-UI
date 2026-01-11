import React, { useEffect, useState, useCallback } from "react";
import { Calendar, AlertCircle, Loader } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import DaySelector from "./DaySelector.jsx";
import LessonsList from "./LessonsList.jsx";
import StudentPointsModal from "./StudentPointsModal.jsx";
import toast from "react-hot-toast";

function TeacherLessonsPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
    setSelectedLesson(null); // Clear selected lesson when changing day
  };

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedLesson(null);
  };

  const handlePointsSubmitted = () => {
    // Refresh lessons after points are submitted
    toast.success("Points submitted successfully!");
    handleModalClose();
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

      {/* Student Points Modal */}
      {showModal && selectedLesson && (
        <StudentPointsModal
          lesson={selectedLesson}
          isOpen={showModal}
          onClose={handleModalClose}
          onPointsSubmitted={handlePointsSubmitted}
        />
      )}
    </div>
  );
}

export default TeacherLessonsPage;
