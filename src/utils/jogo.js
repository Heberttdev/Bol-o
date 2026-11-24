export const DURACAO_JOGO_MS = 2 * 60 * 60 * 1000;

export const STATUS_JOGO = Object.freeze({
  ABERTO: "aberto",
  EM_ANDAMENTO: "em_andamento",
  ENCERRADO: "encerrado",
});

const ms = (agora) => (agora instanceof Date ? agora.getTime() : Number(agora));

// Instante em que o palpite fecha: `lockAt` quando houver, senão o início do jogo.
export function instanteTrava(jogo) {
  if (typeof jogo?.lockAt === "number") return jogo.lockAt;
  const inicio = new Date(jogo?.data || "").getTime();
  return Number.isFinite(inicio) ? inicio : null;
}

export function jogoTravado(jogo, agora) {
  const trava = instanteTrava(jogo);
  return trava !== null && ms(agora) >= trava;
}

export function obterStatusJogo(jogo, resultado, agora) {
  if (resultado) return STATUS_JOGO.ENCERRADO;
  if (!jogo?.data) return STATUS_JOGO.ABERTO;
  const inicio = new Date(jogo.data).getTime();
  const t = ms(agora);
  if (t >= inicio + DURACAO_JOGO_MS) return STATUS_JOGO.ENCERRADO;
  if (t >= inicio) return STATUS_JOGO.EM_ANDAMENTO;
  return STATUS_JOGO.ABERTO;
}
