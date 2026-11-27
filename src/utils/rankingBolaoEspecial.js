import { calcularPontuacao } from "./calcularPontuacao";

export function calcularRankingBolao(bolao) {
  const resultados = bolao?.resultados || {};
  const palpites = bolao?.palpites || {};
  return Object.entries(bolao?.participantes || {})
    .map(([uid, p]) => {
      let pontos = 0;
      Object.entries(palpites[uid] || {}).forEach(([jogoId, pal]) => {
        pontos += calcularPontuacao(pal, resultados[jogoId]);
      });
      return { uid, nome: p.nome || uid, pontos, resposta: bolao?.respostas?.[uid] || null };
    })
    .sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
}
