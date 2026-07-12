import { Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Evaluacion } from "./pages/Evaluacion";
import { Transicion } from "./pages/Transicion";
import { Actualizacion } from "./pages/Actualizacion";
import { Cursos } from "./pages/Cursos";
import { Mentor } from "./pages/Mentor";
import { Admin } from "./pages/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
        path="/cursos"
        element={
          <ProtectedRoute>
            <Cursos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor"
        element={
          <ProtectedRoute>
            <Mentor />
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
  );
}
