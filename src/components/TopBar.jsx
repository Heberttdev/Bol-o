import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import Avatar from "./Avatar";

export default function TopBar() {
  const { user } = useAuth();
  const { abrirModal, naoLidasCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="mobile-topbar">
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 999,
        background: "#0F3D2E",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 8px rgba(0,0,0,0.4)",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--c-gold)",
          fontWeight: 700,
          fontSize: "1rem",
        }}>
          <img
            src="/logo-bolao.png"
            alt="Bolão Green"
            style={{ width: "32px", height: "32px", objectFit: "contain" }}
          />
          Bolão Green
        </div>

        {/* Notificações + Avatar */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={abrirModal}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "var(--r-pill)",
                width: "44px",
                height: "44px",
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
              aria-label="Notificações"
            >
              <Bell size={18} />
              {naoLidasCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "var(--c-live)",
                    width: "9px",
                    height: "9px",
                    borderRadius: "var(--r-pill)",
                    border: "2px solid #0F3D2E",
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/perfil")}
              aria-label="Abrir meu perfil"
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", minHeight: "44px", minWidth: "44px", justifyContent: "flex-end", background: "transparent", border: "none", padding: 0, font: "inherit" }}
            >
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                {user.displayName?.split(" ")[0]}
              </span>
              <Avatar
                nome={user.displayName}
                fotoUrl={user.photoURL}
                size={32}
              />
            </button>
          </div>
        )}
      </div>

      {/* Espaçador */}
      <div style={{ height: "68px" }} />
    </div>
  );
}