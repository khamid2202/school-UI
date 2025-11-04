import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Pages/auth/Auth";
import Login from "./Pages/auth/Login/Login";
import Dashboard from "./Pages/admin/Dashboard/Dashboard";
import LandingPage from "./Pages/admin/LandingPage/LandingPage";
import LayoutWithHeader from "./Layouts/Layout";
import ProtectedRoute from "./Pages/auth/ProtectedRoute";
import { Payments } from "./Pages/admin/PaymentPage/Payments";
import Configuration from "./Pages/admin/ManagementPage/Configuration";
import Classes from "./Pages/admin/Groups/Classes";
import Teachers from "./Pages/admin/Teachers/Teachers";
import Scores from "./Pages/admin/Scoring/Scoring";
import ClassManagement from "./Pages/admin/Groups/ClassManagement";
import ClassesForScoring from "./Pages/admin/Scoring/ClassesForScoring";

// import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Login />} />
        {/* Protected routes (with layout) */}
        <Route
          element={
            <ProtectedRoute>
              <LayoutWithHeader />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<LandingPage />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/class-management" element={<ClassManagement />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/classes-for-scoring" element={<ClassesForScoring />} />
          <Route path="/scores" element={<Scores />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

// # 1. Token Authentication
// if token is valid, redirect to /home
// if token is invalid, redirect to /login
