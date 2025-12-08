import React, { useEffect } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

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

  //fetch the subjects and set them to localStorage
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const result = await api.get(endpoints.GET_SUBJECTS, {
          withCredentials: true,
        });
        if (result.data) {
          localStorage.setItem("subjects", JSON.stringify(result.data));
          // console.log("Fetched subjects:", result.data);
        } else {
          console.log("Error fetching subjects:", result.error || "No data");
        }
      } catch (error) {
        console.log("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  //fetch classes and set them to localStorage
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const result = await api.get(endpoints.GROUPS, {});
        if (result.data) {
          localStorage.setItem("classes", JSON.stringify(result.data.groups));
          // console.log("Fetched classes:", result.data);
        } else {
          console.log("Error fetching classes:", result.error || "No data");
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
