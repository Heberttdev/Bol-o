export function calcularPontuacao(
  palpite,
  resultado
) {
  if (!palpite || !resultado) {
    return 0;
  }

  // placar exato
  if (
    palpite.casa === resultado.casa &&
    palpite.fora === resultado.fora
  ) {
    return 10;
  }

  const vencedorPalpite =
    palpite.casa > palpite.fora
      ? "casa"
      : palpite.casa < palpite.fora
        ? "fora"
        : "empate";

  const vencedorResultado =
    resultado.casa > resultado.fora
      ? "casa"
      : resultado.casa < resultado.fora
        ? "fora"
        : "empate";

  if (vencedorPalpite === vencedorResultado) {
    return 5;
  }

  return 0;
}