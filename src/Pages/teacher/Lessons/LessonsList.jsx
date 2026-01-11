import React from "react";
import { BookOpen, Clock, MapPin, Users } from "lucide-react";

function LessonsList({ lessons, onLessonClick, selectedDate }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (!lessons || lessons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No lessons scheduled
        </h3>
        <p className="text-gray-600">
          You don't have any lessons scheduled for {formatDate(selectedDate)}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Lessons for {formatDate(selectedDate)}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {lessons.map((lesson, index) => (
          <button
            key={lesson.id || index}
            onClick={() => onLessonClick(lesson)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 text-left hover:border-blue-400 border border-transparent"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {lesson.subject || "Untitled"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {lesson.class_pair || `Grade ${lesson.grade}-${lesson.class}`}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  {lesson.start_time && lesson.end_time
                    ? `${lesson.start_time} - ${lesson.end_time}`
                    : lesson.time_slot || "Time TBD"}
                </span>
              </div>

              {lesson.room && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Room {lesson.room}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm">Click to add points</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                Manage Points
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LessonsList;
