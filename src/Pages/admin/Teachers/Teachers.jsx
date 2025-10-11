import React, { useEffect, useState } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get(
          endpoints.TEACHERS,
          {},
          { withCredentials: true }
        );
        // The teachers are in res.data.users
        if (res.data && Array.isArray(res.data.users)) {
          setTeachers(res.data.users);
          setFilteredTeachers(res.data.users);
          localStorage.setItem("teachers", JSON.stringify(res.data.users));
        } else {
          setTeachers([]);
          setFilteredTeachers([]);
        }
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        setTeachers([]);
        setFilteredTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredTeachers(teachers);
    } else {
      const lowerSearch = search.toLowerCase();
      setFilteredTeachers(
        teachers.filter(
          (teacher) =>
            teacher.full_name?.toLowerCase().includes(lowerSearch) ||
            teacher.username?.toLowerCase().includes(lowerSearch)
        )
      );
    }
  }, [search, teachers]);

  if (loading) {
    return <div className="p-6 text-lg">Loading teachers...</div>;
  }

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers by name or username..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No teachers found.
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div
              key={teacher.id || teacher.uuid}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col items-start hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold text-indigo-700 mb-2">
                {teacher.full_name || teacher.username || "Unnamed Teacher"}
              </h3>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Username:</span>{" "}
                {teacher.username}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">ID:</span>{" "}
                {teacher.id || teacher.uuid}
              </p>
              {teacher.roles && teacher.roles.length > 0 && (
                <p className="text-gray-600 mb-1">
                  <span className="font-semibold">Roles:</span>{" "}
                  {teacher.roles.join(", ")}
                </p>
              )}
              {teacher.permissions && teacher.permissions.length > 0 && (
                <p className="text-gray-600 mb-1">
                  <span className="font-semibold">Permissions:</span>{" "}
                  {teacher.permissions.join(", ")}
                </p>
              )}
              {teacher.phone_number && (
                <p className="text-gray-500">
                  <span className="font-semibold">Phone:</span>{" "}
                  {teacher.phone_number}
                </p>
              )}
              {teacher.status && (
                <p className="text-gray-500">
                  <span className="font-semibold">Status:</span>{" "}
                  {teacher.status}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Teachers;
