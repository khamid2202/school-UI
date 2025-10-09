import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { sendLogoutRequest } from "../Library/Authenticate.jsx";

function Navbar({ isExpanded, setIsExpanded }) {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isActive = (path) => location.pathname === path;

  const user = JSON.parse(localStorage.getItem("user")) || "{}";

  const firstLetter =
    user.user.username && typeof user.user.username === "string"
      ? user.user.username.charAt(0).toUpperCase()
      : "U";

  const navItems = [
    { to: "/home", icon: <Home size={20} />, label: "Home" },
    { to: "/classes", icon: <BookOpen size={20} />, label: "Classes" },
    {
      to: "/tuition-payments",
      icon: <CreditCard size={20} />,
      label: "Payment",
    },
    { to: "/teachers", icon: <Users size={20} />, label: "Tutors" },
    { to: "/scores", icon: <BarChart2 size={20} />, label: "Scoring" },
  ];

  const handleLogOut = () => {
    setShowModal(true);
    setShowSettings(false);
  };

  const confirmLogout = () => {
    setShowModal(false);
    localStorage.clear();
    sendLogoutRequest({
      onSuccess: () => {
        window.location.href = "/login";
      },
      onFail: (error) => {
        console.error("Logout failed:", error);
      },
    });
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  return (
    <>
      <nav
        className={`flex flex-col justify-between bg-white border-r border-gray-200 h-screen shadow-md fixed left-0 top-0 z-40 transition-all duration-300 ${
          isExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Top Section */}
        <div>
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-5 py-6 border-b">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {firstLetter}
            </div>
            {isExpanded && (
              <div>
                <h1 className="font-semibold text-gray-800">
                  {user.user.full_name || "User"}
                </h1>
                <p className="text-sm text-gray-500">
                  {user.user.username || "Admin Panel"}
                </p>
              </div>
            )}
          </div>

          {/* Nav Links */}
          <div className="flex flex-col mt-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-5 py-3 mx-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.to)
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                }`}
              >
                {item.icon}
                {isExpanded && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t flex justify-between items-center relative">
          {/* Settings Button */}
          <button
            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 font-semibold hover:from-gray-300 hover:to-gray-400 transition flex items-center justify-center"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <Settings size={18} className="mr-2" />
            {isExpanded && "Settings"}
          </button>

          {/* Collapse / Expand Button */}
          <button
            className="absolute -right-3 bottom-6 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-100 transition"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? (
              <ChevronLeft className="text-gray-600" size={20} />
            ) : (
              <ChevronRight className="text-gray-600" size={20} />
            )}
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div
              className={`absolute left-0 bottom-16 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 flex flex-col items-center`}
            >
              <button
                className="w-11/12 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
                onClick={handleLogOut}
              >
                <LogOut size={18} />
                {isExpanded && "Log Out"}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[300px] flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              Confirm Logout
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                onClick={confirmLogout}
              >
                Yes, Log Out
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
