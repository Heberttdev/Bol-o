import { Link, NavLink } from "react-router-dom";
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

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Navbar({ variant = "mobile" }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const { abrirModal, naoLidasCount } = useNotifications();
  const maisRef = useRef(null);
  const botaoMaisRef = useRef(null);
  const dialogRef = useRef(null);
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

  // Desktop: dropdown "Mais" fecha ao clicar fora ou com Esc (foco volta ao botão).
  useEffect(() => {
    if (variant !== "desktop" || !maisAberto) return;
    const aoClicar = (e) => {
      if (maisRef.current && !maisRef.current.contains(e.target)) setMaisAberto(false);
    };
    const aoTeclar = (e) => {
      if (e.key !== "Escape") return;
      setMaisAberto(false);
      botaoMaisRef.current?.focus();
    };
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [variant, maisAberto]);

  // Mobile: folha "Mais" é um dialog modal — foco no 1º item, foco preso,
  // Esc fecha, rolagem do fundo bloqueada e foco devolvido ao botão "Mais".
  useEffect(() => {
    if (variant !== "mobile" || !maisAberto) return;
    const dialog = dialogRef.current;
    const botao = botaoMaisRef.current;
    const focaveis = () => [...dialog.querySelectorAll(FOCAVEIS)];

    const primeiroItem = focaveis().find((el) => !el.classList.contains("mobile-menu-fechar"));
    primeiroItem?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMaisAberto(false);
        return;
      }
      if (e.key !== "Tab") return;
      const lista = focaveis();
      if (!lista.length) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (!dialog.contains(document.activeElement)) {
        e.preventDefault();
        primeiro.focus();
      } else if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      botao?.focus();
    };
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
      <nav className="desktop-navbar tema-escuro">
        <Link to="/dashboard" className="desktop-brand" aria-label="Bolão Green, ir para o início">
          <img
            src="/logo-32.png"
            srcSet="/logo-32.png 1x, /logo-64.png 2x"
            width="28"
            height="28"
            alt=""
            className="desktop-brand-logo"
          />
          Bolão Green
        </Link>
        <div className="desktop-nav-grid">
          {DESTINOS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="desktop-link">
              <Icon size={14} /> {label}
            </NavLink>
          ))}
          <div className="desktop-mais" ref={maisRef}>
            <button
              ref={botaoMaisRef}
              type="button"
              className="desktop-link"
              aria-expanded={maisAberto}
              aria-controls="desktop-mais-menu"
              onClick={() => setMaisAberto((a) => !a)}
            >
              {maisAberto ? <X size={14} /> : <Menu size={14} />} Mais
            </button>
            {maisAberto && (
              <div className="desktop-mais-menu" id="desktop-mais-menu">
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
          <div className="mobile-sheet-backdrop" onClick={fecharMais} aria-hidden="true" />
          <div ref={dialogRef} className="mobile-menu" role="dialog" aria-modal="true" aria-labelledby="mais-titulo">
            <div className="mobile-sheet-handle" aria-hidden="true" />
            <div className="mobile-menu-topo">
              <h2 id="mais-titulo" className="mobile-menu-titulo">Mais</h2>
              <button type="button" className="mobile-menu-fechar" aria-label="Fechar menu" onClick={fecharMais}>
                <X size={20} />
              </button>
            </div>
            {itensMais}
          </div>
        </>
      )}

      <nav className="mobile-navbar tema-escuro" aria-label="Navegação principal">
        {DESTINOS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={fecharMais}>
            <Icon size={22} /><span>{label}</span>
          </NavLink>
        ))}
        <button
          ref={botaoMaisRef}
          type="button"
          onClick={() => setMaisAberto((a) => !a)}
          aria-label="Mais opções"
          aria-haspopup="dialog"
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
