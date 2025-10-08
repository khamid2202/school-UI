import React from "react";
import classes from "./dummyDataClasses.json";

function Classes() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Class Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition duration-300"
          >
            <h3 className="text-3xl font-extrabold text-indigo-700 mb-2">
              {classItem.className || "Unnamed Class"}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>📚 Subject:</strong> {classItem.subject}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>👥 Students:</strong> {classItem.students}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>🎂 Age:</strong> {classItem.age || "N/A"}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>📍 Room:</strong> {classItem.room}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>👨‍🏫 Teacher:</strong> {classItem.teacher.name} (
              {classItem.teacher.specialization})
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition">
                View Details
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition">
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Classes;
