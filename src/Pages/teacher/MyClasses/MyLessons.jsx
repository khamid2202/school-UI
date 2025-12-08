import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

function MyLessons() {
  const location = useLocation();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const classData = location.state?.classData || null;

  useEffect(() => {
    if (!classData || !classData.lessons) {
      setError("Class data not found");
      setLoading(false);
      return;
    }

    // Deduplicate lessons by subject name (keep first occurrence)
    const seenSubjects = new Set();
    const uniqueLessons = classData.lessons.filter((lesson) => {
      const subject = lesson.subject || "Untitled Lesson";
      if (seenSubjects.has(subject)) {
        return false;
      }
      seenSubjects.add(subject);
      return true;
    });

    setLoading(false);
    setLessons(uniqueLessons);
    console.log("Lessons for class:", classData.class_pair, uniqueLessons);
  }, [classData]);

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <p className="text-lg text-gray-600">Loading lessons...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-lg text-red-600 mb-4">
            {error || "No class data found"}
          </p>
          <button
            onClick={() => navigate("/home/my-classes")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
          >
            <ArrowLeft size={16} /> Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/home/my-classes")}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
              title="Back to classes"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Lessons - {classData.class_pair}
            </h1>
          </div>
          <p className="text-gray-600 mt-2 ml-12">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Lessons Found
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            No lessons are scheduled for this class yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow hover:shadow-md transition p-6 border-l-4 border-indigo-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {lesson.subject || "Untitled Lesson"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {lesson.day && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} className="text-indigo-500" />
                        <div>
                          <p className="text-xs text-gray-500">Day</p>
                          <p className="font-medium">{lesson.day}</p>
                        </div>
                      </div>
                    )}

                    {lesson.grade && lesson.class && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={18} className="text-indigo-500" />
                        <div>
                          <p className="text-xs text-gray-500">Class</p>
                          <p className="font-medium">
                            {lesson.grade}-{lesson.class}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0 text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {lesson.subject || "Lesson"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Import Calendar icon
import { Calendar } from "lucide-react";

export default MyLessons;
