import React from "react";
import Navbar from "../Layout/Navbar";
import { endpoints } from "../../Library/Endpoints";

//fetch userinfo from database and save it to the local storage

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Dashboard Content</h1>
      </div>
    </div>
  );
}

export default LandingPage;
