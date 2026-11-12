import { useCallback, useEffect, useRef, useState } from "react";
import { X, Tv, ChevronDown, Loader2 } from "lucide-react";
import { getEscudo } from "../utils/escudos";

const CHAVE_SERVIDOR = "bolao:stream-servidor";
// Depois desse tempo sem carregar, sugere trocar de servidor.
const LIMITE_CARREGAMENTO_MS = 10 * 1000;

function lerServidorPreferido() {
  try {
    return localStorage.getItem(CHAVE_SERVIDOR);
  } catch {
    return null;
  }
}

function salvarServidorPreferido(provider) {
  try {
    if (provider) localStorage.setItem(CHAVE_SERVIDOR, provider);
  } catch {
    // Armazenamento indisponível: só não lembra a escolha.
  }
}

function indiceInicial(embeds) {
  const preferido = lerServidorPreferido();
  const i = preferido ? embeds.findIndex((e) => e.provider === preferido) : -1;
  return i >= 0 ? i : 0;
}

function Escudo({ nome }) {
  const url = getEscudo(nome);
  return url ? <img src={url} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} /> : null;
}

export default function StreamModal({ evento, jogo, onFechar }) {
  const embeds = evento.embeds || [];
  const [embedSelecionado, setEmbedSelecionado] = useState(() => indiceInicial(embeds));
  const [carregado, setCarregado] = useState(false);
  const [demorando, setDemorando] = useState(false);
  const botaoFecharRef = useRef(null);
  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  const embed = embeds[embedSelecionado];
  const urlSegura = typeof embed?.embed_url === "string" && embed.embed_url.startsWith("https://") ? embed.embed_url : null;
  const inicio = jogo?.data ? new Date(jogo.data) : null;
  const aguardandoInicio = inicio && !Number.isNaN(inicio.getTime()) && inicio > new Date();
  const titulo = jogo ? `${jogo.casa} x ${jogo.fora}` : evento.title;

  // Botão voltar (Android/navegador) fecha o player em vez de sair da tela.
  useEffect(() => {
    if (!window.history.state?.streamModal) {
      window.history.pushState({ ...window.history.state, streamModal: true }, "");
    }
    const aoVoltar = () => onFecharRef.current();
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  const fechar = useCallback(() => {
    if (window.history.state?.streamModal) window.history.back();
    else onFecharRef.current();
  }, []);

  // Esc fecha, rolagem do fundo travada e foco inicial no botão de fechar.
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botaoFecharRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [fechar]);

  // Se o servidor atual não carregar a tempo, oferece trocar.
  useEffect(() => {
    if (!urlSegura || carregado) return;
    const id = setTimeout(() => setDemorando(true), LIMITE_CARREGAMENTO_MS);
    return () => clearTimeout(id);
  }, [embedSelecionado, urlSegura, carregado]);

  function escolherServidor(i) {
    if (i !== embedSelecionado) {
      setCarregado(false);
      setDemorando(false);
    }
    setEmbedSelecionado(i);
    salvarServidorPreferido(embeds[i]?.provider);
  }

  const proximoServidor = embeds.length > 1 ? (embedSelecionado + 1) % embeds.length : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stream-modal-titulo"
      onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "color-mix(in srgb, var(--c-shadow) 90%, transparent)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "max(16px, env(safe-area-inset-top)) 16px 16px",
        overflowY: "auto",
      }}
    >
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
          gap: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <Tv size={18} color="currentColor" style={{ color: "var(--c-action)", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p id="stream-modal-titulo" style={{ margin: 0, fontWeight: 700, fontSize: "var(--fs-16)", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {jogo ? (
                  <>
                    <Escudo nome={jogo.casa} /> {jogo.casa}
                    <span style={{ color: "var(--text-muted)" }}>x</span>
                    <Escudo nome={jogo.fora} /> {jogo.fora}
                  </>
                ) : titulo}
              </p>
              {(evento.competition || jogo?.fase) && (
                <p style={{ margin: 0, fontSize: "var(--fs-12)", color: "var(--text-muted)" }}>
                  {evento.competition || jogo.fase}
                </p>
              )}
            </div>
          </div>

          <button ref={botaoFecharRef} type="button" onClick={fechar} aria-label="Fechar transmissão" style={{
            background: "transparent", border: "none",
            color: "var(--text-muted)", cursor: "pointer",
            width: "44px", height: "44px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={20} />
          </button>
        </div>

        {aguardandoInicio && (
          <div style={{ padding: "10px 16px", background: "color-mix(in srgb, var(--c-gold) 12%, transparent)", color: "var(--c-gold)", fontSize: "var(--fs-12)" }}>
            A partida começa às {inicio.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}. O player pode permanecer em espera até o início.
          </div>
        )}

        {/* Player */}
        <div style={{ position: "relative", paddingBottom: "56.25%", background: "var(--c-shadow)" }}>
          {urlSegura ? (
            <>
              <iframe
                key={embedSelecionado}
                src={urlSegura}
                title={`Transmissão: ${titulo}`}
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="no-referrer"
                onLoad={() => setCarregado(true)}
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  border: "none",
                }}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              />
              {!carregado && (
                <div
                  role="status"
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px",
                    color: "var(--text-muted)", fontSize: "var(--fs-14)", textAlign: "center", padding: "16px",
                    pointerEvents: demorando ? "auto" : "none",
                  }}
                >
                  <Loader2 size={28} className="spin" />
                  <span>Carregando transmissão…</span>
                  {demorando && proximoServidor !== null && (
                    <button
                      type="button"
                      onClick={() => escolherServidor(proximoServidor)}
                      style={{
                        minHeight: "44px", padding: "0 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                        background: "var(--c-action)", color: "var(--c-on-accent)", fontWeight: 600, fontSize: "var(--fs-14)",
                      }}
                    >
                      Não carregou? Tentar {embeds[proximoServidor].provider}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ position: "absolute", inset: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--fs-14)" }}>
              Servidor indisponível. Escolha outro.
            </p>
          )}
        </div>

        {/* Seletor de servidores */}
        {embeds.length > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 8px", fontSize: "var(--fs-12)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <ChevronDown size={14} /> Escolha o servidor
            </p>
            <div role="group" aria-label="Servidores" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {embeds.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i === embedSelecionado}
                  onClick={() => escolherServidor(i)}
                  style={{
                    minHeight: "44px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "var(--fs-14)",
                    fontWeight: 600,
                    background: i === embedSelecionado ? "var(--c-action)" : "var(--input-bg)",
                    color: i === embedSelecionado ? "var(--c-on-accent)" : "var(--text)",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {e.provider || `Servidor ${i + 1}`}{e.quality && ` · ${e.quality}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info servidor atual */}
        {embed && (
          <div style={{ padding: "8px 16px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <div aria-hidden="true" className="stream-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--c-action)" }} />
            <span style={{ fontSize: "var(--fs-12)", color: "var(--text-muted)" }}>
              {embed.provider} {embed.quality && `· ${embed.quality}`}
            </span>
          </div>
        )}

      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .stream-dot { animation: blink 1.2s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .stream-dot { animation: none; }
        }
      `}</style>
    </div>
  );
}
