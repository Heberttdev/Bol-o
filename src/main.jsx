import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./index.css";
import "./App.css";
import "./styles/theme.css";
import { aplicarTemaInicial } from "./hooks/useTheme";

aplicarTemaInicial();

// PWA: registra o service worker e recarrega sozinho quando sai versão nova.
if ("serviceWorker" in navigator) {
  // Só recarrega se já havia um SW controlando a página (evita reload no 1º acesso).
  const jaTinhaController = !!navigator.serviceWorker.controller;
  let recarregando = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recarregando || !jaTinhaController) return;
    recarregando = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      const checarAtualizacao = () => registration.update().catch(() => {});
      checarAtualizacao();
      setInterval(checarAtualizacao, 30 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checarAtualizacao();
      });
    } catch (erro) {
      console.error("Falha ao registrar service worker:", erro);
    }
  });
}

ReactDOM.createRoot(
  document.getElementById("root")

  

).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);