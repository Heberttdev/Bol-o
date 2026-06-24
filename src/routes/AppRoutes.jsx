import { HashRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Cadastro from "../pages/Cadastro";
import Jogos from "../pages/Jogos";
import Ranking from "../pages/Ranking";
import Perfil from "../pages/Perfil";
import Admin from "../pages/Admin";

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jogos"
          element={
            <ProtectedRoute>
              <Jogos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ranking"
          element={
            <ProtectedRoute>
              <Ranking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Perfil />
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
    </HashRouter>
  );
}