import React from "react";
import Navbar from "../Layout/Navbar";

function Payments() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>
    </div>
  );
}

export default Payments;
