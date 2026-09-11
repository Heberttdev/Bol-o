import { useEffect, useState } from "react";

const API = "https://api.reidoscanais.st";

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
            const homeNorm = ev.teams?.home?.name || "";
            const awayNorm = ev.teams?.away?.name || "";

            return nomesIgualam(jogo.casa, homeNorm) && nomesIgualam(jogo.fora, awayNorm);
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