import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";

const TEMPO_MINIMO = 2000;
const TEMPO_MAXIMO = 6000;

export default function SplashGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { pronto } = useReady();

  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);
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

  const saindo = tempoMinimoPassou && appPronto;

  useEffect(() => {
    if (!saindo) {
      return;
    }

    const t = setTimeout(() => setSplashVisivel(false), 500);
    return () => clearTimeout(t);
  }, [saindo]);

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
          gap: "24px",
        }}>

          {/* Glow de fundo */}
          <div style={{
            position: "absolute",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)",
            transform: animando ? "scale(1)" : "scale(0)",
            transition: "transform 0.8s ease",
          }} />

          {/* Escudo SVG */}
          <div style={{
            transform: animando ? "scale(1) translateY(0)" : "scale(0.3) translateY(30px)",
            opacity: animando ? 1 : 0,
            transition: "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
          }}>
            <svg viewBox="0 0 1024 1024" width="130" height="130" xmlns="http://www.w3.org/2000/svg">
              <path d="M512 48 L896 200 L896 560 Q896 800 512 976 Q128 800 128 560 L128 200 Z"
                fill="#0a2e20" stroke="#FFD700" strokeWidth="24"/>
              <circle cx="512" cy="490" r="220" fill="white" stroke="#0F3D2E" strokeWidth="12"/>
              <polygon points="512,310 580,370 555,455 469,455 444,370" fill="#0F3D2E"/>
              <polygon points="688,355 740,420 710,490 650,470 640,390" fill="#0F3D2E"/>
              <polygon points="336,355 284,420 314,490 374,470 384,390" fill="#0F3D2E"/>
              <polygon points="420,620 390,700 460,710 512,650 564,710 634,700 604,620 555,610 469,610" fill="#0F3D2E"/>
              <text x="512" y="860"
                fontFamily="Arial Black, sans-serif"
                fontSize="88"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFD700"
                letterSpacing="4">BOLÃO</text>
              <line x1="280" y1="878" x2="744" y2="878"
                stroke="#FFD700" strokeWidth="6" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Texto */}
          <div style={{
            textAlign: "center",
            transform: animando ? "translateY(0)" : "translateY(16px)",
            opacity: animando ? 1 : 0,
            transition: "transform 0.6s ease 0.25s, opacity 0.5s ease 0.25s",
          }}>
            <h1 style={{
              color: "#FFD700",
              fontSize: "1.6rem",
              fontWeight: "bold",
              margin: 0,
              letterSpacing: "2px",
            }}>
              Bolão Green
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8rem",
              margin: "6px 0 0",
              letterSpacing: "1px",
            }}>
              Faça seus palpites
            </p>
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