import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";


export default function TopBar() {
  const { user } = useAuth();
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

        {/* Avatar clicável → vai pro perfil */}
        {user && (
          <div
            onClick={() => navigate("/perfil")}
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
        )}
      </div>

      {/* Espaçador */}
      <div style={{ height: "52px" }} />
    </div>
  );
}