import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Navbar />
      <Outlet /> {/* This is where child routes will be rendered */}
    </div>
  );
}

export default Layout;
