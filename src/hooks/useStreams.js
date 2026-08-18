import { useEffect, useState } from "react";

const API = "https://api.reidoscanais.st";

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
          const casaNorm = jogo.casa?.toLowerCase().trim();
          const foraNorm = jogo.fora?.toLowerCase().trim();

          const encontrado = eventos.find((ev) => {
            const homeNorm = ev.teams?.home?.name?.toLowerCase().trim();
            const awayNorm = ev.teams?.away?.name?.toLowerCase().trim();

            return (
              (homeNorm?.includes(casaNorm) || casaNorm?.includes(homeNorm)) &&
              (awayNorm?.includes(foraNorm) || foraNorm?.includes(awayNorm))
            );
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