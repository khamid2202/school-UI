import React, { useEffect, useState } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import { Users, User, Phone, Shield, Plus, Pencil } from "lucide-react";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone_number: "",
    password: "",
    status: "active",
  });
  const [hasChanges, setHasChanges] = useState(false);

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (editingTeacher) {
      // Populate form with existing teacher data
      setFormData({
        full_name: editingTeacher.full_name || "",
        username: editingTeacher.username || "",
        phone_number: editingTeacher.phone_number || "",
        password: "",
        status: editingTeacher.status || "active",
      });
      setHasChanges(false);
    } else if (showAddModal) {
      // Reset form for new teacher
      setFormData({
        full_name: "",
        username: "",
        phone_number: "",
        password: "",
        status: "active",
      });
      setHasChanges(false);
    }
  }, [editingTeacher, showAddModal]);

  // Check if form has changes (for edit mode)
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (editingTeacher) {
      // Check if any field has changed from original
      const changed = 
        (field === "full_name" && value !== (editingTeacher.full_name || "")) ||
        (field === "username" && value !== (editingTeacher.username || "")) ||
        (field === "phone_number" && value !== (editingTeacher.phone_number || "")) ||
        (field === "status" && value !== (editingTeacher.status || "active")) ||
        (field === "password" && value !== "");
      
      setHasChanges(changed || Object.keys(formData).some((key) => {
        if (key === "password") return formData[key] !== "";
        return formData[key] !== (editingTeacher[key] || "");
      }));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTeacher(null);
    setFormData({
      full_name: "",
      username: "",
      phone_number: "",
      password: "",
      status: "active",
    });
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="text-lg text-gray-600">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">All Teachers</h1>
          <p className="text-gray-500 mt-1">Browse all teaching staff</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition whitespace-nowrap"
        >
          <Plus size={20} />
          Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers..."
          className="w-full sm:w-96 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Teachers</p>
            <h3 className="text-xl font-bold">{teachers.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <User size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Now</p>
            <h3 className="text-xl font-bold">
              {teachers.filter((t) => t.status === "active").length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Shield size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Filtered Results</p>
            <h3 className="text-xl font-bold">{filteredTeachers.length}</h3>
          </div>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No teachers found.</p>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div
              key={teacher.id || teacher.uuid}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 border border-gray-100 flex flex-col"
            >
              {/* Teacher Name */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {teacher.full_name || teacher.username || "Unnamed Teacher"}
                  </h3>
                  <p className="text-sm text-gray-500">@{teacher.username}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm flex-1 pb-3">
                {teacher.phone_number && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{teacher.phone_number}</span>
                  </div>
                )}

                {teacher.roles && teacher.roles.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Shield size={16} className="text-gray-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {teacher.roles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Always at bottom */}
              <div className="pt-4 border-t flex items-center justify-between">
                {teacher.status && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      teacher.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {teacher.status}
                  </span>
                )}
                <button
                  onClick={() => setEditingTeacher(teacher)}
                  className="flex items-center gap-1 px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-xs font-medium ml-auto"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Teacher Modal */}
      {(showAddModal || editingTeacher) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingTeacher ? "Update teacher information" : "Fill in the details to add a new teacher"}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleFormChange("full_name", e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleFormChange("username", e.target.value)}
                  placeholder="johndoe"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleFormChange("phone_number", e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Password (only for new teacher) */}
              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select 
                  value={formData.status}
                  onChange={(e) => handleFormChange("status", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save logic
                  closeModal();
                }}
                disabled={editingTeacher && !hasChanges}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTeacher ? (hasChanges ? "Update" : "No Changes") : "Add"} Teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
