import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  CheckCheck,
  Radio,
  Trophy,
  Target,
  CircleDot,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";

function getBadgeInfo(tipo) {
  switch (tipo) {
    case "jogos":
      return {
        label: "Jogos",
        icon: <CircleDot size={12} />,
        bg: "rgba(0, 255, 136, 0.15)",
        color: "#00ff88",
        border: "rgba(0, 255, 136, 0.3)",
      };
    case "resultados":
      return {
        label: "Resultados",
        icon: <Target size={12} />,
        bg: "rgba(255, 215, 0, 0.15)",
        color: "#ffd700",
        border: "rgba(255, 215, 0, 0.3)",
      };
    case "ranking":
      return {
        label: "Ranking",
        icon: <Trophy size={12} />,
        bg: "rgba(0, 191, 255, 0.15)",
        color: "#00bfff",
        border: "rgba(0, 191, 255, 0.3)",
      };
    case "aovivo":
      return {
        label: "Ao Vivo",
        icon: <Radio size={12} />,
        bg: "rgba(255, 0, 128, 0.15)",
        color: "#ff0080",
        border: "rgba(255, 0, 128, 0.3)",
      };
    case "urgente":
      return {
        label: "Urgente",
        icon: <AlertTriangle size={12} />,
        bg: "rgba(255, 77, 77, 0.15)",
        color: "#ff4d4d",
        border: "rgba(255, 77, 77, 0.3)",
      };
    default:
      return {
        label: "Comunicado",
        icon: <Info size={12} />,
        bg: "var(--bg-elev)",
        color: "var(--text)",
        border: "var(--border)",
      };
  }
}

export default function NotificationModal() {
  const {
    notificacoes,
    lidas,
    modalAberto,
    fecharModal,
    marcarComoLida,
    marcarTodasComoLidas,
    naoLidasCount,
  } = useNotifications();

  const navigate = useNavigate();

  if (!modalAberto) return null;

  const handleClickItem = (notif) => {
    marcarComoLida(notif.id);
    if (notif.link) {
      fecharModal();
      navigate(notif.link);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={fecharModal}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-elev)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(0, 255, 136, 0.12)",
                color: "#00ff88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text)", fontWeight: 700 }}>
                Notificações
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {naoLidasCount > 0
                  ? `${naoLidasCount} nova(s) notificação(ões)`
                  : "Todas as notificações lidas"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {naoLidasCount > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                }}
                title="Marcar todas como lidas"
              >
                <CheckCheck size={14} /> Lidas
              </button>
            )}
            <button
              onClick={fecharModal}
              style={{
                background: "transparent",
                border: "none",
                color: "#aab",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
              }}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {notificacoes.length === 0 ? (
<div
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: "var(--text-soft)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "var(--bg-elev)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-soft)",
                  }}
                >
                  <Bell size={26} />
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  Nenhuma notificação por aqui
                </p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-soft)" }}>
                  Você receberá avisos sobre partidas, resultados e novidades do bolão.
                </p>
              </div>
          ) : (
            notificacoes.map((item) => {
              const badge = getBadgeInfo(item.tipo);
              const isLida = lidas.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  style={{
                    background: isLida ? "var(--bg-elev)" : "var(--surface-raised)",
                    border: isLida
                      ? "1px solid rgba(255, 255, 255, 0.04)"
                      : "1px solid rgba(0, 255, 136, 0.25)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Badge de tipo e data */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {!isLida && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#00ff88",
                            boxShadow: "0 0 8px #00ff88",
                          }}
                        />
                      )}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    </div>

                    <span style={{ fontSize: "0.72rem", color: "var(--text-soft)" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : ""}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <h4
                    style={{
                      margin: "0 0 4px",
                      fontSize: "0.92rem",
                      color: isLida ? "var(--text-muted)" : "var(--text)",
                      fontWeight: isLida ? 600 : 700,
                    }}
                  >
                    {item.titulo}
                  </h4>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.82rem",
                      color: isLida ? "var(--text-soft)" : "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.corpo}
                  </p>

                  {/* Link de Ação se houver */}
                  {item.link && (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--primary)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      Acessar página <ChevronRight size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
