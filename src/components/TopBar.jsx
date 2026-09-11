import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";

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
          color: "#FFD700",
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
            <ThemeToggle light />

            <button
              onClick={abrirModal}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                color: "#FFD700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
              aria-label="Abrir notificações"
            >
              <Bell size={18} />
              {naoLidasCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "#ff4d4d",
                    color: "#fff",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    borderRadius: "10px",
                    padding: "1px 5px",
                    minWidth: "16px",
                    textAlign: "center",
                    border: "2px solid #0F3D2E",
                  }}
                >
                  {naoLidasCount > 9 ? "9+" : naoLidasCount}
                </span>
              )}
            </button>

            <div
              onClick={() => navigate("/perfil")}
              role="button"
              tabIndex={0}
              aria-label="Abrir meu perfil"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/perfil");
                }
              }}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                {user.displayName?.split(" ")[0]}
              </span>
              <Avatar
                nome={user.displayName}
                fotoUrl={user.photoURL}
                size={32}
              />
            </div>
          </div>
        )}
      </div>

      {/* Espaçador */}
      <div style={{ height: "52px" }} />
    </div>
  );
}