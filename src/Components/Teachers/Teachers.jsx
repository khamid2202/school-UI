import React from "react";
import tutors from "./dummyDataTutors.json";

function Teachers() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {tutors.map((tutor) => (
        <div
          key={tutor.id}
          className="bg-white rounded-2xl p-5 shadow-md border hover:shadow-lg transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {tutor.name[0]}
            </div>
            <div>
              <h3 className="font-semibold">{tutor.name}</h3>
              <p className="text-sm text-gray-500">{tutor.subject}</p>
            </div>
          </div>

          <span
            className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-3"
            style={{ backgroundColor: tutor.tagColor }}
          >
            {tutor.department}
          </span>

          <p className="text-sm mb-1">
            <strong>Students:</strong> {tutor.students}
          </p>
          <p className="text-sm mb-3">
            <strong>Classes:</strong> {tutor.classes}
          </p>

          <p className="text-sm text-gray-600 mb-1">{tutor.email}</p>
          <p className="text-sm text-gray-600 mb-4">{tutor.phone}</p>

          <div className="flex gap-2">
            <button className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-100">
              View Profile
            </button>
            <button className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">
              Contact
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
export default Teachers;
