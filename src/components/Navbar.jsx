import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../services/firebase";
import {
  LayoutDashboard,
  CircleDot,
  Target,
  Trophy,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const logout = async () => {
    await signOut(auth);
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    verificarAdmin();
  }, []);

  async function verificarAdmin() {
    const user = auth.currentUser;

    if (!user) return;

    const snapshot = await get(ref(database, `users/${user.uid}`));

    if (!snapshot.exists()) return;

    const dados = snapshot.val();

    if (dados.role === "admin") {
      setIsAdmin(true);
    }
  }

  const linkBaseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.85rem",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    background: "#1a1f2b",
    color: "#fff",
  };

  const activeStyle = {
    background: "#00ff88",
    color: "#000",
    boxShadow: "0 4px 12px rgba(0, 255, 136, 0.3)",
  };

  return (
    <nav
      style={{
        background: "#0F3D2E",
        padding: "10px 16px",
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: "#FFD700",
          fontSize: "18px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <CircleDot size={18} /> Bolão Green
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({ ...linkBaseStyle, ...(isActive ? activeStyle : {}) })}
        >
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>

        <NavLink
          to="/jogos"
          style={({ isActive }) => ({ ...linkBaseStyle, ...(isActive ? activeStyle : {}) })}
        >
          <CircleDot size={16} /> Jogos
        </NavLink>

        <NavLink
          to="/palpites"
          style={({ isActive }) => ({ ...linkBaseStyle, ...(isActive ? activeStyle : {}) })}
        >
          <Target size={16} /> Palpites
        </NavLink>

        <NavLink
          to="/ranking"
          style={({ isActive }) => ({ ...linkBaseStyle, ...(isActive ? activeStyle : {}) })}
        >
          <Trophy size={16} /> Ranking
        </NavLink>

        <NavLink
          to="/perfil"
          style={({ isActive }) => ({ ...linkBaseStyle, ...(isActive ? activeStyle : {}) })}
        >
          <User size={16} /> Perfil
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              ...linkBaseStyle,
              background: isActive ? "#FFD700" : "#1a1f2b",
              color: isActive ? "#000" : "#FFD700",
            })}
          >
            <Settings size={16} /> Admin
          </NavLink>
        )}
      </div>

      <button
        onClick={logout}
        style={{
          background: "#FFD700",
          color: "#0F3D2E",
          border: "none",
          padding: "8px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <LogOut size={16} /> Sair
      </button>
    </nav>
  );
}