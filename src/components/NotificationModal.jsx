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
        bg: "color-mix(in srgb, var(--c-action) 15%, transparent)",
        color: "var(--c-action)",
        border: "color-mix(in srgb, var(--c-action) 30%, transparent)",
      };
    case "resultados":
      return {
        label: "Resultados",
        icon: <Target size={12} />,
        bg: "color-mix(in srgb, var(--c-gold) 15%, transparent)",
        color: "var(--c-gold)",
        border: "color-mix(in srgb, var(--c-gold) 30%, transparent)",
      };
    case "ranking":
      return {
        label: "Ranking",
        icon: <Trophy size={12} />,
        bg: "color-mix(in srgb, var(--c-info) 15%, transparent)",
        color: "var(--c-info)",
        border: "color-mix(in srgb, var(--c-info) 30%, transparent)",
      };
    case "aovivo":
      return {
        label: "Ao Vivo",
        icon: <Radio size={12} />,
        bg: "var(--c-live-soft)",
        color: "var(--c-live)",
        border: "color-mix(in srgb, var(--c-live) 30%, transparent)",
      };
    case "urgente":
      return {
        label: "Urgente",
        icon: <AlertTriangle size={12} />,
        bg: "color-mix(in srgb, var(--c-danger) 15%, transparent)",
        color: "var(--c-danger)",
        border: "color-mix(in srgb, var(--c-danger) 30%, transparent)",
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
        background: "color-mix(in srgb, var(--c-shadow) 82%, transparent)",
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
          boxShadow: "0 20px 40px color-mix(in srgb, var(--c-shadow) 60%, transparent)",
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
                background: "color-mix(in srgb, var(--c-action) 12%, transparent)",
                color: "var(--c-action)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--fs-16)", color: "var(--text)", fontWeight: 700 }}>
                Notificações
              </h3>
              <p style={{ margin: 0, fontSize: "var(--fs-12)", color: "var(--text-muted)" }}>
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
                  fontSize: "var(--fs-12)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  minHeight: "44px",
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
                color: "var(--c-text-2)",
                cursor: "pointer",
                width: "44px",
                height: "44px",
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
                <p style={{ margin: 0, fontSize: "var(--fs-14)", fontWeight: 600, color: "var(--text-muted)" }}>
                  Nenhuma notificação por aqui
                </p>
                <p style={{ margin: 0, fontSize: "var(--fs-12)", color: "var(--text-soft)" }}>
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
                      ? "1px solid color-mix(in srgb, var(--c-text) 4%, transparent)"
                      : "1px solid color-mix(in srgb, var(--c-action) 25%, transparent)",
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
                            background: "var(--c-action)",
                            boxShadow: "0 0 8px var(--c-action)",
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
                          fontSize: "var(--fs-12)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    </div>

                    <span style={{ fontSize: "var(--fs-12)", color: "var(--text-soft)" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : ""}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <h4
                    style={{
                      margin: "0 0 4px",
                      fontSize: "var(--fs-14)",
                      color: isLida ? "var(--text-muted)" : "var(--text)",
                      fontWeight: isLida ? 600 : 700,
                    }}
                  >
                    {item.titulo}
                  </h4>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--fs-14)",
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
                        fontSize: "var(--fs-12)",
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
