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
        background: "var(--c-nav)",
        border: "1px solid color-mix(in srgb, var(--c-action) 40%, transparent)",
        borderRadius: "14px",
        padding: "12px 14px",
        boxShadow: "0 12px 32px color-mix(in srgb, var(--c-shadow) 60%, transparent), 0 0 16px color-mix(in srgb, var(--c-action) 20%, transparent)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slide-down 0.3s ease-out",
        cursor: "pointer",
      }}
      onClick={handleClick}
      className="tema-escuro"
      role="alert"
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "var(--c-gold)",
          color: "var(--c-nav)",
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
            fontSize: "var(--fs-14)",
            fontWeight: 700,
            color: "var(--c-text)",
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
            fontSize: "var(--fs-12)",
            color: "var(--c-text-2)",
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
            fontSize: "var(--fs-12)",
            color: "var(--c-gold)",
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
            color: "color-mix(in srgb, var(--c-text) 60%, transparent)",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            flexShrink: 0,
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
