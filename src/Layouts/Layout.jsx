import React, { useState } from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function LayoutWithHeader() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Navbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

      {/* Main content area */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isExpanded ? "md:ml-56" : "md:ml-20"
        } px-6 py-4 overflow-x-hidden overflow-y-auto max-w-full`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default LayoutWithHeader;
