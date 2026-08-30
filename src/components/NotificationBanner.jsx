import { useNotifications } from "../context/NotificationContext";
import { Bell, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationBanner() {
  const { toastNotificacao, fecharToast, abrirModal } = useNotifications();
  const navigate = useNavigate();

  if (!toastNotificacao) return null;

  const handleClick = () => {
    if (toastNotificacao.link) {
      navigate(toastNotificacao.link);
    } else {
      abrirModal();
    }
    fecharToast();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "max(16px, env(safe-area-inset-top))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10001,
        width: "calc(100% - 32px)",
        maxWidth: "450px",
        background: "#0F3D2E",
        border: "1px solid rgba(0, 255, 136, 0.4)",
        borderRadius: "14px",
        padding: "12px 14px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 255, 136, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slide-down 0.3s ease-out",
        cursor: "pointer",
      }}
      onClick={handleClick}
      role="alert"
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#FFD700",
          color: "#0F3D2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Bell size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {toastNotificacao.titulo}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "#dcffe9",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {toastNotificacao.corpo}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: "#FFD700",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          Ver <ArrowRight size={12} />
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fecharToast();
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            padding: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes slide-down {
          from { transform: translate(-50%, -24px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
