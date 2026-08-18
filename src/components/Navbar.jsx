import { NavLink } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { CircleDot, LayoutDashboard, Menu, Radio, Settings, Target, Trophy, X, LogOut } from "lucide-react";
import { auth, database } from "../services/firebase";

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

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const logout = async () => await signOut(auth);

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

  const fecharMenu = () => setMenuAberto(false);

  return (
    <>
      <nav className="desktop-navbar">
        <div className="desktop-brand"><CircleDot size={15} color="#FFD700" /> Bolão Green</div>
        <div className="desktop-nav-grid">
          <NavLink to="/dashboard" style={linkStyle}><LayoutDashboard size={13} /> Dashboard</NavLink>
          <NavLink to="/jogos" style={linkStyle}><CircleDot size={13} /> Jogos</NavLink>
          <NavLink to="/palpites" style={linkStyle}><Target size={13} /> Palpites</NavLink>
        </div>
        <div className="desktop-nav-grid">
          <NavLink to="/ranking" style={linkStyle}><Trophy size={13} /> Ranking</NavLink>
          <NavLink to="/ao-vivo" style={linkStyle}><Radio size={13} /> Ao vivo</NavLink>
          {isAdmin ? (
            <NavLink to="/admin" style={linkStyle}><Settings size={13} /> Admin</NavLink>
          ) : (
            <button className="desktop-logout" onClick={logout}><LogOut size={13} /> Sair</button>
          )}
        </div>
        {isAdmin && <button className="desktop-logout admin-logout" onClick={logout}><LogOut size={13} /> Sair</button>}
      </nav>
      <div className={`desktop-navbar-spacer ${isAdmin ? "is-admin" : ""}`} />

      {menuAberto && (
        <div className="mobile-menu" role="menu">
          <NavLink to="/ranking" onClick={fecharMenu}><Trophy size={17} /> Ranking</NavLink>
          {isAdmin && <NavLink to="/admin" onClick={fecharMenu}><Settings size={17} /> Administração</NavLink>}
          <button onClick={logout}><LogOut size={17} /> Sair</button>
        </div>
      )}

      <nav className="mobile-navbar" aria-label="Navegação principal">
        <NavLink to="/dashboard"><LayoutDashboard size={19} /><span>Início</span></NavLink>
        <NavLink to="/jogos"><CircleDot size={19} /><span>Jogos</span></NavLink>
        <NavLink to="/ao-vivo"><Radio size={19} /><span>Ao vivo</span></NavLink>
        <NavLink to="/palpites"><Target size={19} /><span>Palpites</span></NavLink>
        <button onClick={() => setMenuAberto(aberto => !aberto)} aria-label="Abrir mais opções" aria-expanded={menuAberto}>
          {menuAberto ? <X size={20} /> : <Menu size={20} />}<span>Mais</span>
        </button>
      </nav>
      <div className="mobile-navbar-spacer" />
    </>
  );
}
