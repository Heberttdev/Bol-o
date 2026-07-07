import { NavLink } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
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
  const logout = async () => await signOut(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const snapshot = await get(ref(database, `users/${user.uid}`));
      setIsAdmin(snapshot.exists() && snapshot.val().role === "admin");
    });

    return () => unsubscribe();
  }, []);

  const linkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "6px 4px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.76rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    background: isActive ? "#00ff88" : "transparent",
    color: isActive ? "#000" : "rgba(255,255,255,0.75)",
  });

  const adminLinkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "6px 4px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.76rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    background: isActive ? "#FFD700" : "transparent",
    color: isActive ? "#000" : "#FFD700",
  });

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
    width: "100%",
  };

  const sairStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "6px 4px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "#FFD700",
    cursor: "pointer",
    fontSize: "0.76rem",
    fontWeight: 600,
    transition: "all 0.2s ease",
  };

  return (
    <>
      <style>{`
        .nav-link-item:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #fff !important;
        }
        .nav-logout:hover {
          background: rgba(255,215,0,0.12) !important;
        }
      `}</style>

      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "#0F3D2E",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
      }}>

        {/* Logo */}
        <div style={{
          color: "#FFD700",
          fontSize: "15px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "2px",
        }}>
          <CircleDot size={15} color="#FFD700" /> Bolão Green
        </div>

        {/* Linha 1: Dashboard, Jogos, Palpites */}
        <div style={gridStyle}>
          <NavLink to="/dashboard" style={linkStyle} className="nav-link-item">
            <LayoutDashboard size={13} /> Dashboard
          </NavLink>

          <NavLink to="/jogos" style={linkStyle} className="nav-link-item">
            <CircleDot size={13} /> Jogos
          </NavLink>

          <NavLink to="/palpites" style={linkStyle} className="nav-link-item">
            <Target size={13} /> Palpites
          </NavLink>
        </div>

        {/* Linha 2 */}
        <div style={gridStyle}>
          <NavLink to="/ranking" style={linkStyle} className="nav-link-item">
            <Trophy size={13} /> Ranking
          </NavLink>

          <NavLink to="/perfil" style={linkStyle} className="nav-link-item">
            <User size={13} /> Perfil
          </NavLink>

          {isAdmin ? (
            <NavLink to="/admin" style={adminLinkStyle} className="nav-link-item">
              <Settings size={13} /> Admin
            </NavLink>
          ) : (
            <button onClick={logout} className="nav-logout" style={sairStyle}>
              <LogOut size={13} /> Sair
            </button>
          )}
        </div>

        {/* Linha 3 — só pro admin: Sair alinhado à direita */}
        {isAdmin && (
          <div style={{ ...gridStyle, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div />
            <div />
            <button onClick={logout} className="nav-logout" style={sairStyle}>
              <LogOut size={13} /> Sair
            </button>
          </div>
        )}

      </nav>

      {/* Espaçador */}
      <div style={{ height: isAdmin ? "116px" : "84px" }} />
    </>
  );
}