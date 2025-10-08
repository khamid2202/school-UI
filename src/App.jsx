import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Pages/auth/Auth";
import Login from "./Pages/auth/Login/Login";
import Dashboard from "./Pages/admin/Dashboard/Dashboard";
import LandingPage from "./Pages/admin/LandingPage/LandingPage";
import LayoutWithHeader from "./Layouts/Layout";
import Payments from "./Pages/admin/PaymentPage/TuitionPayments";
import Configuration from "./Pages/admin/StudentSetting/Configuration";
import Classes from "./Pages/admin/Groups/Classes";
import Teachers from "./Pages/admin/Teachers/Teachers";
import Scores from "./Pages/admin/Scoring/Scoring";

// import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Login />} />
        {/* Protected routes (with layout) */}
        <Route element={<LayoutWithHeader />}>
          <Route path="/home" element={<LandingPage />} />
          <Route path="/tuition-payments" element={<Payments />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/teachers" element={<Teachers />} />
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
