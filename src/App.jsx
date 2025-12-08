import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./Pages/auth/Auth";
import Login from "./Pages/auth/Login/Login";
import LandingPage from "./Pages/admin/LandingPage/LandingPage";
import LayoutWithHeader from "./Layouts/Layout";
import ProtectedRoute from "./Pages/auth/ProtectedRoute";
import { Payments } from "./Pages/admin/PaymentPage/Payments";
import Configuration from "./Pages/admin/ManagementPage/Configuration";
import Classes from "./Pages/admin/Groups/Classes";
import Teachers from "./Pages/admin/Teachers/Teachers.jsx";
import ClassSubjects from "./Pages/admin/ScoresForAdmin/ClassessSubjects";
import ClassManagement from "./Pages/admin/Groups/ClassManagement";
import ClassesToView from "./Pages/admin/ScoresForAdmin/ClassesToView.jsx";
import Timetable from "./Pages/admin/Timetable/Timetable";
import Exams from "./Pages/admin/Exams/Exams.jsx";
import MyClasses from "./Pages/teacher/MyClasses/MyClasses.jsx";
import MyLessons from "./Pages/teacher/MyClasses/MyLessons.jsx";
import { Toaster } from "react-hot-toast";
import Tools from "./Pages/admin/Tools/Tools";

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#333",
            padding: "12px 16px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            fontSize: "14px",
            minWidth: "200px",
          },
          success: {
            iconTheme: {
              primary: "#16a34a",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
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
          <Route path="/exams" element={<Exams />} />
          <Route path="/classes-to-view" element={<ClassesToView />} />
          <Route
            path="/classes-to-view/class-subjects"
            element={<ClassSubjects />}
          />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/home/my-classes" element={<MyClasses />} />
          <Route path="/home/my-classes/my-lessons" element={<MyLessons />} />
          <Route path="/tools" element={<Tools />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
