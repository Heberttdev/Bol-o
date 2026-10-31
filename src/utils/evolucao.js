import { calcularPontuacao } from "./calcularPontuacao";

const OFFSET_BRASILIA_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function inicioDaSemana(tempo) {
  const local = new Date(tempo - OFFSET_BRASILIA_MS);
  const diasDesdeSegunda = (local.getUTCDay() + 6) % 7;
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - diasDesdeSegunda);
}

function chaveDaSemana(inicio) {
  return new Date(inicio).toISOString().slice(0, 10);
}

export function semanaDoJogo(jogo) {
  const t = new Date(jogo?.data || "").getTime();
  return Number.isFinite(t) ? chaveDaSemana(inicioDaSemana(t)) : null;
}

export function semanaAtual(agora = Date.now()) {
  return chaveDaSemana(inicioDaSemana(agora));
}

function nomeCurtoSemana(chave) {
  const d = new Date(`${chave}T00:00:00Z`);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function rotuloSemana(chave, agora = Date.now()) {
  if (!chave) return "";
  if (chave === semanaAtual(agora)) return "Esta semana";
  if (chave === semanaAtual(agora - 7 * DIA_MS)) return "Semana passada";
  const ini = new Date(`${chave}T00:00:00Z`);
  const fim = new Date(ini.getTime() + 6 * DIA_MS);
  const mesmoMes = ini.getUTCMonth() === fim.getUTCMonth();
  const dIni = String(ini.getUTCDate()).padStart(2, "0");
  const dFim = String(fim.getUTCDate()).padStart(2, "0");
  return mesmoMes
    ? `Semana ${dIni}–${dFim}/${MESES[fim.getUTCMonth()]}`
    : `Semana ${dIni}/${MESES[ini.getUTCMonth()]}–${dFim}/${MESES[fim.getUTCMonth()]}`;
}

export function montarEvolucao({ users, bets, resultados, jogos, uid }) {
  const fasePorJogo = {};
  (jogos || []).forEach((j) => {
    if (j.id) fasePorJogo[j.id] = semanaDoJogo(j);
  });

  const dataFase = {};
  Object.values(fasePorJogo).forEach((semana) => {
    if (semana) dataFase[semana] = new Date(`${semana}T03:00:00Z`).getTime();
  });

  const fases = [...new Set(Object.values(fasePorJogo).filter(Boolean))].sort();

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

  const agora = Date.now();

  const faseComResultadoMaisRecente = () => {
    let fase = null;
    let tMaisRecente = -Infinity;
    (jogos || []).forEach((j) => {
      if (!j.id || !j.data || !resultados?.[j.id]) return;
      const t = new Date(j.data).getTime();
      if (t > tMaisRecente) {
        tMaisRecente = t;
        fase = fasePorJogo[j.id];
      }
    });
    return fase;
  };

  const ultimaFaseIniciada = () => {
    for (let i = fases.length - 1; i >= 0; i--) {
      if ((dataFase[fases[i]] || Infinity) <= agora) return fases[i];
    }
    return null;
  };

  const faseAtual =
    faseComResultadoMaisRecente() ||
    ultimaFaseIniciada() ||
    fases[fases.length - 1] ||
    null;

  const idxAtual = fases.indexOf(faseAtual);
  const faseAnterior = idxAtual > 0 ? fases[idxAtual - 1] : null;

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
    nomeCurto: nomeCurtoSemana(fase),
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
    rotuloFaseAtual: rotuloSemana(faseAtual, agora),
    faseAnterior,
    evolucao,
    posicaoTotal,
    posAtual,
    posAnterior,
    delta,
    pontosFaseAtual: pontosPorFase[uid]?.[faseAtual] || 0,
  };
}