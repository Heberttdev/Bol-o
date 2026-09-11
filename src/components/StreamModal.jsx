import { useState } from "react";
import { X, Tv, ChevronDown } from "lucide-react";

export default function StreamModal({ evento, jogo, onFechar }) {
  const [embedSelecionado, setEmbedSelecionado] = useState(0);

  const embed = evento.embeds[embedSelecionado];
  const inicio = jogo?.data ? new Date(jogo.data) : null;
  const aguardandoInicio = inicio && !Number.isNaN(inicio.getTime()) && inicio > new Date();

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: "rgba(0,0,0,0.9)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "max(16px, env(safe-area-inset-top)) 16px 16px",
    }}>

      <div style={{
        background: "var(--card)",
        borderRadius: "14px",
        width: "100%",
        maxWidth: "600px",
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tv size={18} color="#00ff88" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
                {evento.title}
              </p>
              {evento.competition && (
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {evento.competition}
                </p>
              )}
            </div>
          </div>

          <button onClick={onFechar} style={{
            background: "transparent", border: "none",
            color: "var(--text-muted)", cursor: "pointer", padding: "4px",
          }}>
            <X size={20} />
          </button>
        </div>

        {aguardandoInicio && (
          <div style={{ padding: "10px 16px", background: "rgba(255, 215, 0, 0.12)", color: "#ffd700", fontSize: "0.8rem" }}>
            A partida começa às {inicio.toLocaleString("pt-BR")}. O player pode permanecer em espera até o início.
          </div>
        )}

        {/* Player */}
        <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
          <iframe
            key={embedSelecionado}
            src={embed.embed_url}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              border: "none",
            }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>

        {/* Seletor de servidores */}
        {evento.embeds.length > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <ChevronDown size={14} /> Escolha o servidor
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {evento.embeds.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setEmbedSelecionado(i)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    background: i === embedSelecionado ? "#00ff88" : "var(--input-bg)",
                    color: i === embedSelecionado ? "#000" : "var(--text)",
                    transition: "all 0.2s",
                  }}
                >
                  {e.provider} {e.quality && `· ${e.quality}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info servidor atual */}
        <div style={{ padding: "8px 16px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00ff88", animation: "blink 1.2s infinite" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {embed.provider} {embed.quality && `· ${embed.quality}`}
          </span>
        </div>

      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
