import { Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Evaluacion } from "./pages/Evaluacion";
import { Transicion } from "./pages/Transicion";
import { Actualizacion } from "./pages/Actualizacion";
import { Pension } from "./pages/Pension";
import { BienestarFinanciero } from "./pages/BienestarFinanciero";
import { Cursos } from "./pages/Cursos";
import { Admin } from "./pages/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MentorProvider } from "./context/MentorContext";
import { MentorWidget } from "./components/MentorWidget";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();

  return (
    <MentorProvider>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/olvide-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluacion"
        element={
          <ProtectedRoute>
            <Evaluacion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transicion"
        element={
          <ProtectedRoute>
            <Transicion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actualizacion"
        element={
          <ProtectedRoute>
            <Actualizacion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pension"
        element={
          <ProtectedRoute>
            <Pension />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bienestar-financiero"
        element={
          <ProtectedRoute>
            <BienestarFinanciero />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cursos"
        element={
          <ProtectedRoute>
            <Cursos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      </Routes>
      {user && <MentorWidget />}
    </MentorProvider>
  );
}
