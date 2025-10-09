import React, { useEffect, useState } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import { BookOpen, Users, User, MapPin, Clock } from "lucide-react";

function Classes() {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(endpoints.GROUPS);
        if (res.data?.groups) {
          setClasses(res.data.groups);
          setFilteredClasses(res.data.groups);
          localStorage.setItem("classes", JSON.stringify(res.data.groups));
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredClasses(classes);
    } else {
      const s = search.toLowerCase();
      setFilteredClasses(
        classes.filter(
          (c) =>
            c.name?.toLowerCase().includes(s) ||
            c.teacher?.toLowerCase().includes(s)
        )
      );
    }
  }, [search, classes]);

  if (loading) {
    return <div className="p-6 text-lg">Loading classes...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Classes</h1>
        <p className="text-gray-500">Browse all available classes</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Classes</p>
            <h3 className="text-xl font-bold">{classes.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <h3 className="text-xl font-bold">
              {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <User size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Teachers</p>
            <h3 className="text-xl font-bold">
              {new Set(classes.map((c) => c.teacher?.toLowerCase())).size || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No classes found.
          </div>
        ) : (
          filteredClasses.map((c) => (
            <div
              key={c.id || c.uuid}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 relative"
            >
              <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                Active
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <BookOpen size={22} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {c.name || "Unnamed Class"}
                </h3>
              </div>
              {c.teacher && (
                <p className="text-gray-600 flex items-center gap-2">
                  <User size={16} /> {c.teacher}
                </p>
              )}
              {c.day && c.startTime && c.endTime && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  {c.day}, {c.startTime} - {c.endTime}
                </p>
              )}
              {c.room && (
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin size={16} /> Room {c.room}
                </p>
              )}
              {c.studentCount && (
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Users size={16} /> {c.studentCount} Students
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Classes;
