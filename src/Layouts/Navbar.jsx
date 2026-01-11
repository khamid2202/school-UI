import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  CreditCard,
  Users,
  BarChart2,
  Calendar,
  Settings,
  Wrench,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardPenLine,
} from "lucide-react";
import { sendLogoutRequest } from "../Library/Authenticate.jsx";

function Navbar({ isExpanded, setIsExpanded }) {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [showText, setShowText] = useState(isExpanded);

  const isActive = (path) => location.pathname === path;

  // Safely parse the stored user. The app sometimes stores either { user: { ... } }
  // or the user object directly. Also guard against missing/malformed JSON.
  let user = {};
  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn(
      "Invalid user JSON in localStorage, falling back to empty user",
      e
    );
    user = {};
  }

  // Support both shapes: { user: { username } } and { username }
  const username = (user && (user.user?.username || user.username)) || "";
  const firstLetter = username ? username.charAt(0).toUpperCase() : "U";

  // Extract roles from user object
  const roles = (user && (user.user?.roles || user.roles)) || [];
  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");

  // Filter navItems based on user role
  const getVisibleNavItems = () => {
    const allItems = [
      { to: "/home", icon: <Home size={20} />, label: "Home" },
      { to: "/classes", icon: <BookOpen size={20} />, label: "Classes" },
      {
        to: "/payments",
        icon: <CreditCard size={20} />,
        label: "Payment",
      },
      { to: "/teachers", icon: <Users size={20} />, label: "Tutors" },
      {
        to: "/classes-to-view",
        icon: <BarChart2 size={20} />,
        label: "Scores",
      },
      { to: "/timetable", icon: <Calendar size={20} />, label: "Timetable" },
      {
        to: "/management",
        icon: <Wrench size={20} />,
        label: "AdminTools",
      },
      // { to: "/exams", icon: <ClipboardPenLine size={20} />, label: "Exams" },
      {
        to: "/new-payments",
        icon: <CreditCard size={20} />,
        label: "New Payments",
      },
      {
        to: "/home/my-classes",
        icon: <BookOpen size={20} />,
        label: "Classes",
      },
      {
        to: "/teacher/lessons",
        icon: <ClipboardPenLine size={20} />,
        label: "Lessons",
      },
    ];

    // If user is admin, show all items
    if (isAdmin) {
      return allItems;
    }

    // If user is only teacher (default), show only Home, My Classes, and Exams
    if (isTeacher) {
      return allItems.filter(
        (item) =>
          item.to === "/home" ||
          item.to === "/exams" ||
          item.to === "/home/my-classes" ||
          item.to === "/teacher/lessons"
      );
    }

    // Fallback: show only Home and Exams
    return allItems.filter(
      (item) => item.to === "/home" || item.to === "/exams"
    );
  };

  const navItems = getVisibleNavItems();

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

  const handleToggleEnter = () => setShowToggle(true);
  const handleToggleLeave = () => setShowToggle(false);

  // Smooth text reveal - fade in after width transition starts
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setShowText(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowText(false);
    }
  }, [isExpanded]);

  return (
    <>
      <nav
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 h-screen shadow-md fixed left-0 top-0 z-40 transition-[width] duration-300 ease-in-out ${
          isExpanded ? "w-56" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full w-full relative">
          {/* Collapse / Expand Button */}
          <div
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-50"
            onMouseEnter={handleToggleEnter}
            onMouseLeave={handleToggleLeave}
          >
            <button
              className={`bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-100 transition-opacity duration-100 z-50 ${
                showToggle ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? (
                <ChevronLeft className="text-gray-600" size={20} />
              ) : (
                <ChevronRight className="text-gray-600" size={20} />
              )}
            </button>
          </div>

          {/* Top Section */}

          {/* Logo Section */}
          <div className="flex flex-row items-center gap-2 px-3 py-6 border-b">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex justify-center items-center text-white text-lg font-bold">
              {firstLetter}
            </div>
            <div className="text-left min-w-0 flex-1 overflow-hidden">
              <h1
                className={`text-lg font-semibold text-gray-800 truncate whitespace-nowrap transition-opacity duration-300 ${
                  isExpanded && showText ? "opacity-100" : "opacity-0"
                } ${!isExpanded ? "w-0" : ""}`}
              >
                {user.user?.full_name || user.full_name || "User"}
              </h1>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex flex-col mt-2 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-4 mx-3 rounded-xl transition-all ${
                  isActive(item.to)
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span
                  className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${
                    isExpanded && showText ? "opacity-100" : "opacity-0"
                  } ${!isExpanded ? "w-0 overflow-hidden" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="p-4 border-t flex justify-between items-center mt-auto">
            {/* Settings Button */}
            <button
              className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 font-semibold hover:from-gray-300 hover:to-gray-400 transition flex items-center"
              onClick={() => setShowSettings((prev) => !prev)}
            >
              <Settings size={20} className="flex-shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-300 ${
                  isExpanded && showText
                    ? "opacity-100 ml-2"
                    : "opacity-0 w-0 overflow-hidden ml-0"
                }`}
              >
                Settings
              </span>
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div
                className={`bg-white absolute left-0 bottom-16 border border-gray-200 rounded-xl shadow-lg py-1 px-1 z-50 flex flex-col items-center ${
                  isExpanded ? "w-full" : "w-20"
                }`}
              >
                <button
                  className="w-11/12 flex items-center gap-2 px-4 py-1 rounded-lg hover:bg-gray-100 transition text-gray-700"
                  onClick={handleLogOut}
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  <span
                    className={`whitespace-nowrap transition-opacity duration-300 ${
                      isExpanded && showText ? "opacity-100" : "opacity-0"
                    } ${!isExpanded ? "w-0 overflow-hidden" : ""}`}
                  >
                    Log Out
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className="ml-5 w-6 h-screen absolute right-0 top-0 "
          onMouseEnter={handleToggleEnter}
          onMouseLeave={handleToggleLeave}
          aria-hidden="true"
        />
      </nav>

      {/* Mobile bottom navigation (visible on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto ">
          <div className="flex items-center justify-between py-2">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col  items-center justify-center text-xs gap-1 w-1/6 py-1 transition`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      active
                        ? "bg-white ring-2 ring-indigo-500 text-indigo-600 shadow"
                        : "text-gray-600"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`${
                      active ? "text-indigo-600 font-medium" : "text-gray-600"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

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
