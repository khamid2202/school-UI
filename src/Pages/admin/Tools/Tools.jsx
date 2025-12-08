import { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  BookOpen,
  Plus,
  Edit2,
  X,
  Save,
  Search,
} from "lucide-react";
import { endpoints } from "../../../Library/Endpoints";
import { api } from "../../../Library/RequestMaker";

function Tools() {
  const [activeTab, setActiveTab] = useState("academic-years");
  const [academicYears, setAcademicYears] = useState([]);
  const [billingCodes, setBillingCodes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);

  // Form data
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case "academic-years":
          await fetchAcademicYears();
          break;
        case "billing-codes":
          await fetchBillingCodes();
          break;
        case "subjects":
          await fetchSubjects();
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    const response = await api.get(endpoints.ACADEMIC_YEARS);
    // Axios wraps response in response.data
    const apiData = response.data || response;
    const data = apiData.academicYears || apiData.data || apiData || [];
    setAcademicYears(Array.isArray(data) ? data : []);
  };

  const fetchBillingCodes = async () => {
    const response = await api.get(endpoints.BILLING_CODES);
    // Axios wraps response in response.data
    const apiData = response.data || response;
    const data = apiData.billingCodes || apiData.data || apiData || [];
    setBillingCodes(Array.isArray(data) ? data : []);
  };

  const fetchSubjects = async () => {
    const response = await api.get(endpoints.SUBJECTS);
    // Axios wraps response in response.data
    const apiData = response.data || response;
    const data = apiData.subjects || apiData.data || apiData || [];
    setSubjects(Array.isArray(data) ? data : []);
  };

  const handleCreate = () => {
    setModalMode("create");
    setCurrentItem(null);
    setFormData(getEmptyFormData());
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode("edit");
    setCurrentItem(item);
    // Format dates for input fields (convert from ISO to YYYY-MM-DD)
    const formattedItem = { ...item };
    if (item.start_date) {
      formattedItem.start_date = item.start_date.split('T')[0];
    }
    if (item.end_date) {
      formattedItem.end_date = item.end_date.split('T')[0];
    }
    setFormData(formattedItem);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      let endpoint;
      let payload = { ...formData };

      // For academic years, ensure proper data types
      if (activeTab === "academic-years") {
        // Validate required fields
        if (!payload.name || !payload.start || !payload.end) {
          alert("Please fill in all required fields: Name, Start Year, and End Year");
          return;
        }

        payload = {
          name: payload.name,
          start: parseInt(payload.start),
          end: parseInt(payload.end),
          start_date: payload.start_date || null,
          end_date: payload.end_date || null,
          is_active: Boolean(payload.is_active),
        };
      }

      // For billing codes, ensure proper data types
      if (activeTab === "billing-codes") {
        // Validate required fields
        if (!payload.code || !payload.description || !payload.amount) {
          alert("Please fill in all required fields: Code, Description, and Amount");
          return;
        }

        if (modalMode === "create") {
          payload = {
            code: payload.code,
            category: payload.category || undefined,
            description: payload.description,
            amount: parseFloat(payload.amount),
            is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
          };
        } else {
          // For update, only send is_active
          payload = {
            is_active: Boolean(payload.is_active),
          };
        }

        console.log("Sending billing code payload:", payload);
      }

      if (modalMode === "create") {
        switch (activeTab) {
          case "academic-years":
            endpoint = `${endpoints.ACADEMIC_YEARS}/create`;
            break;
          case "billing-codes":
            endpoint = `${endpoints.BILLING_CODES}/create`;
            break;
          case "subjects":
            endpoint = `${endpoints.SUBJECTS}/create`;
            break;
          default:
            return;
        }
        console.log("Creating at endpoint:", endpoint, "with payload:", payload);
        await api.post(endpoint, payload);
      } else {
        switch (activeTab) {
          case "academic-years":
            endpoint = `${endpoints.ACADEMIC_YEARS}/update/${currentItem.id}`;
            break;
          case "billing-codes":
            endpoint = `${endpoints.BILLING_CODES}/update/${currentItem.id}`;
            break;
          case "subjects":
            endpoint = `${endpoints.SUBJECTS}/update/${currentItem.id}`;
            break;
          default:
            return;
        }
        console.log("Updating at endpoint:", endpoint, "with payload:", payload);
        await api.patch(endpoint, payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Save error:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save";
      alert(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  };

  const getEmptyFormData = () => {
    switch (activeTab) {
      case "academic-years":
        return {
          name: "",
          start: new Date().getFullYear(),
          end: new Date().getFullYear() + 1,
          start_date: "",
          end_date: "",
          is_active: true,
        };
      case "billing-codes":
        return { code: "", description: "", amount: "", category: "", is_active: true };
      case "subjects":
        return { name: "", code: "", description: "" };
      default:
        return {};
    }
  };

  const filterData = (data) => {
    let filtered = data;

    // Apply status filter for academic years and billing codes
    if ((activeTab === "academic-years" || activeTab === "billing-codes") && statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "active") return item.is_active === true;
        if (statusFilter === "inactive") return item.is_active === false;
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const tabs = [
    {
      id: "academic-years",
      label: "Academic Years",
      icon: <Calendar size={18} />,
    },
    {
      id: "billing-codes",
      label: "Billing Codes",
      icon: <DollarSign size={18} />,
    },
    { id: "subjects", label: "Subjects", icon: <BookOpen size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tools</h1>
        <p className="text-gray-600">
          Manage academic years, billing codes, and subjects
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-600 font-semibold"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Create */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {activeTab === "academic-years" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          )}
          {activeTab === "billing-codes" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          )}
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={20} />
          Create New
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeTab === "academic-years" && (
            <AcademicYearsTable
              data={filterData(academicYears)}
              onEdit={handleEdit}
            />
          )}
          {activeTab === "billing-codes" && (
            <BillingCodesTable
              data={filterData(billingCodes)}
              onEdit={handleEdit}
            />
          )}
          {activeTab === "subjects" && (
            <SubjectsTable
              data={filterData(subjects)}
              onEdit={handleEdit}
            />
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          mode={modalMode}
          activeTab={activeTab}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Academic Years Table
function AcademicYearsTable({ data, onEdit }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Academic Year
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Start
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            End
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Start Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            End Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.length === 0 ? (
          <tr>
            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
              No academic years found
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.start}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.end}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.start_date || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.end_date || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    item.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit2 size={16} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// Billing Codes Table
function BillingCodesTable({ data, onEdit }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Code
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Category
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Amount
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.length === 0 ? (
          <tr>
            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
              No billing codes found
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.code}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {item.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    item.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit2 size={16} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// Subjects Table
function SubjectsTable({ data, onEdit }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Code
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.length === 0 ? (
          <tr>
            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
              No subjects found
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.code}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {item.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit2 size={16} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// Modal Component
function Modal({ mode, activeTab, formData, setFormData, onSave, onClose }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderFields = () => {
    switch (activeTab) {
      case "academic-years":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (e.g., 2025-2026)
              </label>
              <input
                type="text"
                placeholder="e.g., 2025-2026"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Year
                </label>
                <input
                  type="number"
                  placeholder="2025"
                  value={formData.start || ""}
                  onChange={(e) =>
                    handleChange("start", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Year
                </label>
                <input
                  type="number"
                  placeholder="2026"
                  value={formData.end || ""}
                  onChange={(e) =>
                    handleChange("end", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => handleChange("start_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => handleChange("end_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
          </>
        );
      case "billing-codes":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                placeholder="e.g., TUITION_FEE"
                value={formData.code || ""}
                onChange={(e) => handleChange("code", e.target.value)}
                disabled={mode === "edit"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={mode === "edit"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="Category"
                value={formData.category || ""}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={mode === "edit"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) => handleChange("amount", e.target.value)}
                disabled={mode === "edit"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
            {mode === "edit" && (
              <div className="text-sm text-gray-500 italic">
                Note: Only the Active status can be changed. Other fields cannot be modified.
              </div>
            )}
          </>
        );
      case "subjects":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Subject name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                placeholder="Subject code"
                value={formData.code || ""}
                onChange={(e) => handleChange("code", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === "create" ? "Create New" : "Edit"}{" "}
            {activeTab
              .replace("-", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">{renderFields()}</div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Save size={16} />
            Save
          </button>
        </div>
          </div>
    </div>
  );
}

export default Tools;
