import { Navigate, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Cadastro from "../pages/Cadastro";
import Jogos from "../pages/Jogos";
import Ranking from "../pages/Ranking";
import AoVivo from "../pages/AoVivo";
import Admin from "../pages/Admin";
import MeusPalpites from "../pages/MeusPalpites";

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/jogos" element={<ProtectedRoute><Jogos /></ProtectedRoute>} />
      <Route path="/palpites" element={<ProtectedRoute><MeusPalpites /></ProtectedRoute>} />
      <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
      <Route path="/ao-vivo" element={<ProtectedRoute><AoVivo /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/perfil" element={<Navigate to="/ao-vivo" replace />} />
    </Routes>
  );
}