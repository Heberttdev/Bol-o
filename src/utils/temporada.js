import { calcularPontuacao } from "./calcularPontuacao";
import { competicaoDaFase } from "./fases";

export const COMPETICOES = [
  { nome: "Série A", slug: "seriea", prefixo: /^seriea-/ },
  { nome: "Série B", slug: "serieb", prefixo: /^serieb-/ },
  { nome: "Liga dos Campeões", slug: "champions", prefixo: /^ucl-/ },
];

// Sem o jogo no banco, a competição vem do prefixo do ID. IDs legados com data
// ("20261026-...") são anteriores à Série B no bolão e contam como Série A.
export function competicaoDoJogo(jogoId, jogo) {
  if (jogo?.fase) return competicaoDaFase(jogo.fase);
  const conhecida = COMPETICOES.find((c) => c.prefixo.test(jogoId));
  if (conhecida) return conhecida.nome;
  if (/^\d{8}-/.test(jogoId)) return "Série A";
  return null;
}

function slugDaCompeticao(nome) {
  const conhecida = COMPETICOES.find((c) => c.nome === nome);
  if (conhecida) return conhecida.slug;
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function anoDoJogo(jogo) {
  const ano = new Date(jogo?.data || "").getFullYear();
  return Number.isFinite(ano) ? ano : null;
}

// Temporada que vira o ano (Champions 2026/27) leva os dois anos no nome e no ID.
function rotulosDaTemporada(anos) {
  if (!anos.length) return null;
  const ini = Math.min(...anos);
  const fim = Math.max(...anos);
  if (ini === fim) return { id: `${fim}`, nome: `${fim}` };
  const curto = String(fim).slice(-2);
  return { id: `${ini}-${curto}`, nome: `${ini}/${curto}` };
}

export function competicoesEmAndamento({ jogos = {}, resultados = {} }) {
  const nomes = new Set();
  Object.entries(jogos).forEach(([id, j]) => {
    const c = competicaoDoJogo(id, j);
    if (c) nomes.add(c);
  });
  Object.keys(resultados).forEach((id) => {
    if (jogos[id]) return;
    const c = competicaoDoJogo(id);
    if (c) nomes.add(c);
  });
  const ordem = COMPETICOES.map((c) => c.nome);
  return [...nomes].sort((a, b) => {
    const ia = ordem.indexOf(a);
    const ib = ordem.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}

export function ordenarClassificacao(lista) {
  return lista.sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos || a.nome.localeCompare(b.nome));
}

// Empatados em pontos e placares exatos dividem o título.
export function campeoesDaClassificacao(ranking = []) {
  const [primeiro] = ranking;
  if (!primeiro || primeiro.pontos <= 0) return [];
  return ranking.filter((r) => r.pontos === primeiro.pontos && r.exatos === primeiro.exatos);
}

// Junta tudo o que pertence a um campeonato e monta o arquivo, a classificação
// final (só com os jogos dele) e a lista de caminhos a remover do ranking ativo.
export function planejarArquivamento({ competicao, jogos = {}, resultados = {}, bets = {}, perfis = {} }) {
  const ids = new Set();
  Object.entries(jogos).forEach(([id, j]) => {
    if (competicaoDoJogo(id, j) === competicao) ids.add(id);
  });
  Object.keys(resultados).forEach((id) => {
    if (!jogos[id] && competicaoDoJogo(id) === competicao) ids.add(id);
  });

  const rotulos = rotulosDaTemporada([...ids].map((id) => anoDoJogo(jogos[id])).filter(Boolean));
  const id = rotulos ? `${slugDaCompeticao(competicao)}-${rotulos.id}` : null;
  const nome = rotulos ? `${competicao} ${rotulos.nome}` : null;

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
  ordenarClassificacao(ranking);
  const campeoes = campeoesDaClassificacao(ranking).map((r) => r.uid);

  return {
    id,
    competicao,
    resumo: {
      totalJogos: Object.keys(arquivoJogos).length,
      totalResultados: Object.keys(arquivoResultados).length,
      semResultado,
      participantes: ranking.length,
    },
    temporada: id && {
      id,
      nome,
      competicao,
      competicoes: [competicao],
      totalJogos: Object.keys(arquivoJogos).length,
      ranking,
      campeoes,
    },
    arquivo: { jogos: arquivoJogos, resultados: arquivoResultados, bets: arquivoBets },
    remocoes,
  };
}

export function planejarTodas(dados) {
  return competicoesEmAndamento(dados).map((competicao) => planejarArquivamento({ ...dados, competicao }));
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
