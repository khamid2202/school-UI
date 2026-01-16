import React, { useEffect } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

// User data is now fetched and managed by AuthContext
function LandingPage() {
  // Fetch classes for local caching (these are public/shared data)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const result = await api.get(endpoints.GROUPS, {});
        if (result.data) {
          localStorage.setItem("classes", JSON.stringify(result.data.groups));
        }
      } catch (error) {
        console.log("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Latest from LangApex
          </h1>
        </div>
      </div>
    </div>
  );
}
export default LandingPage;
