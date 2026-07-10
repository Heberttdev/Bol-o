import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";
import logoBolao from "../assets/logo-bolao.png";

const TEMPO_MINIMO = 2000;
const TEMPO_MAXIMO = 6000;

export default function SplashGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { pronto } = useReady();

  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [splashVisivel, setSplashVisivel] = useState(true);
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimando(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setTempoMinimoPassou(true), TEMPO_MINIMO);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setTempoMinimoPassou(true), TEMPO_MAXIMO);
    return () => clearTimeout(t);
  }, []);

  const appPronto = !authLoading && (!user || pronto);

  useEffect(() => {
    if (tempoMinimoPassou && appPronto && !saindo) {
      setSaindo(true);
      const t = setTimeout(() => setSplashVisivel(false), 500);
      return () => clearTimeout(t);
    }
  }, [tempoMinimoPassou, appPronto, saindo]);

  return (
    <>
      {children}

      {splashVisivel && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F3D2E",
          opacity: saindo ? 0 : 1,
          transition: "opacity 0.5s ease",
          pointerEvents: saindo ? "none" : "auto",
          gap: "16px",
        }}>

          {/* Glow de fundo */}
          <div style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)",
            transform: animando ? "scale(1)" : "scale(0)",
            transition: "transform 0.8s ease",
          }} />

          {/* Logo */}
          <div style={{
            transform: animando ? "scale(1) translateY(0)" : "scale(0.4) translateY(20px)",
            opacity: animando ? 1 : 0,
            transition: "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
          }}>
            <img
              src={logoBolao}
              alt="Bolão Green"
              style={{
                width: "220px",
                height: "220px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Indicador de carregamento */}
          <div style={{
            display: "flex",
            gap: "6px",
            opacity: animando ? 1 : 0,
            transition: "opacity 0.5s ease 0.4s",
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#00ff88",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>

          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); opacity: 0.4; }
              50% { transform: translateY(-6px); opacity: 1; }
            }
          `}</style>

        </div>
      )}
    </>
  );
}