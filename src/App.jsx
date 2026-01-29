import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Pages/auth/Login/Login";
import LandingPage from "./Pages/admin/LandingPage/LandingPage";
import LayoutWithHeader from "./Layouts/Layout";
import ProtectedRoute from "./Pages/auth/ProtectedRoute";
import Classes from "./Pages/admin/Groups/Classes";
import Teachers from "./Pages/admin/Teachers/Teachers.jsx";
import ClassManagement from "./Pages/admin/Groups/ClassManagement";
import Timetable from "./Pages/admin/Timetable/Timetable";
import Exams from "./Pages/admin/Exams/Exams.jsx";
import TeacherLessonsPage from "./Pages/teacher/Lessons/TeacherLessonsPage.jsx";
import StudentPointsPage from "./Pages/teacher/Lessons/StudentPointsPage.jsx";
import { Toaster } from "react-hot-toast";
import Tools from "./Pages/admin/Tools/Tools";
import PaymentsPage from "./Pages/admin/PaymentNew/Paymentspage/PaymentsPage.jsx";
import { DataProvider } from "./Hooks/UseContext";
import { AuthProvider } from "./Hooks/AuthContext";
import AdminTools from "./Pages/admin/ManagementPage/AdminTools.jsx";
import Discounts from "./Pages/admin/ManagementPage/Discounts/Discounts.jsx";
import Billings from "./Pages/admin/ManagementPage/Billings/Billlings.jsx";
import New_Invoices from "./Pages/admin/ManagementPage/Invoices2.0/New_Invoices_Page.jsx";

function App() {
  return (
    <AuthProvider>
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
                <DataProvider>
                  <LayoutWithHeader />
                </DataProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<LandingPage />} />
            <Route path="/management" element={<AdminTools />} />
            <Route path="/management/billings" element={<Billings />} />
            <Route path="/management/discounts" element={<Discounts />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/class-management" element={<ClassManagement />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/exams" element={<Exams />} />

            <Route path="/timetable" element={<Timetable />} />
            <Route path="/teacher/lessons" element={<TeacherLessonsPage />} />

            <Route
              path="/teacher/lessons/:lessonId/students"
              element={<StudentPointsPage />}
            />
            <Route path="/tools" element={<Tools />} />
            <Route path="/new-payments" element={<PaymentsPage />} />
            <Route
              path="/management/invoivces-2.0"
              element={<New_Invoices />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
