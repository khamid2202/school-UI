import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Components/Auth/Auth";
import Login from "./Components/Login/Login";
import Dashboard from "./Components/Dashboard/Dashboard";
import LandingPage from "./Components/LandingPage/LandingPage";
import LayoutWithHeader from "./Components/Layout/Layout";
import Payments from "./Components/PaymentPage/TuitionPayments";
import Configuration from "./Components/StudentSetting/Configuration";

// import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes (with layout) */}
        <Route element={<LayoutWithHeader />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tuition-payments" element={<Payments />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/configuration" element={<Configuration />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
