import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "../auth/Auth.jsx";
import Login from "../auth/Login/Login.jsx";
import LayoutWithHeader from "../../Layouts/Layout.jsx";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";

// Use admin components (they exist in src/Pages/admin)
import Dashboard from "../admin/Dashboard/Dashboard.jsx";
import Classes from "../admin/Groups/Classes.jsx";
import ClassManagement from "../admin/Groups/ClassManagement.jsx";
import Teachers from "../admin/Teachers/Teachers.jsx";
import Scores from "../admin/Scoring/Scoring.jsx";
import ClassesForScoring from "../admin/Scoring/ClassesForScoring.jsx";
import Timetable from "../admin/Timetable/Timetable.jsx";

/* Exports a Routes tree (no BrowserRouter) so main App can mount it at /users/* */
export default function TeacherRoutes() {
  return (
    <Routes>
      {/* index -> redirect to home */}
      <Route index element={<Navigate to="home" replace />} />
      <Route path="auth" element={<Auth />} />
      <Route path="login" element={<Login />} />

      {/* Protected teacher routes (mounted under /users/*) */}
      <Route
        element={
          <ProtectedRoute>
            <LayoutWithHeader />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<Dashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="class-management" element={<ClassManagement />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="classes-for-scoring" element={<ClassesForScoring />} />
        <Route path="scores" element={<Scores />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}