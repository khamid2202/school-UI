// src/Components/Navbar/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex justify-between items-center bg-gray-900 text-white px-6 py-3 shadow-md">
      {/* Left side - Nav Links */}
      <div className="flex space-x-6">
        <Link to="/home" className="hover:text-gray-300">
          Home
        </Link>
        <Link to="/tuition-payments" className="hover:text-gray-300">
          Tuition Payments
        </Link>
        <Link to="/configuration" className="hover:text-gray-300">
          Configuration
        </Link>
        <Link to="/help" className="hover:text-gray-300">
          Help
        </Link>
      </div>

      {/* Right side - Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
        >
          <span className="text-lg font-bold">P</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg py-2">
            <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left">
              Change Password
            </button>
            <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left">
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
