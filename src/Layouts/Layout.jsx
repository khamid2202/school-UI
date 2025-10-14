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
          // Apply left margin only on medium and larger screens where the sidebar is visible
          isExpanded ? "md:ml-36" : "md:ml-20"
        } p-6 pb-20`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default LayoutWithHeader;
