// src/components/SplashGate.jsx

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useReady } from "../context/ReadyContext";
import SplashAnimation from "./SplashAnimation";

// Tempo mínimo da Splash
const TEMPO_MINIMO = 3000;

// Tempo máximo de espera
const TEMPO_MAXIMO = 6000;

export default function SplashGate({ children }) {
  // Estado da autenticação
  const { user, loading: authLoading } = useAuth();

  // Estado de carregamento da aplicação
  const { pronto } = useReady();

  // Controla se o tempo mínimo passou
  const [tempoMinimoPassou, setTempoMinimoPassou] = useState(false);

  // Controla se a Splash ainda está visível
  const [splashVisivel, setSplashVisivel] = useState(true);

  // Dispara as animações de entrada
  const [animando, setAnimando] = useState(false);

  // Inicia animação poucos milissegundos após montar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimando(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Tempo mínimo obrigatório
  useEffect(() => {
    const timer = setTimeout(() => {
      setTempoMinimoPassou(true);
    }, TEMPO_MINIMO);

    return () => clearTimeout(timer);
  }, []);

  // Timeout de segurança
  useEffect(() => {
    const timer = setTimeout(() => {
      setTempoMinimoPassou(true);
    }, TEMPO_MAXIMO);

    return () => clearTimeout(timer);
  }, []);

  // Aplicação pronta
  const appPronto = !authLoading && (!user || pronto);

  // Splash pode sair?
  const podeFechar = tempoMinimoPassou && appPronto;

  // Aguarda a animação de fade terminar
  useEffect(() => {
    if (!podeFechar) return;

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