import React, { useEffect } from "react";
import { api } from "../../Library/RequestMaker.jsx";
import { endpoints } from "../../Library/Endpoints.jsx";

// Fetch the user from the backend and store it in localStorage when LandingPage mounts
function LandingPage() {
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await api.get(endpoints.USER, { withCredentials: true });
        if (result.data) {
          localStorage.setItem("user", JSON.stringify(result.data));
          console.log("Fetched user:", result.data);
        } else {
          console.log("Error fetching user:", result.error || "No data");
        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Dashboard Content</h1>
      </div>
    </div>
  );
}

export default LandingPage;
