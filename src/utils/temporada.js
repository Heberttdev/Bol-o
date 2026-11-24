import { calcularPontuacao } from "./calcularPontuacao";
import { competicaoDaFase } from "./fases";

const COMPETICOES_BRASILEIRAO = ["Série A", "Série B"];

// IDs do Brasileirão: "seriea-r36-...", legado com data "20261026-..." ou fase "Série A/B".
// A Champions usa "ucl-..." e fica fora.
export function ehJogoDoBrasileirao(jogoId, jogo) {
  if (jogo?.fase) return COMPETICOES_BRASILEIRAO.includes(competicaoDaFase(jogo.fase));
  return /^serie[ab]-/.test(jogoId) || /^\d{8}-/.test(jogoId);
}

function anoDoJogo(jogo) {
  const ano = new Date(jogo?.data || "").getFullYear();
  return Number.isFinite(ano) ? ano : null;
}

// Junta tudo o que pertence ao Brasileirão da temporada e monta o arquivo,
// a classificação final e a lista de caminhos a remover do ranking ativo.
export function planejarArquivamento({ jogos = {}, resultados = {}, bets = {}, perfis = {} }) {
  const ids = new Set();
  Object.entries(jogos).forEach(([id, j]) => {
    if (ehJogoDoBrasileirao(id, j)) ids.add(id);
  });
  Object.keys(resultados).forEach((id) => {
    if (!jogos[id] && ehJogoDoBrasileirao(id)) ids.add(id);
  });

  const anos = [...ids].map((id) => anoDoJogo(jogos[id])).filter(Boolean);
  const ano = anos.length ? Math.max(...anos) : null;
  const id = ano ? `brasileirao-${ano}` : null;

  const arquivoJogos = {};
  const arquivoResultados = {};
  const arquivoBets = {};
  const remocoes = {};
  let semResultado = 0;

  ids.forEach((jogoId) => {
    if (jogos[jogoId]) {
      arquivoJogos[jogoId] = jogos[jogoId];
      remocoes[`jogos/${jogoId}`] = null;
      if (!resultados[jogoId]) semResultado += 1;
    }
    if (resultados[jogoId]) {
      arquivoResultados[jogoId] = resultados[jogoId];
      remocoes[`resultados/${jogoId}`] = null;
    }
    remocoes[`palpitesPorJogo/${jogoId}`] = null;
  });

  const ranking = [];
  Object.entries(bets).forEach(([uid, palpites]) => {
    let pontos = 0;
    let exatos = 0;
    let total = 0;
    Object.entries(palpites || {}).forEach(([jogoId, p]) => {
      if (!ids.has(jogoId)) return;
      (arquivoBets[uid] ||= {})[jogoId] = p;
      remocoes[`bets/${uid}/${jogoId}`] = null;
      total += 1;
      const pts = calcularPontuacao(p, resultados[jogoId]);
      pontos += pts;
      if (pts >= 10) exatos += 1;
    });
    if (total === 0) return;
    const perfil = perfis[uid] || {};
    ranking.push({
      uid,
      nome: perfil.nome || "Jogador",
      ...(perfil.photoURL ? { photoURL: perfil.photoURL } : {}),
      pontos,
      exatos,
      palpites: total,
    });
  });
  ranking.sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome));

  return {
    id,
    ano,
    resumo: {
      totalJogos: Object.keys(arquivoJogos).length,
      totalResultados: Object.keys(arquivoResultados).length,
      semResultado,
      participantes: ranking.length,
    },
    temporada: id && {
      id,
      nome: `Brasileirão ${ano}`,
      competicoes: COMPETICOES_BRASILEIRAO,
      totalJogos: Object.keys(arquivoJogos).length,
      ranking,
    },
    arquivo: { jogos: arquivoJogos, resultados: arquivoResultados, bets: arquivoBets },
    remocoes,
  };
}

// Jogo novo cujo ID já existe com data de outro ano: importar por cima
// misturaria resultados e palpites de temporadas diferentes.
export function colisoesDeTemporada(existentes = {}, novos = []) {
  return novos.filter((n) => {
    const atual = existentes[n.id];
    if (!atual || !n.data) return false;
    const anoAtual = anoDoJogo(atual);
    const anoNovo = anoDoJogo(n);
    return anoAtual !== null && anoNovo !== null && anoAtual !== anoNovo;
  });
}
