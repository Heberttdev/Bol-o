import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Cadastro from "../pages/Cadastro";
import RecuperarSenha from "../pages/RecuperarSenha";

import ProtectedRoute from "../components/ProtectedRoute";
import Loading from "../components/Loading";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Jogos = lazy(() => import("../pages/Jogos"));
const Ranking = lazy(() => import("../pages/Ranking"));
const AoVivo = lazy(() => import("../pages/AoVivo"));
const Admin = lazy(() => import("../pages/Admin"));
const MeusPalpites = lazy(() => import("../pages/MeusPalpites"));
const AlterarSenha = lazy(() => import("../pages/AlterarSenha"));
const Perfil = lazy(() => import("../pages/Perfil"));
const Regras = lazy(() => import("../pages/Regras"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/jogos" element={<ProtectedRoute><Jogos /></ProtectedRoute>} />
        <Route path="/palpites" element={<ProtectedRoute><MeusPalpites /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
        <Route path="/ao-vivo" element={<ProtectedRoute><AoVivo /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/alterar-senha" element={<ProtectedRoute><AlterarSenha /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/regras" element={<ProtectedRoute><Regras /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}