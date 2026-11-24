
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";
import SplashAnimation from "./SplashAnimation";

const JA_VIU_KEY = "bolao_ja_viu_splash";
let jaVisitou;
try {
  jaVisitou = window.localStorage.getItem(JA_VIU_KEY) === "1";
} catch {
  jaVisitou = false;
}

// Tempo mínimo da Splash (mais curto para quem já conhece o app)
const TEMPO_MINIMO = jaVisitou ? 1200 : 3000;

const TEMPO_MAXIMO = 6000;

export default function SplashGate({ children }) {
  const { user, loading: authLoading } = useAuth();

  const { pronto } = useReady();

  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);

  const [splashVisivel, setSplashVisivel] = useState(true);

  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimando(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTempoMinimoPassou(true);
    }, TEMPO_MINIMO);

    return () => clearTimeout(timer);
  }, []);

  const [tempoMaximoPassou, setTempoMaximoPassou] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTempoMaximoPassou(true);
    }, TEMPO_MAXIMO);

    return () => clearTimeout(timer);
  }, []);

  const appPronto = !authLoading && (!user || pronto);

  // Só o Início avisa "pronto"; nas outras rotas a splash sai pelo tempo máximo.
  const podeFechar = (tempoMinimoPassou && appPronto) || tempoMaximoPassou;

  useEffect(() => {
    if (!podeFechar) return;

    try {
      window.localStorage.setItem(JA_VIU_KEY, "1");
    } catch {
      // armazenamento indisponível — segue sem marcar visita
    }

    const timer = setTimeout(() => {
      setSplashVisivel(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [podeFechar]);

  return (
   <>
    <div
        className={`
            app-wrapper
            ${splashVisivel ? "app-blur" : ""}
            ${podeFechar ? "app-show" : ""}
        `}
    >
        {children}
    </div>

    {splashVisivel && (
        <SplashAnimation
            animando={animando}
            saindo={podeFechar}
        />
    )}
</>
  );
}