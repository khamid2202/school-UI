import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  ChevronRight,
} from "lucide-react";

function Navbar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Track mouse near left edge
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setIsOpen]);

  return (
    <>
      {/* Invisible hotspot on the left edge */}
      {!isOpen && (
        <div
          className="fixed left-0 top-0 h-full w-4 z-50"
          onMouseEnter={() => setShowButton(true)}
          onMouseLeave={() => setShowButton(false)}
        >
          {/* Open Button */}
          {showButton && (
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-500 text-white rounded-r-xl px-2 py-3 shadow-lg opacity-80 hover:opacity-100 transition"
              aria-label="Open sidebar"
              onClick={() => setIsOpen(true)}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`flex flex-col justify-between bg-white border-r border-gray-200 w-64 h-screen shadow-md fixed left-0 top-0 z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-6 border-b">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              LA
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">LangApex</h1>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex flex-col mt-4">
            <Link
              to="/home"
              className={`flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/home")
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Home size={18} />
              Home
            </Link>
            <Link
              to="/classes"
              className={`flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/classes")
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <BookOpen size={18} />
              Classes
            </Link>
            <Link
              to="/tuition-payments"
              className={`flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/tuition-payments")
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <CreditCard size={18} />
              Payment
            </Link>
            <Link
              to="/teachers"
              className={`flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/teachers")
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Users size={18} />
              Tutors
            </Link>
            <Link
              to="/scores"
              className={`flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/scores")
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <BarChart2 size={18} />
              Scoring
            </Link>
            <Link
              to="/configuration"
              className={`flex items-center gap-3 px-5 py-3 mx-3 mb-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/configuration")
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Settings size={18} />
              Configuration
            </Link>
          </div>
        </div>

        {/* Bottom Log Out */}
        <div className="p-4 border-t">
          <button
            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Log Out
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
