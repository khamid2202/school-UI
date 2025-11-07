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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Latest News from LangApex
          </h1>
          <p className="text-gray-500 mt-1">
            Watch our latest videos and updates
          </p>
        </div>
        <div className="mt-4 gap-1 md:grid md:grid-cols-2 flex flex-col ">
        <iframe
        className="mb-4 rounded-xl w-full h-80"
        src="https://www.youtube.com/embed/SjQQTk8NVBI"
        title="LangApex"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      <iframe
        className="mb-4 rounded-xl w-full h-80"
        src="https://www.youtube.com/embed/Vl7Dczy0syY"
        title="LangApex"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
       <iframe
        className="mb-4 rounded-xl w-full h-80"
        src="https://www.youtube.com/embed/19mMjXTwkFc"
        title="LangApex"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      <iframe
        className="mb-4 rounded-xl w-full h-80"
        src="https://www.youtube.com/embed/ywAM09I_OYM"
        title="LangApex"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
        </div>
      </div>
    </div>
  );
}
export default LandingPage;
