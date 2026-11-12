import { useEffect, useState } from "react";

// Domínio mudou de .st para .si (o 301 da Cloudflare não envia CORS).
const API = import.meta.env.VITE_STREAMS_API || "https://api.reidoscanais.si";

const ALIASES = {
  psg: "paris saint germain",
  inter: "internazionale",
};

function normalizarNome(nome) {
  return (nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

export function useStreams(jogos) {
  const [streams, setStreams] = useState({}); // { jogoId: eventoAPI }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jogos || jogos.length === 0) return;

    async function buscar() {
      try {
        const res = await fetch(`${API}/sports?category=Futebol`);
        const data = await res.json();

        if (!data.success) return;

        const eventos = data.data;
        const mapa = {};

        for (const jogo of jogos) {
          const encontrado = eventos.find((ev) => {
            const [home, away] = timesDoEvento(ev);
            return nomesIgualam(jogo.casa, home) && nomesIgualam(jogo.fora, away);
          });

          if (encontrado && encontrado.embeds?.length > 0) {
            mapa[jogo.id] = encontrado;
          }
        }

        setStreams(mapa);
      } catch (err) {
        console.warn("Erro ao buscar streams:", err);
      } finally {
        setLoading(false);
      }
    }

    buscar();
  }, [jogos]);

  return { streams, loading };
}