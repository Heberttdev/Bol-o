import { useState } from "react";

export const TEMA_KEY = "bolao_theme";

export function aplicarTemaInicial() {
  const tema = window.localStorage.getItem(TEMA_KEY) || "dark";
  document.documentElement.dataset.theme = tema;
  return tema;
}

export function useTema() {
  const [tema, setTema] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(TEMA_KEY) || "dark";
  });

  const alternar = () => {
    setTema((atual) => {
      const proximo = atual === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = proximo;
      try {
        window.localStorage.setItem(TEMA_KEY, proximo);
      } catch {}
      return proximo;
    });
  };

  return { tema, alternar };
}