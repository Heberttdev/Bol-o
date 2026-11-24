import { ref, get, set, update } from "firebase/database";
import { database } from "./firebase";
import { planejarArquivamento } from "../utils/temporada";

async function lerNo(caminho) {
  const snap = await get(ref(database, caminho));
  return snap.exists() ? snap.val() : {};
}

export async function carregarPlanoArquivamento() {
  const [jogos, resultados, bets, perfis] = await Promise.all([
    lerNo("jogos"),
    lerNo("resultados"),
    lerNo("bets"),
    lerNo("perfisPublicos"),
  ]);
  return planejarArquivamento({ jogos, resultados, bets, perfis });
}

// Ordem: cópia completa (só admin) → classificação final (todos) → remoção do ativo.
// A remoção é uma escrita única: ou sai tudo do ranking ativo, ou nada.
export async function executarArquivamento(plano) {
  if (!plano?.id) throw new Error("Nenhum jogo do Brasileirão para arquivar.");
  const existente = await get(ref(database, `temporadas/${plano.id}`));
  if (existente.exists()) throw new Error(`A temporada ${plano.temporada.nome} já foi arquivada.`);
  const arquivadoEm = Date.now();
  await set(ref(database, `arquivo/${plano.id}`), { ...plano.arquivo, arquivadoEm });
  await set(ref(database, `temporadas/${plano.id}`), { ...plano.temporada, arquivadoEm });
  await update(ref(database), plano.remocoes);
}
