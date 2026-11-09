import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import Avatar from "./Avatar";

export default function TopBar() {
  const { user, perfil } = useAuth();
  const { abrirModal, naoLidasCount } = useNotifications();
  const navigate = useNavigate();

  const nome = perfil?.nome || user?.displayName || "";
  const foto = perfil?.fotoUrl || user?.photoURL || null;

  return (
    <div className="mobile-topbar">
      <div className="topbar tema-escuro">
        <div className="topbar-marca">
          <img
            src="/logo-32.png"
            srcSet="/logo-32.png 1x, /logo-64.png 2x"
            width="32"
            height="32"
            alt=""
            className="topbar-logo"
          />
          Bolão Green
        </div>

        {user && (
          <div className="topbar-acoes">
            <button type="button" onClick={abrirModal} className="topbar-sino" aria-label="Notificações">
              <Bell size={18} />
              {naoLidasCount > 0 && <span aria-hidden="true" className="topbar-sino-dot" />}
            </button>

            <button type="button" onClick={() => navigate("/perfil")} aria-label="Seu perfil" className="topbar-perfil">
              <span className="topbar-nome">{nome.split(" ")[0]}</span>
              <Avatar nome={nome} email={user.email} fotoUrl={foto} size={32} />
            </button>
          </div>
        )}
      </div>

      {/* Espaçador */}
      <div style={{ height: "var(--altura-header)" }} />
    </div>
  );
}
