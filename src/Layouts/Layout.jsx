import React, { useState } from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function LayoutWithHeader() {
  // Sidebar expanded/collapsed state
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Pass both props */}
      <Navbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

      {/* Main content area */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isExpanded ? "ml-64" : "ml-20"
        } p-6`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default LayoutWithHeader;
