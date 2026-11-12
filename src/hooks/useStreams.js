import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Domínio mudou de .st para .si (o 301 da Cloudflare não envia CORS).
const API = import.meta.env.VITE_STREAMS_API || "https://api.reidoscanais.si";

// Intervalo de nova busca enquanto há jogo ao vivo ou prestes a começar.
const INTERVALO_ATIVO_MS = 90 * 1000;

const ALIASES = {
  psg: "paris saint germain",
  inter: "internazionale",
};

function normalizarNome(nome) {
  return (nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(fc|cf|sc|ssc|ac|sk|fk|ud|cd|cdjr)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nomesIgualam(nomeJogo, nomeStream) {
  let nJogo = normalizarNome(nomeJogo);
  let nStream = normalizarNome(nomeStream);
  if (ALIASES[nJogo]) nJogo = ALIASES[nJogo];
  if (ALIASES[nStream]) nStream = ALIASES[nStream];
  if (!nJogo || !nStream) return false;
  return nJogo === nStream || nJogo.includes(nStream) || nStream.includes(nJogo);
}

// Alguns eventos vêm sem `teams`; nesse caso extrai "Casa x Fora" do título.
function timesDoEvento(ev) {
  const home = ev.teams?.home?.name;
  const away = ev.teams?.away?.name;
  if (home && away) return [home, away];
  const partes = (ev.title || "").split(/\s+(?:x|vs\.?)\s+/i);
  return partes.length === 2 ? partes : [home || "", away || ""];
}

async function buscarEventos(signal) {
  const res = await fetch(`${API}/sports?category=Futebol`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.data)) throw new Error("Resposta inválida");
  return data.data;
}

/**
 * Busca transmissões e associa aos jogos do bolão.
 * - `ativo`: quando true, refaz a busca a cada 90 s (jogo ao vivo ou começando).
 * - Sempre refaz a busca quando o app/aba volta a ficar visível.
 * Retorna `status`: "carregando" | "ok" | "erro".
 */
export function useStreams(jogos, { ativo = false } = {}) {
  const [eventos, setEventos] = useState(null);
  const [status, setStatus] = useState("carregando");
  const controleRef = useRef(null);

  const buscar = useCallback(() => {
    controleRef.current?.abort();
    const controle = new AbortController();
    controleRef.current = controle;
    buscarEventos(controle.signal).then(
      (lista) => {
        setEventos(lista);
        setStatus("ok");
      },
      (err) => {
        if (err.name === "AbortError") return;
        console.warn("Erro ao buscar streams:", err);
        // Mantém a última lista boa, se houver; só sinaliza erro sem dados.
        setStatus((anterior) => (anterior === "ok" ? "ok" : "erro"));
      }
    );
  }, []);

  const recarregar = useCallback(() => {
    setStatus("carregando");
    buscar();
  }, [buscar]);

  useEffect(() => {
    buscar();
    return () => controleRef.current?.abort();
  }, [buscar]);

  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") buscar();
    }, INTERVALO_ATIVO_MS);
    return () => clearInterval(id);
  }, [ativo, buscar]);

  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible") buscar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [buscar]);

  const streams = useMemo(() => {
    const mapa = {};
    if (!eventos || !jogos?.length) return mapa;
    for (const jogo of jogos) {
      const encontrado = eventos.find((ev) => {
        const [home, away] = timesDoEvento(ev);
        return nomesIgualam(jogo.casa, home) && nomesIgualam(jogo.fora, away);
      });
      if (encontrado && encontrado.embeds?.length > 0) mapa[jogo.id] = encontrado;
    }
    return mapa;
  }, [eventos, jogos]);

  return { streams, status, recarregar };
}
