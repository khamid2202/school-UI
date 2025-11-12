import React, { useEffect, useState } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";
import { Users, User, Phone, Shield, Plus, Pencil, Loader2, AlertCircle, Eye, Mail, X } from "lucide-react";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    status: "active",
    roles: [],
    permissions: [],
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Input states for adding new roles/permissions
  const [newRole, setNewRole] = useState("");
  const [newPermission, setNewPermission] = useState("");

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
        email: editingTeacher.email || "",
        phone_number: editingTeacher.phone_number || "",
        password: "",
        status: editingTeacher.status || "active",
        roles: editingTeacher.roles || [],
        permissions: editingTeacher.permissions || [],
      });
      setHasChanges(false);
      setNewRole("");
      setNewPermission("");
    } else if (showAddModal) {
      // Reset form for new teacher
      setFormData({
        full_name: "",
        username: "",
        email: "",
        phone_number: "",
        password: "",
        status: "active",
        roles: ["teacher"],
        permissions: ["can_teach"],
      });
      setHasChanges(false);
      setNewRole("");
      setNewPermission("");
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
        (field === "email" && value !== (editingTeacher.email || "")) ||
        (field === "phone_number" && value !== (editingTeacher.phone_number || "")) ||
        (field === "status" && value !== (editingTeacher.status || "active")) ||
        (field === "password" && value !== "") ||
        (field === "roles" && JSON.stringify(value.sort()) !== JSON.stringify((editingTeacher.roles || []).sort())) ||
        (field === "permissions" && JSON.stringify(value.sort()) !== JSON.stringify((editingTeacher.permissions || []).sort()));
      
      setHasChanges(changed || Object.keys(formData).some((key) => {
        if (key === "password") return formData[key] !== "";
        if (key === "roles") return JSON.stringify(formData[key].sort()) !== JSON.stringify((editingTeacher.roles || []).sort());
        if (key === "permissions") return JSON.stringify(formData[key].sort()) !== JSON.stringify((editingTeacher.permissions || []).sort());
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
      email: "",
      phone_number: "",
      password: "",
      status: "active",
      roles: [],
      permissions: [],
    });
    setHasChanges(false);
    setError("");
    setNewRole("");
    setNewPermission("");
  };

  const handleAddRole = () => {
    if (newRole.trim() && !formData.roles.includes(newRole.trim())) {
      handleFormChange("roles", [...formData.roles, newRole.trim()]);
      setNewRole("");
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    handleFormChange("roles", formData.roles.filter(r => r !== roleToRemove));
  };

  const handleAddPermission = () => {
    if (newPermission.trim() && !formData.permissions.includes(newPermission.trim())) {
      handleFormChange("permissions", [...formData.permissions, newPermission.trim()]);
      setNewPermission("");
    }
  };

  const handleRemovePermission = (permissionToRemove) => {
    handleFormChange("permissions", formData.permissions.filter(p => p !== permissionToRemove));
  };

  const handleSave = async () => {
    setError("");
    
    // Validation
    if (!formData.full_name.trim()) {
      setError("Full name is required");
      return;
    }
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    if (!editingTeacher && !formData.password) {
      setError("Password is required for new teachers");
      return;
    }
    if (!editingTeacher && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (editingTeacher && formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    
    try {
      if (editingTeacher) {
        // Update existing teacher
        const payload = {
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email || undefined,
          phone: formData.phone_number || undefined,
          status: formData.status,
          roles: formData.roles,
          permissions: formData.permissions,
        };

        // Only include password if it was changed
        if (formData.password) {
          payload.password = formData.password;
        }

        const response = await api.patch(
          `${endpoints.UPDATE_USER}/${editingTeacher.id}`,
          payload
        );
        
        if (response.data && response.data.ok) {
          // Refetch teachers list
          const res = await api.get(endpoints.TEACHERS);
          if (res.data && Array.isArray(res.data.users)) {
            setTeachers(res.data.users);
            setFilteredTeachers(res.data.users);
          }
          closeModal();
        }
      } else {
        // Create new teacher
        const payload = {
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email || undefined,
          password: formData.password,
          phone: formData.phone_number || undefined,
          status: formData.status,
          role: formData.roles[0] || "teacher", // For backward compatibility
          roles: formData.roles,
          permissions: formData.permissions,
        };

        const response = await api.post(endpoints.CREATE_USER, payload);
        
        if (response.data && response.data.ok) {
          // Refetch teachers list
          const res = await api.get(endpoints.TEACHERS);
          if (res.data && Array.isArray(res.data.users)) {
            setTeachers(res.data.users);
            setFilteredTeachers(res.data.users);
          }
          closeModal();
        }
      }
    } catch (err) {
      console.error("Failed to save teacher:", err);
      setError(err.response?.data?.message || "Failed to save teacher. Please try again.");
    } finally {
      setSaving(false);
    }
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
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setViewingTeacher(teacher)}
                    className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-medium"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onClick={() => setEditingTeacher(teacher)}
                    className="flex items-center gap-1 px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-xs font-medium"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>
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
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

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

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  placeholder="john.doe@example.com"
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {!editingTeacher && <span className="text-red-500">*</span>}
                  {editingTeacher && <span className="text-gray-500 text-xs">(leave empty to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  placeholder={editingTeacher ? "Enter new password to change" : "Minimum 6 characters"}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

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
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {/* Current roles */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.roles && formData.roles.length > 0 ? (
                      formData.roles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(role)}
                            className="hover:text-indigo-900"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No roles assigned</span>
                    )}
                  </div>
                  
                  {/* Add new role */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                      placeholder="Add role (e.g., teacher, admin)"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddRole}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {/* Current permissions */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.permissions && formData.permissions.length > 0 ? (
                      formData.permissions.map((permission, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {permission}
                          <button
                            type="button"
                            onClick={() => handleRemovePermission(permission)}
                            className="hover:text-purple-900"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No permissions assigned</span>
                    )}
                  </div>
                  
                  {/* Add new permission */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPermission())}
                      placeholder="Add permission (e.g., can_teach)"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddPermission}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={(editingTeacher && !hasChanges) || saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingTeacher ? (hasChanges ? "Update" : "No Changes") : "Add"} Teacher
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {viewingTeacher.full_name || viewingTeacher.username}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Teacher Details</p>
              </div>
              <button
                onClick={() => setViewingTeacher(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    viewingTeacher.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {viewingTeacher.status || "unknown"}
                </span>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Full Name</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {viewingTeacher.full_name || "N/A"}
                  </p>
                </div>

                {/* Username */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Username</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {viewingTeacher.username || "N/A"}
                  </p>
                </div>

                {/* Email */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Email</span>
                  </div>
                  <p className="text-gray-900 font-medium break-all">
                    {viewingTeacher.email || "N/A"}
                  </p>
                </div>

                {/* Phone */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Phone Number</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {viewingTeacher.phone_number || "N/A"}
                  </p>
                </div>

                {/* User ID */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">User ID</span>
                  </div>
                  <p className="text-gray-900 font-mono text-sm">
                    {viewingTeacher.id || viewingTeacher.uuid || "N/A"}
                  </p>
                </div>

                {/* UUID */}
                {viewingTeacher.uuid && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={18} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">UUID</span>
                    </div>
                    <p className="text-gray-900 font-mono text-xs break-all">
                      {viewingTeacher.uuid}
                    </p>
                  </div>
                )}
              </div>

              {/* Roles Section */}
              {viewingTeacher.roles && viewingTeacher.roles.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewingTeacher.roles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions Section */}
              {viewingTeacher.permissions && viewingTeacher.permissions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Permissions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewingTeacher.permissions.map((permission, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingTeacher.created_at && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 block mb-1">
                      Created At
                    </span>
                    <p className="text-gray-900 text-sm">
                      {new Date(viewingTeacher.created_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {viewingTeacher.updated_at && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 block mb-1">
                      Last Updated
                    </span>
                    <p className="text-gray-900 text-sm">
                      {new Date(viewingTeacher.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-between items-center">
              <button
                onClick={() => {
                  setViewingTeacher(null);
                  setEditingTeacher(viewingTeacher);
                }}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition font-medium"
              >
                <Pencil size={16} />
                Edit Teacher
              </button>
              <button
                onClick={() => setViewingTeacher(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
