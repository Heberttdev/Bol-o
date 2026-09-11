import { calcularPontuacao } from "./calcularPontuacao";

function faseCurta(fase) {
  const m = /rodada\s*(\d+)/i.exec(fase || "");
  return m ? `R${m[1]}` : fase;
}

// Agrupa as rodadas pelo número, somando Série A + Série B na mesma rodada.
// Ex.: "Série A - Rodada 27" e "Série B - Rodada 27" viram "Rodada 27".
function serieDaFase(fase) {
  const m = /rodada\s*(\d+)/i.exec(fase || "");
  return m ? `Rodada ${m[1]}` : fase;
}

export function montarEvolucao({ users, bets, resultados, jogos, uid }) {
  const fasePorJogo = {};
  (jogos || []).forEach((j) => {
    if (j.id) fasePorJogo[j.id] = serieDaFase(j.fase);
  });

  const dataFase = {};
  (jogos || []).forEach((j) => {
    if (j.fase && j.data) {
      const fase = serieDaFase(j.fase);
      const t = new Date(j.data).getTime();
      if (!dataFase[fase] || t < dataFase[fase]) dataFase[fase] = t;
    }
  });

  const fases = [...new Set(Object.values(fasePorJogo).filter(Boolean))];
  fases.sort((a, b) => (dataFase[a] || Infinity) - (dataFase[b] || Infinity));

  const pontosPorFase = {};
  const uids = Object.keys(users || {});
  uids.forEach((u) => {
    pontosPorFase[u] = {};
    const betsUsuario = bets?.[u] || {};
    Object.entries(betsUsuario).forEach(([jogoId, palpite]) => {
      const fase = fasePorJogo[jogoId];
      if (!fase) return;
      pontosPorFase[u][fase] =
        (pontosPorFase[u][fase] || 0) + calcularPontuacao(palpite, resultados?.[jogoId]);
    });
  });

  const posFase = {};
  fases.forEach((fase) => {
    const lista = [...uids].sort(
      (a, b) => (pontosPorFase[b][fase] || 0) - (pontosPorFase[a][fase] || 0)
    );
    lista.forEach((u, idx) => {
      if (!posFase[u]) posFase[u] = {};
      posFase[u][fase] = idx + 1;
    });
  });

  const faseAtual = fases[fases.length - 1] || null;
  const faseAnterior = fases.length >= 2 ? fases[fases.length - 2] : null;

  const listaRanking = uids
    .map((u) => ({
      uid: u,
      nome: users[u]?.nome || "Jogador",
      pontos: Object.keys(bets?.[u] || {}).reduce(
        (soma, jogoId) => soma + calcularPontuacao(bets?.[u]?.[jogoId], resultados?.[jogoId]),
        0
      ),
    }))
    .sort((a, b) => b.pontos - a.pontos);

  const posicaoTotal = listaRanking.findIndex((item) => item.uid === uid) + 1;

  const evolucao = fases.map((fase) => ({
    fase,
    nomeCurto: faseCurta(fase),
    pontos: pontosPorFase[uid]?.[fase] || 0,
    posicao: posFase[uid]?.[fase] ?? null,
  }));

  const posAtual = faseAtual ? posFase[uid]?.[faseAtual] ?? null : null;
  const posAnterior = faseAnterior ? posFase[uid]?.[faseAnterior] ?? null : null;
  let delta = null;
  if (posAtual != null && posAnterior != null) {
    delta = posAnterior - posAtual;
  }

  return {
    fases,
    faseAtual,
    faseAnterior,
    evolucao,
    posicaoTotal,
    posAtual,
    posAnterior,
    delta,
    pontosFaseAtual: pontosPorFase[uid]?.[faseAtual] || 0,
  };
}