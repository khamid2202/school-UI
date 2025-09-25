import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Components/Auth/Auth";
import Login from "./Components/Login/Login";
import Dashboard from "./Components/Dashboard/Dashboard";
import LandingPage from "./Components/LandingPage/LandingPage";
import LayoutWithHeader from "./Components/Layout/Layout";
import Payments from "./Components/PaymentPage/Payments";

// import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route element={<LayoutWithHeader />}> */}
        {/* Default route goes to Auth (checks token) */}
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/home" element={<LandingPage />} />
        {/* </Route> */}
      </Routes>
    </Router>
  );
}

export default App;
