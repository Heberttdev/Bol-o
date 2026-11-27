// Helpers de texto: contagens com singular/plural e posição no ranking.

/** "1 placar exato", "26 placares exatos", "0 pts". Só 1 (ou -1) é singular. */
export function plural(n, singular, pluralForma) {
  return `${n} ${Math.abs(Number(n)) === 1 ? singular : pluralForma}`;
}

/** Notação única de posição: "3º". Sem posição válida → "–". */
export function formatarPosicao(n) {
  const v = Number(n);
  if (n == null || n === "" || !Number.isInteger(v) || v <= 0) return "–";
  return `${v}º`;
}

/** Pontos abreviados: "1 pt", "0 pts", "12 pts". */
export function formatarPontos(n) {
  return plural(n, "pt", "pts");
}
