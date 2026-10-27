import { NavLink } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ref, get } from "firebase/database";
import {
  CircleDot, LayoutDashboard, Menu, Radio, Settings, Target, Trophy,
  X, LogOut, Bell, KeyRound, BookOpen, Ticket,
} from "lucide-react";
import { auth, database } from "../services/firebase";
import { useNotifications } from "../context/NotificationContext";
import ThemeToggle from "./ThemeToggle";

// 4 destinos fixos + "Mais" (5º) = navegação principal (Lei de Hick).
const DESTINOS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { to: "/jogos", icon: CircleDot, label: "Jogos" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/boloes-especiais", icon: Ticket, label: "Bolões" },
];

export default function Navbar({ variant = "mobile" }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const { abrirModal, naoLidasCount } = useNotifications();
  const maisRef = useRef(null);
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

  const fecharMais = () => setMaisAberto(false);

  // Fecha o dropdown "Mais" do desktop ao clicar fora.
  useEffect(() => {
    if (variant !== "desktop" || !maisAberto) return;
    const aoClicar = (e) => {
      if (maisRef.current && !maisRef.current.contains(e.target)) setMaisAberto(false);
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [variant, maisAberto]);

  // Itens da folha "Mais" (destinos secundários). Admin só para admin.
  const itensMais = (
    <>
      <NavLink to="/palpites" onClick={fecharMais}><Target size={18} /> Histórico</NavLink>
      <NavLink to="/ao-vivo" onClick={fecharMais}><Radio size={18} /> Ao vivo</NavLink>
      <NavLink to="/regras" onClick={fecharMais}><BookOpen size={18} /> Regras</NavLink>
      <NavLink to="/alterar-senha" onClick={fecharMais}><KeyRound size={18} /> Conta e senha</NavLink>
      {isAdmin && <NavLink to="/admin" onClick={fecharMais}><Settings size={18} /> Administração</NavLink>}
      <ThemeToggle row />
      <button className="sair" onClick={logout}><LogOut size={18} /> Sair</button>
    </>
  );

  if (variant === "desktop") {
    return (
      <nav className="desktop-navbar">
        <div className="desktop-brand">
          <CircleDot size={15} color="currentColor" style={{ color: "var(--c-gold)" }} /> Bolão Green
        </div>
        <div className="desktop-nav-grid">
          {DESTINOS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="desktop-link">
              <Icon size={14} /> {label}
            </NavLink>
          ))}
          <div className="desktop-mais" ref={maisRef}>
            <button
              type="button"
              className="desktop-link"
              aria-haspopup="menu"
              aria-expanded={maisAberto}
              onClick={() => setMaisAberto((a) => !a)}
            >
              {maisAberto ? <X size={14} /> : <Menu size={14} />} Mais
            </button>
            {maisAberto && (
              <div className="desktop-mais-menu" role="menu">
                {itensMais}
              </div>
            )}
          </div>
        </div>
        <div className="desktop-actions">
          <button
            onClick={abrirModal}
            className="desktop-icon-btn"
            style={{ position: "relative" }}
            aria-label="Notificações"
            title="Notificações"
          >
            <Bell size={16} />
            {naoLidasCount > 0 && <span className="nav-dot" aria-hidden="true" />}
          </button>
        </div>
      </nav>
    );
  }

  return (
    <>
      {maisAberto && (
        <>
          <div className="mobile-sheet-backdrop" onClick={fecharMais} />
          <div className="mobile-menu" role="menu">
            <div className="mobile-sheet-handle" aria-hidden="true" />
            {itensMais}
          </div>
        </>
      )}

      <nav className="mobile-navbar" aria-label="Navegação principal">
        {DESTINOS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={fecharMais}>
            <Icon size={22} /><span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMaisAberto((a) => !a)}
          aria-label="Mais opções"
          aria-haspopup="menu"
          aria-expanded={maisAberto}
          className={maisAberto ? "ativo" : undefined}
        >
          {maisAberto ? <X size={22} /> : <Menu size={22} />}
          <span>Mais</span>
        </button>
      </nav>
      <div className="mobile-navbar-spacer" />
    </>
  );
}
