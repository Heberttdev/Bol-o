import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";

const TEMPO_MINIMO = 1200; // ms — evita "flash" rápido demais se carregar instantâneo
const TEMPO_MAXIMO = 6000; // ms — trava de segurança, caso algo nunca termine de carregar

export default function SplashGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { pronto } = useReady();

  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [splashVisivel, setSplashVisivel] = useState(true);

  // Garante um tempo mínimo de exibição
  useEffect(() => {
    const timer = setTimeout(() => setTempoMinimoPassou(true), TEMPO_MINIMO);
    return () => clearTimeout(timer);
  }, []);

  // Trava de segurança: nunca deixa a splash presa pra sempre
  useEffect(() => {
    const timer = setTimeout(() => setTempoMinimoPassou(true), TEMPO_MAXIMO);
    return () => clearTimeout(timer);
  }, []);

  // Se não há usuário logado, a tela de Login não depende de dados —
  // só precisamos esperar o Auth terminar de verificar.
  // Se há usuário logado, esperamos também a página avisar que carregou ("pronto").
  const appPronto = !authLoading && (!user || pronto);

  useEffect(() => {
    const podeEsconder = tempoMinimoPassou && appPronto;

    if (podeEsconder && !saindo) {
      setSaindo(true);
      const timer = setTimeout(() => setSplashVisivel(false), 400); // tempo do fade
      return () => clearTimeout(timer);
    }
  }, [tempoMinimoPassou, appPronto, saindo]);

  return (
    <>
      {children}

      {splashVisivel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F3D2E",
            opacity: saindo ? 0 : 1,
            transition: "opacity 0.4s ease",
            pointerEvents: saindo ? "none" : "auto",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "12px",
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          >
            ⚽
          </div>

          <h1
            style={{
              color: "#FFD700",
              fontSize: "1.8rem",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            Bolão Green
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.9rem",
              marginTop: "8px",
            }}
          >
            Carregando...
          </p>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.15); opacity: 0.7; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}